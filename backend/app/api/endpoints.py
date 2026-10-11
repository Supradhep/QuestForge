from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import json

from app.database.database import get_db
from app.models.models import User, Hunt, Location, Edge, Clue, Trap, GameSession, PlayerMove, LeaderboardEntry
from app.schemas import schemas
from app.game.generator import generate_hunt
from app.algorithms.bfs import solve_bfs
from app.algorithms.dijkstra import solve_dijkstra
from app.algorithms.greedy import recommend_clue_greedy
from app.ai.service import get_lore, gemini_ai_service
import random

router = APIRouter()

# --- User Endpoints ---

@router.post("/users", response_model=schemas.UserBase)
def create_or_get_user(username: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        user = User(username=username)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

# --- Hunt Endpoints ---

@router.post("/hunts/generate", response_model=schemas.HuntBase)
def api_generate_hunt(request: schemas.HuntGenerateRequest, db: Session = Depends(get_db)):
    hunt_data = generate_hunt(
        theme=request.theme,
        difficulty_level=request.difficulty,
        num_locations=request.num_locations,
        num_clues=request.num_clues,
        num_traps=request.num_traps,
        time_limit=request.time_limit,
        enable_npc=request.enable_npc,
        enable_dynamic_graph=request.enable_dynamic_graph,
        enable_guardian=request.enable_guardian
    )
    
    # Save to database
    db_hunt = Hunt(**hunt_data["hunt"])
    db.add(db_hunt)
    db.commit()
    db.refresh(db_hunt)
    
    # Save Locations
    db_locations = {}
    for loc_data in hunt_data["locations"]:
        db_loc = Location(hunt_id=db_hunt.id, **loc_data)
        db.add(db_loc)
        db.commit()
        db.refresh(db_loc)
        db_locations[db_loc.node_id] = db_loc.id
        
    # Save Edges
    for edge_data in hunt_data["edges"]:
        edge_data.pop("cost", None)
        db_edge = Edge(hunt_id=db_hunt.id, **edge_data)
        db.add(db_edge)
        
    # Save Clues & Traps
    for clue_data in hunt_data["clues"]:
        node_id = clue_data.pop("location_node_id")
        db_clue = Clue(location_id=db_locations[node_id], **clue_data)
        db.add(db_clue)
        
    for trap_data in hunt_data["traps"]:
        node_id = trap_data.pop("location_node_id")
        db_trap = Trap(location_id=db_locations[node_id], **trap_data)
        db.add(db_trap)
        
    db.commit()
    db.refresh(db_hunt)
    return db_hunt

@router.get("/hunts/{hunt_id}", response_model=schemas.HuntBase)
def get_hunt(hunt_id: int, db: Session = Depends(get_db)):
    hunt = db.query(Hunt).filter(Hunt.id == hunt_id).first()
    if not hunt:
        raise HTTPException(status_code=404, detail="Hunt not found")
    return hunt

# --- Game Endpoints ---

@router.post("/hunts/{hunt_id}/start", response_model=schemas.GameSessionBase)
def start_hunt(hunt_id: int, user_id: int, db: Session = Depends(get_db)):
    hunt = db.query(Hunt).filter(Hunt.id == hunt_id).first()
    if not hunt:
        raise HTTPException(status_code=404, detail="Hunt not found")
        
    start_loc = next((loc for loc in hunt.locations if loc.is_start), None)
    if not start_loc:
        raise HTTPException(status_code=500, detail="Hunt has no start location")
        
    if hunt.difficulty_level == "Easy":
        start_lives = 5
        start_energy = 120
    elif hunt.difficulty_level == "Hard":
        start_lives = 2
        start_energy = 80
    else:
        start_lives = 3
        start_energy = 100

    session = GameSession(
        user_id=user_id,
        hunt_id=hunt_id,
        status="IN_PROGRESS",
        current_node=start_loc.node_id,
        lives=start_lives,
        energy=start_energy,
        time_remaining=hunt.time_limit_minutes * 60,
        clues_found=[],
        items_inventory=[],
        npc_current_node=next((loc.node_id for loc in hunt.locations if loc.is_treasure), None) if hunt.enable_npc else None,
        collapsed_edges=[],
        defeated_guardians=[]
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

@router.get("/sessions/{session_id}", response_model=schemas.GameSessionBase)
def get_session(session_id: int, db: Session = Depends(get_db)):
    session = db.query(GameSession).filter(GameSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@router.post("/sessions/{session_id}/move", response_model=schemas.MoveResponse)
def move_player(session_id: int, request: schemas.MoveRequest, db: Session = Depends(get_db)):
    session = db.query(GameSession).filter(GameSession.id == session_id).first()
    if not session or session.status != "IN_PROGRESS":
        raise HTTPException(status_code=400, detail="Invalid session")
        
    # Check if edge exists
    edge = db.query(Edge).filter(
        Edge.hunt_id == session.hunt_id,
        ((Edge.from_node == session.current_node) & (Edge.to_node == request.to_node)) |
        ((Edge.to_node == session.current_node) & (Edge.from_node == request.to_node))
    ).first()
    
    if not edge:
        return {"success": False, "message": "Invalid move, no path exists.", "session": session}
        
    # Check if edge is collapsed
    edge_str = f"{session.current_node}-{request.to_node}"
    edge_str_rev = f"{request.to_node}-{session.current_node}"
    if edge_str in session.collapsed_edges or edge_str_rev in session.collapsed_edges:
        return {"success": False, "message": "This path has collapsed! You must find another way.", "session": session}
        
    # Check if target node has a guardian
    loc = db.query(Location).filter(Location.hunt_id == session.hunt_id, Location.node_id == request.to_node).first()
    if loc and loc.has_guardian and request.to_node not in session.defeated_guardians:
        return {
            "success": False, 
            "message": "A Guardian blocks your path!", 
            "session": session, 
            "event": {
                "type": "guardian", 
                "node_id": request.to_node,
                "description": loc.guardian_description,
                "condition": loc.guardian_condition
            }
        }
    
    # Save the move to the database
    new_move = PlayerMove(
        session_id=session.id,
        from_node=session.current_node,
        to_node=request.to_node
    )
    db.add(new_move)
    
    session.current_node = request.to_node
    session.energy -= edge.energy_cost
    session.time_remaining -= edge.time_cost
    
    event = None
    
    # 1. Dynamic Graph Collapsing
    hunt = db.query(Hunt).filter(Hunt.id == session.hunt_id).first()
    if hunt.enable_dynamic_graph:
        collapse_chance = 0.25 if hunt.difficulty_level == "Hard" else (0.08 if hunt.difficulty_level == "Easy" else 0.15)
        if random.random() < collapse_chance:
            adj_edges = db.query(Edge).filter(
                Edge.hunt_id == hunt.id,
                ((Edge.from_node == session.current_node) | (Edge.to_node == session.current_node))
            ).all()
            valid_collapse = [e for e in adj_edges if not (
                (e.from_node == request.to_node and e.to_node == new_move.from_node) or 
                (e.to_node == request.to_node and e.from_node == new_move.from_node)
            )]
            if valid_collapse:
                chosen = random.choice(valid_collapse)
                collapse_str = f"{chosen.from_node}-{chosen.to_node}"
                if collapse_str not in session.collapsed_edges:
                    new_collapsed = list(session.collapsed_edges)
                    new_collapsed.append(collapse_str)
                    session.collapsed_edges = new_collapsed
                    if not event:
                        event = {"type": "collapse", "description": "You hear a loud rumble! A pathway behind you just collapsed!"}

    # 2. NPC Movement
    npc_event = None
    if hunt.enable_npc and session.npc_current_node:
        # Build graph of valid edges (not collapsed)
        all_edges = db.query(Edge).filter(Edge.hunt_id == hunt.id).all()
        npc_graph = {}
        for e in all_edges:
            estr1 = f"{e.from_node}-{e.to_node}"
            estr2 = f"{e.to_node}-{e.from_node}"
            if estr1 not in session.collapsed_edges and estr2 not in session.collapsed_edges:
                npc_graph.setdefault(e.from_node, []).append(e.to_node)
                npc_graph.setdefault(e.to_node, []).append(e.from_node)
                
        # Safe BFS
        if session.npc_current_node in npc_graph and session.current_node in npc_graph:
            bfs_res = solve_bfs(npc_graph, session.npc_current_node, session.current_node)
            path = bfs_res.get('path', [])
            if path and len(path) > 1:
                # Move NPC one step toward player
                session.npc_current_node = path[1]
                remaining_dist = len(path) - 1 # Distance after NPC moves
                if session.npc_current_node == session.current_node:
                    session.lives -= 1
                    npc_event = {"type": "npc_attack", "description": "The Hunter caught up to you and struck!"}
                elif remaining_dist <= 2:
                    npc_event = {"type": "npc_near", "description": "You hear heavy footsteps right outside the room... The Hunter is closing in!"}

    # Check for trap/clue/treasure
    loc = db.query(Location).filter(Location.hunt_id == session.hunt_id, Location.node_id == request.to_node).first()
    if loc:
        if loc.trap:
            session.energy -= loc.trap.energy_penalty
            session.lives -= loc.trap.lives_penalty
            session.time_remaining -= loc.trap.time_penalty
            event = {"type": "trap", "description": loc.trap.description}
            
        if loc.clue and loc.clue.id not in session.clues_found:
            new_clues = list(session.clues_found)
            new_clues.append(loc.clue.id)
            session.clues_found = new_clues
            event = {"type": "clue", "text": loc.clue.text}
            
        if loc.is_treasure:
            session.status = "WON"
            session.end_time = datetime.utcnow()

    # Prioritize NPC attack/proximity events so player always gets the warning
    if npc_event:
        if not event or npc_event.get("type") == "npc_attack":
            event = npc_event
        else:
            # Combine if both occurred on same turn (e.g. clue found + hunter nearby)
            event = {
                "type": "npc_near",
                "description": f"{event.get('description') or event.get('text', '')}\n\n⚠️ {npc_event['description']}"
            }
            
    if session.energy <= 0 or session.lives <= 0 or session.time_remaining <= 0:
        session.status = "LOST"
        session.end_time = datetime.utcnow()
        
    db.commit()
    db.refresh(session)
    return {"success": True, "message": "Moved successfully", "session": session, "event": event}

@router.post("/sessions/{session_id}/negotiate", response_model=schemas.NegotiateResponse)
def negotiate_guardian(session_id: int, request: schemas.NegotiateRequest, db: Session = Depends(get_db)):
    session = db.query(GameSession).filter(GameSession.id == session_id).first()
    if not session or session.status != "IN_PROGRESS":
        raise HTTPException(status_code=400, detail="Invalid session")
        
    loc = db.query(Location).filter(Location.hunt_id == session.hunt_id, Location.node_id == request.target_node).first()
    if not loc or not loc.has_guardian:
        raise HTTPException(status_code=400, detail="No guardian here")
        
    if request.target_node in session.defeated_guardians:
        return {"success": True, "message": "Already defeated", "ai_response": "The guardian is already defeated.", "session": session}
        
    result = gemini_ai_service.evaluate_negotiation(loc.guardian_condition, request.negotiation_text)
    
    if result.get("success"):
        new_def = list(session.defeated_guardians)
        new_def.append(request.target_node)
        session.defeated_guardians = new_def
        db.commit()
        db.refresh(session)
        
    return {
        "success": result.get("success", False),
        "message": "Negotiation complete",
        "ai_response": result.get("response", "The guardian ignores you."),
        "session": session
    }

@router.get("/hunts/{hunt_id}/analysis")
def get_algorithm_analysis(hunt_id: int, db: Session = Depends(get_db)):
    hunt = db.query(Hunt).filter(Hunt.id == hunt_id).first()
    if not hunt:
        raise HTTPException(status_code=404, detail="Hunt not found")
    return hunt.analysis_data
