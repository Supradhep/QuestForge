export interface User {
  id: number;
  username: string;
}

export interface Clue {
  id: number;
  text: string;
  information_value: number;
  time_required: number;
  difficulty: number;
  unlocks_node: string | null;
}

export interface Trap {
  id: number;
  description: string;
  energy_penalty: number;
  lives_penalty: number;
  time_penalty: number;
}

export interface Location {
  id: number;
  node_id: string;
  name: string;
  description: string;
  is_start: boolean;
  is_treasure: boolean;
  has_guardian: boolean;
  guardian_description?: string;
  guardian_condition?: string;
  clue?: Clue;
  trap?: Trap;
}

export interface Edge {
  id: number;
  from_node: string;
  to_node: string;
  distance: number;
  danger: number;
  energy_cost: number;
  time_cost: number;
}

export interface Hunt {
  id: number;
  theme: string;
  difficulty_level: string;
  difficulty_score: number;
  title: string;
  story: string;
  time_limit_minutes: number;
  created_at: string;
  enable_npc: boolean;
  enable_dynamic_graph: boolean;
  enable_guardian: boolean;
  analysis_data?: any;
  locations: Location[];
  edges: Edge[];
}

export interface PlayerMove {
  id: number;
  session_id: number;
  from_node: string;
  to_node: string;
  timestamp: string;
}

export interface GameSession {
  id: number;
  hunt_id: number;
  status: 'IN_PROGRESS' | 'WON' | 'LOST';
  current_node: string;
  lives: number;
  energy: number;
  coins: number;
  time_remaining: number;
  clues_found: number[];
  items_inventory: any[];
  npc_current_node: string | null;
  collapsed_edges: string[];
  defeated_guardians: string[];
  moves: PlayerMove[];
}
