import random
from app.algorithms.mst import generate_map
from app.algorithms.backtracking import generate_clue_dependencies
from app.algorithms.bfs import solve_bfs
from app.algorithms.dijkstra import solve_dijkstra, find_all_paths
from app.ai.service import get_lore
from app.models.models import Hunt, Location, Edge, Clue, Trap

def calculate_difficulty_score(num_nodes, num_edges, num_clues, num_traps, path_steps, optimal_cost, difficulty_level="Medium"):
    """
    Calculates a difficulty score from 1.0 to 10.0 based on difficulty tier and graph metrics.
    """
    if difficulty_level == "Easy":
        base = 1.5
    elif difficulty_level == "Hard":
        base = 4.5
    else:
        base = 3.0
    
    # Path length contribution (up to 2.5)
    steps_factor = min(2.5, (path_steps / max(1, num_nodes)) * 3.0)
    
    # Complexity contribution (up to 1.5)
    edge_density = num_edges / max(1, num_nodes)
    complexity = min(1.5, max(0.0, (edge_density - 0.8) * 1.5))
    
    # Hazards contribution (up to 1.5)
    trap_factor = min(1.5, (num_traps / max(1, num_nodes)) * 3.5)
    
    # Clues contribution (up to 1.0)
    clue_factor = min(1.0, (num_clues / max(1, num_nodes)) * 2.0)
    
    score = base + steps_factor + complexity + trap_factor + clue_factor
    return round(min(10.0, max(1.0, score)), 1)

