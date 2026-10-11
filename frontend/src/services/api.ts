import type { Hunt, GameSession, User } from '../types';

const API_BASE = 'http://localhost:8000/api';

export interface RecentActivityItem {
  huntId: number;
  title: string;
  theme: string;
  difficulty: string;
  difficultyScore: number;
  numLocations: number;
  sessionId?: number;
  status?: 'PREVIEW' | 'IN_PROGRESS' | 'WON' | 'LOST';
  updatedAt: string;
}

const HISTORY_KEY = 'questforge_recent_activity';

export const activityStore = {
  getAll(): RecentActivityItem[] {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  upsertHunt(hunt: Hunt, session?: GameSession) {
    try {
      const list = this.getAll();
      const existingIdx = list.findIndex((item) => item.huntId === hunt.id);
      const entry: RecentActivityItem = {
        huntId: hunt.id,
        title: hunt.title,
        theme: hunt.theme,
        difficulty: hunt.difficulty_level,
        difficultyScore: hunt.difficulty_score,
        numLocations: hunt.locations?.length || 0,
        sessionId: session?.id ?? (existingIdx >= 0 ? list[existingIdx].sessionId : undefined),
        status: session?.status ?? (existingIdx >= 0 ? list[existingIdx].status : 'PREVIEW'),
        updatedAt: new Date().toISOString(),
      };

      if (existingIdx >= 0) {
        list.splice(existingIdx, 1);
      }
      list.unshift(entry);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 12)));
    } catch {
      // ignore storage errors
    }
  },

  updateSessionStatus(huntId: number, session: GameSession) {
    try {
      const list = this.getAll();
      const idx = list.findIndex((item) => item.huntId === huntId);
      if (idx >= 0) {
        list[idx].sessionId = session.id;
        list[idx].status = session.status;
        list[idx].updatedAt = new Date().toISOString();
        localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
      }
    } catch {
      // ignore
    }
  },

  clear() {
    localStorage.removeItem(HISTORY_KEY);
  },
};

export const api = {
  async createUser(username: string): Promise<User> {
    const res = await fetch(`${API_BASE}/users?username=${encodeURIComponent(username)}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to create user');
    return res.json();
  },

  async generateHunt(params: any): Promise<Hunt> {
    const res = await fetch(`${API_BASE}/hunts/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Failed to generate hunt');
    const hunt: Hunt = await res.json();
    activityStore.upsertHunt(hunt);
    return hunt;
  },

  async getHunt(id: number): Promise<Hunt> {
    const res = await fetch(`${API_BASE}/hunts/${id}`);
    if (!res.ok) throw new Error('Failed to fetch hunt');
    const hunt: Hunt = await res.json();
    activityStore.upsertHunt(hunt);
    return hunt;
  },

  async getSession(sessionId: number): Promise<GameSession> {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}`);
    if (!res.ok) throw new Error('Failed to fetch session');
    return res.json();
  },

  async startHunt(huntId: number, userId: number): Promise<GameSession> {
    const res = await fetch(`${API_BASE}/hunts/${huntId}/start?user_id=${userId}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to start hunt');
    const session: GameSession = await res.json();
    activityStore.updateSessionStatus(huntId, session);
    return session;
  },

  async movePlayer(sessionId: number, toNode: string): Promise<any> {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to_node: toNode }),
    });
    if (!res.ok) throw new Error('Failed to move');
    const data = await res.json();
    if (data?.session) {
      activityStore.updateSessionStatus(data.session.hunt_id, data.session);
    }
    return data;
  },

  async getAnalysis(huntId: number): Promise<any> {
    const res = await fetch(`${API_BASE}/hunts/${huntId}/analysis`);
    if (!res.ok) throw new Error('Failed to fetch analysis');
    return res.json();
  },

  async negotiateGuardian(sessionId: number, targetNode: string, text: string): Promise<any> {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/negotiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_node: targetNode, negotiation_text: text }),
    });
    if (!res.ok) throw new Error('Failed to negotiate');
    return res.json();
  },
};