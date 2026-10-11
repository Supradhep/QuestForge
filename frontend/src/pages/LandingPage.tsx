import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Trash2 } from 'lucide-react';
import { api, activityStore, type RecentActivityItem } from '../services/api';
import { Button } from '../components/ui/Primitives';

interface LandingPageProps {
  user?: { id: number; username: string } | null;
  setUser: (user: any) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState(user?.username || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentHunts, setRecentHunts] = useState<RecentActivityItem[]>([]);

  useEffect(() => {
    setRecentHunts(activityStore.getAll());
  }, []);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) return;
    setError(null);
    setLoading(true);
    try {
      const created = await api.createUser(trimmed);
      setUser(created);
      navigate('/create');
    } catch (err) {
      console.error(err);
      setError('Could not connect to the game server on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center w-full max-w-[1680px] mx-auto px-6 sm:px-10 lg:px-14 py-10">
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        {/* Left Hero Column (7 cols) */}
        <div className="lg:col-span-7 space-y-8 py-2">
          <div className="space-y-4">
            <div className="text-xs uppercase tracking-[0.2em] text-[#E5A93C] font-medium">
              Procedural Narrative Labyrinth
            </div>
            <h1 className="font-serif-display text-6xl sm:text-7xl lg:text-8xl text-white tracking-tight font-normal leading-none">
              QuestForge
            </h1>
            <p className="text-base sm:text-lg text-[#8E8E99] max-w-2xl leading-relaxed">
              Every map is mathematically woven from scratch using Kruskal&apos;s MST, Backtracking
              lock dependency chains, and Dijkstra pathfinding. Uncover cryptic poetic clues,
              outrun the hunter, and solve the vault&apos;s riddle before time runs out.
            </p>
          </div>

          <form onSubmit={handleStart} className="max-w-xl">
            <div className="flex items-center p-2 bg-[#131318] border border-white/[0.1] rounded-2xl focus-within:border-[#E5A93C]/60 transition-colors">
              <input
                type="text"
                placeholder="Enter your explorer name..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="flex-1 bg-transparent px-4 py-3 text-base text-white placeholder-[#8E8E99] focus:outline-none"
                required
              />
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={loading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Begin Expedition
              </Button>
            </div>
            {error && <p className="text-xs text-[#E5484D] mt-2">{error}</p>}
          </form>

          {/* Feature Pillars across the bottom of left column */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <div className="p-5 rounded-2xl bg-[#131318] border border-white/[0.06] space-y-1.5">
              <div className="text-xs font-mono text-[#E5A93C]">01 · KRUSKAL &amp; DIJKSTRA</div>
              <div className="text-sm font-medium text-white">Layered Labyrinth</div>
              <p className="text-xs text-[#8E8E99] leading-relaxed">
                Guaranteed reachability with depth-scaled shortest paths for Easy, Medium, and Hard.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-[#131318] border border-white/[0.06] space-y-1.5">
              <div className="text-xs font-mono text-[#E5A93C]">02 · BACKTRACKING DAG</div>
              <div className="text-sm font-medium text-white">Cryptic Poetic Clues</div>
              <p className="text-xs text-[#8E8E99] leading-relaxed">
                Enigmatic verses hidden upstream guide you through the chambers without spoilers.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-[#131318] border border-white/[0.06] space-y-1.5">
              <div className="text-xs font-mono text-[#E5A93C]">03 · BFS STALKER &amp; RIDDLES</div>
              <div className="text-sm font-medium text-white">Living Hazards</div>
              <p className="text-xs text-[#8E8E99] leading-relaxed">
                Collapsing corridors, a relentless BFS hunter, and an AI Vault Guardian at the end.
              </p>
            </div>
          </div>
        </div>

        {/* Right Recent Expeditions Column (5 cols) */}
        <div className="lg:col-span-5 bg-[#131318] border border-white/[0.07] rounded-2xl p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between text-xs uppercase tracking-wider text-[#8E8E99]">
            <span>Recent Expeditions</span>
            {recentHunts.length > 0 && (
              <button
                onClick={() => {
                  activityStore.clear();
                  setRecentHunts([]);
                }}
                className="inline-flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear
              </button>
            )}
          </div>

          {recentHunts.length === 0 ? (
            <div className="py-16 text-center space-y-2 border border-dashed border-white/[0.06] rounded-xl">
              <div className="text-sm text-white font-medium">No Expeditions Logged Yet</div>
              <p className="text-xs text-[#8E8E99] max-w-xs mx-auto">
                Enter your name on the left to generate your first procedural labyrinth.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentHunts.slice(0, 6).map((item) => (
                <div
                  key={item.huntId}
                  onClick={() =>
                    navigate(
                      item.status === 'IN_PROGRESS' && item.sessionId
                        ? `/play/${item.sessionId}`
                        : `/preview/${item.huntId}`
                    )
                  }
                  className="group flex items-center justify-between px-4 py-3.5 rounded-xl bg-[#0E0E12] border border-white/[0.06] hover:border-[#E5A93C]/50 transition-all cursor-pointer"
                >
                  <div className="min-w-0 pr-3">
                    <div className="text-sm font-medium text-white group-hover:text-[#E5A93C] transition-colors truncate">
                      {item.title}
                    </div>
                    <div className="text-xs text-[#8E8E99] mt-0.5">
                      {item.theme} • {item.numLocations} rooms • {item.difficulty}
                    </div>
                  </div>

                  <span className="text-xs font-mono text-[#E5A93C] group-hover:translate-x-0.5 transition-transform shrink-0">
                    {item.status === 'IN_PROGRESS' ? 'Resume →' : 'Open →'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
