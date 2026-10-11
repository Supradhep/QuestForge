from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class ClueBase(BaseModel):
    id: int
    text: str
    information_value: int
    time_required: int
    difficulty: int
    unlocks_node: Optional[str]

    class Config:
        from_attributes = True

class TrapBase(BaseModel):
    id: int
    description: str
    energy_penalty: int
    lives_penalty: int
    time_penalty: int

    class Config:
        from_attributes = True

class LocationBase(BaseModel):
    id: int
    node_id: str
    name: str
    description: str
    is_start: bool
    is_treasure: bool
    has_guardian: bool = False
    guardian_description: Optional[str] = None
    guardian_condition: Optional[str] = None
    clue: Optional[ClueBase] = None
    trap: Optional[TrapBase] = None

    class Config:
        from_attributes = True

class EdgeBase(BaseModel):
    id: int
    from_node: str
    to_node: str
    distance: int
    danger: int
    energy_cost: int
    time_cost: int

    class Config:
        from_attributes = True

class HuntBase(BaseModel):
    id: int
    theme: str
    difficulty_level: str
    difficulty_score: float
    title: str
    story: str
    time_limit_minutes: int
    created_at: datetime
    
    enable_npc: bool = False
    enable_dynamic_graph: bool = False
    enable_guardian: bool = False
    
    analysis_data: Optional[Dict[str, Any]] = None
    locations: List[LocationBase] = []
    edges: List[EdgeBase] = []

    class Config:
        from_attributes = True

class HuntGenerateRequest(BaseModel):
    theme: str
    difficulty: str
    num_locations: int
    num_clues: int
    num_traps: int
    time_limit: int
    
    enable_npc: bool = False
    enable_dynamic_graph: bool = False
    enable_guardian: bool = False

class UserBase(BaseModel):
    id: int
    username: str

    class Config:
        from_attributes = True

class PlayerMoveBase(BaseModel):
    id: int
    session_id: int
    from_node: str
    to_node: str
    timestamp: datetime

    class Config:
        from_attributes = True

class GameSessionBase(BaseModel):
    id: int
    hunt_id: int
    status: str
    current_node: str
    lives: int
    energy: int
    coins: int
    time_remaining: int
    clues_found: List[int]
    items_inventory: List[Dict[str, Any]]
    
    npc_current_node: Optional[str] = None
    collapsed_edges: List[str] = []
    defeated_guardians: List[str] = []
    
    moves: List[PlayerMoveBase] = []

    class Config:
        from_attributes = True

class MoveRequest(BaseModel):
    to_node: str

class MoveResponse(BaseModel):
    success: bool
    message: str
    session: GameSessionBase
    event: Optional[Dict[str, Any]] = None # Trap triggered, Clue found, etc.

class LeaderboardEntryBase(BaseModel):
    id: int
    user: UserBase
    hunt: HuntBase
    score: int
    time_taken: int
    completed_at: datetime

    class Config:
        from_attributes = True

class NegotiateRequest(BaseModel):
    target_node: str
    negotiation_text: str

class NegotiateResponse(BaseModel):
    success: bool
    message: str
    ai_response: str
    session: GameSessionBase
