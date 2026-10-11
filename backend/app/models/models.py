from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    sessions = relationship("GameSession", back_populates="user")
    leaderboard_entries = relationship("LeaderboardEntry", back_populates="user")

class Hunt(Base):
    __tablename__ = "hunts"
    id = Column(Integer, primary_key=True, index=True)
    theme = Column(String)
    difficulty_level = Column(String) # Easy, Medium, Hard
    difficulty_score = Column(Float) # e.g. 8.6
    title = Column(String)
    story = Column(Text)
    time_limit_minutes = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Novelty Features Toggles
    enable_npc = Column(Boolean, default=False)
    enable_dynamic_graph = Column(Boolean, default=False)
    enable_guardian = Column(Boolean, default=False)

    # Store graph metadata for analysis page
    analysis_data = Column(JSON) # e.g. {"bfs_shortest": 7, "dijkstra_cost": 47, "mst_edges": 11}

    locations = relationship("Location", back_populates="hunt", cascade="all, delete-orphan")
    edges = relationship("Edge", back_populates="hunt", cascade="all, delete-orphan")
    sessions = relationship("GameSession", back_populates="hunt")
    leaderboard_entries = relationship("LeaderboardEntry", back_populates="hunt")

class Location(Base):
    __tablename__ = "locations"
    id = Column(Integer, primary_key=True, index=True)
    hunt_id = Column(Integer, ForeignKey("hunts.id"))
    node_id = Column(String) # Internal graph ID like "start", "loc_1", "treasure"
    name = Column(String)
    description = Column(Text)
    is_start = Column(Boolean, default=False)
    is_treasure = Column(Boolean, default=False)
    has_guardian = Column(Boolean, default=False)
    guardian_description = Column(Text, nullable=True)
    guardian_condition = Column(Text, nullable=True)
    
    hunt = relationship("Hunt", back_populates="locations")
    clue = relationship("Clue", uselist=False, back_populates="location")
    trap = relationship("Trap", uselist=False, back_populates="location")

class Edge(Base):
    __tablename__ = "edges"
    id = Column(Integer, primary_key=True, index=True)
    hunt_id = Column(Integer, ForeignKey("hunts.id"))
    from_node = Column(String) # FK to location node_id
    to_node = Column(String) # FK to location node_id
    distance = Column(Integer)
    danger = Column(Integer)
    energy_cost = Column(Integer)
    time_cost = Column(Integer)
    
    hunt = relationship("Hunt", back_populates="edges")

class Clue(Base):
    __tablename__ = "clues"
    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"))
    text = Column(Text)
    information_value = Column(Integer)
    time_required = Column(Integer)
    difficulty = Column(Integer)
    unlocks_node = Column(String, nullable=True) # Node ID that this clue unlocks (backtracking dependency)
    
    location = relationship("Location", back_populates="clue")

class Trap(Base):
    __tablename__ = "traps"
    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"))
    description = Column(Text)
    energy_penalty = Column(Integer)
    lives_penalty = Column(Integer)
    time_penalty = Column(Integer)
    
    location = relationship("Location", back_populates="trap")

class GameSession(Base):
    __tablename__ = "game_sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    hunt_id = Column(Integer, ForeignKey("hunts.id"))
    status = Column(String) # IN_PROGRESS, WON, LOST
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    
    current_node = Column(String)
    lives = Column(Integer, default=3)
    energy = Column(Integer, default=100)
    coins = Column(Integer, default=100)
    time_remaining = Column(Integer)
    
    clues_found = Column(JSON, default=list) # List of clue IDs
    items_inventory = Column(JSON, default=list) # From Knapsack
    
    # Novelty Feature States
    npc_current_node = Column(String, nullable=True)
    collapsed_edges = Column(JSON, default=list) # List of string representations e.g., "loc_1-loc_2"
    defeated_guardians = Column(JSON, default=list) # List of node_ids where guardians were defeated
    
    user = relationship("User", back_populates="sessions")
    hunt = relationship("Hunt", back_populates="sessions")
    moves = relationship("PlayerMove", back_populates="session")

class PlayerMove(Base):
    __tablename__ = "player_moves"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("game_sessions.id"))
    from_node = Column(String)
    to_node = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    session = relationship("GameSession", back_populates="moves")

class LeaderboardEntry(Base):
    __tablename__ = "leaderboard"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    hunt_id = Column(Integer, ForeignKey("hunts.id"))
    score = Column(Integer)
    time_taken = Column(Integer)
    completed_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="leaderboard_entries")
    hunt = relationship("Hunt", back_populates="leaderboard_entries")