def generate_hunt(theme, difficulty_level, num_locations, num_clues, num_traps, time_limit, enable_npc=False, enable_dynamic_graph=False, enable_guardian=False):
    """
    Master generator function. Orchestrates all DAA algorithms and AI content.
    Returns dictionaries ready to be inserted into the DB.
    """
    # 1. Generate Nodes
    nodes = [f"loc_{i}" for i in range(num_locations)]
    start_node = nodes[0]
    treasure_node = nodes[-1]
    
    # 2. Generate Base Map (MST + extra edges)
    raw_edges = generate_map(nodes, difficulty=difficulty_level)
    
    # 3. Validation: Check reachability (BFS)
    graph = {node: [] for node in nodes}
    for e in raw_edges:
        graph[e['from_node']].append(e['to_node'])
        graph[e['to_node']].append(e['from_node'])
        
    bfs_result = solve_bfs(graph, start_node, treasure_node)
    path_steps = bfs_result['steps']
    
    # 4. Validation: Optimal cost (Dijkstra)
    dijkstra_result = solve_dijkstra(nodes, raw_edges, start_node, treasure_node)
    optimal_cost = dijkstra_result['cost']
    dijkstra_path = dijkstra_result['path']
    dijkstra_distance = dijkstra_result['distance']
    dijkstra_time = dijkstra_result['time']
    
    # 4.5. Alternative paths (DFS)
    alternative_paths = find_all_paths(nodes, raw_edges, start_node, treasure_node)
    
    # 5. Generate Clue Dependencies (Backtracking)
    deps, states_explored = generate_clue_dependencies(nodes, num_clues, start_node, treasure_node)
    # deps is a list of tuples: (clue_location, node_it_unlocks)
    
    # Calculate algorithmic difficulty
    difficulty_score = calculate_difficulty_score(
        num_nodes=len(nodes),
        num_edges=len(raw_edges),
        num_clues=num_clues,
        num_traps=num_traps,
        path_steps=path_steps,
        optimal_cost=optimal_cost,
        difficulty_level=difficulty_level
    )
    
    # Determine trap locations (randomly among non-start, non-treasure nodes)
    available_trap_nodes = [n for n in nodes if n != start_node and n != treasure_node]
    random.shuffle(available_trap_nodes)
    trap_nodes = set(available_trap_nodes[:num_traps])
    
    # Determine guardian locations
    guardian_nodes = set()
    if enable_guardian:
        guardian_nodes = {treasure_node}
    
    # Map dependencies
    clue_map = {loc: unlocks for loc, unlocks in deps}
    
    # 6. Generate AI Content via 1 Single LLM API Call
    skeleton = {
        "theme": theme,
        "difficulty_level": difficulty_level,
        "nodes": nodes,
        "start_node": start_node,
        "treasure_node": treasure_node,
        "optimal_path": dijkstra_path,
        "clue_deps": deps,
        "trap_nodes": list(trap_nodes),
        "guardian_nodes": list(guardian_nodes),
        "edges": [{"from": e["from_node"], "to": e["to_node"]} for e in raw_edges]
    }
    
    lore = get_lore(skeleton)
    
    title = lore.get("title", f"{theme} Adventure")
    story = lore.get("story", "A mysterious journey awaits.")
    
    # Build models data
    hunt_data = {
        "theme": theme,
        "difficulty_level": difficulty_level,
        "difficulty_score": difficulty_score,
        "title": title,
        "story": story,
        "time_limit_minutes": time_limit,
        "enable_npc": enable_npc,
        "enable_dynamic_graph": enable_dynamic_graph,
        "enable_guardian": enable_guardian,
        "analysis_data": {
            "bfs_shortest": path_steps,
            "dijkstra_cost": optimal_cost,
            "dijkstra_path": dijkstra_path,
            "dijkstra_distance": dijkstra_distance,
            "dijkstra_time": dijkstra_time,
            "dijkstra_nodes_explored": dijkstra_result['visited_nodes'],
            "mst_base_edges": len(nodes) - 1,
            "total_edges": len(raw_edges),
            "backtracking_states_explored": states_explored,
            "alternative_paths": alternative_paths
        }
    }
    
    locations_data = []
    clues_data = []
    traps_data = []
    loc_name_map = {}

    if difficulty_level == "Easy":
        trap_energy_range = (8, 15)
        trap_time_range = (10, 20)
        clue_diff_range = (1, 3)
    elif difficulty_level == "Hard":
        trap_energy_range = (30, 45)
        trap_time_range = (45, 90)
        clue_diff_range = (7, 10)
    else:
        trap_energy_range = (18, 30)
        trap_time_range = (20, 45)
        clue_diff_range = (4, 7)
    
    def sanitize_verse(txt: str) -> str:
        if not txt:
            return txt
        # Replace forward slashes used as line breaks with a newline
        import re
        txt = re.sub(r'\s*/\s*', '\n', txt)
        return txt.strip()

    for i, node_id in enumerate(nodes):
        is_start = (node_id == start_node)
        is_treasure = (node_id == treasure_node)
        
        node_lore = lore.get("locations", {}).get(node_id, {})
        name = node_lore.get("name", f"Chamber {i + 1}")
        desc = sanitize_verse(node_lore.get("description", "A quiet chamber with passages leading onward."))
        loc_name_map[node_id] = name
        
        guardian_desc = sanitize_verse(node_lore.get("guardian_description"))
        guardian_riddle = sanitize_verse(node_lore.get("guardian_riddle"))
        combined_desc = None
        if guardian_desc:
            combined_desc = guardian_desc
            if guardian_riddle:
                combined_desc += f'\n\nThe Guardian speaks: "{guardian_riddle}"'
                
        loc_data = {
            "node_id": node_id,
            "name": name,
            "description": desc,
            "is_start": is_start,
            "is_treasure": is_treasure,
            "has_guardian": (node_id in guardian_nodes),
            "guardian_description": combined_desc,
            "guardian_condition": node_lore.get("guardian_condition")
        }
        locations_data.append(loc_data)
        
        # Add trap if present
        if node_id in trap_nodes:
            trap_lore = lore.get("traps", {}).get(node_id, {})
            trap_desc = trap_lore.get("description", "A hidden trap activates!")
            traps_data.append({
                "location_node_id": node_id,
                "description": trap_desc,
                "energy_penalty": random.randint(*trap_energy_range),
                "lives_penalty": 1,
                "time_penalty": random.randint(*trap_time_range)
            })

    # Second pass for clues: ensure clues remain cryptic, slash-free, and never state the literal room name
    raw_clues = lore.get("clues", {})
    for node_id, unlocks_id in clue_map.items():
        target_name = loc_name_map.get(unlocks_id, unlocks_id)
        clue_lore = raw_clues.get(node_id, {}) if isinstance(raw_clues, dict) else {}
        clue_text = clue_lore.get("hint") or clue_lore.get("riddle") or ""
        
        # Remove any raw node_ids or accidental literal room names so the clue stays cryptic
        for nid, nname in loc_name_map.items():
            if nid in clue_text:
                clue_text = clue_text.replace(nid, "the hidden chamber")
            if nname and len(nname) > 3 and nname.lower() in clue_text.lower():
                import re
                clue_text = re.sub(re.escape(nname), "that veiled sanctuary", clue_text, flags=re.IGNORECASE)
                
        # Remove any forward slashes used as line breaks
        clue_text = sanitize_verse(clue_text)

        if not clue_text or clue_text.strip() == "Try looking closer.":
            clue_text = "Where ancient shadows gather and silent relics keep watch,\nthe next seal awaits your step."
            
        clues_data.append({
            "location_node_id": node_id,
            "text": clue_text,
            "information_value": random.randint(20, 50),
            "time_required": random.randint(1, 5),
            "difficulty": random.randint(*clue_diff_range),
            "unlocks_node": unlocks_id
        })
            
    edges_data = raw_edges
    
    return {
        "hunt": hunt_data,
        "locations": locations_data,
        "edges": edges_data,
        "clues": clues_data,
        "traps": traps_data
    }

