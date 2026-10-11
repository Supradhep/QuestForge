import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Hunt } from '../types';
import { Button, Card, LoadingState } from '../components/ui/Primitives';

const HuntPreviewPage: React.FC<{ user: any }> = ({ user }) => {
  const { huntId } = useParams();
  const navigate = useNavigate();
  const [hunt, setHunt] = useState<Hunt | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (huntId) {
      setLoading(true);
      api
        .getHunt(parseInt(huntId, 10))
        .then((data) => {
          setHunt(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [huntId]);

  const handleStart = async () => {
    if (!hunt) return;
    setStarting(true);
    try {
      let currentUserId = user?.id;
      if (!currentUserId) {
        const fallbackUser = await api.createUser(
          'Explorer_' + Math.floor(Math.random() * 1000)
        );
        currentUserId = fallbackUser.id;
      }
      const session = await api.startHunt(hunt.id, currentUserId);
      navigate(`/play/${session.id}`);
    } catch (err) {
      console.error(err);
      alert('Failed to start expedition.');
      setStarting(false);
    }
  };

  if (loading) return <LoadingState title="Preparing Expedition..." />;
  if (!hunt) return <div className="text-center mt-24 text-[#E5484D]">Expedition not found.</div>;

  const numClues = hunt.locations.filter((l) => l.clue).length;
  const numTraps = hunt.locations.filter((l) => l.trap).length;
  const twists = [
    hunt.enable_npc && 'The Hunter',
    hunt.enable_dynamic_graph && 'Collapsing Passages',
    hunt.enable_guardian && 'Vault Guardian',
  ].filter(Boolean);

  return (
    <div className="flex-1 flex items-center w-full max-w-[1680px] mx-auto px-6 sm:px-10 lg:px-14 py-10">
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Prologue Narrative Card (7 cols) */}
        <Card className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-between space-y-8">
          <div className="space-y-5">
            <div className="text-xs uppercase tracking-[0.2em] text-[#E5A93C]">
              {hunt.theme} • {hunt.difficulty_level} ({hunt.difficulty_score}/10)
            </div>
            <h1 className="font-serif-display text-4xl sm:text-6xl text-white font-normal leading-tight">
              {hunt.title}
            </h1>
            <p className="text-base sm:text-lg text-[#D4D4D8] leading-relaxed font-normal pt-2">
              &ldquo;{hunt.story}&rdquo;
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/[0.06]">
            <Button
              variant="primary"
              size="lg"
              isLoading={starting}
              onClick={handleStart}
              className="flex-1 py-4 text-base"
            >
              Enter the Labyrinth
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/create')}
            >
              Re-roll World
            </Button>
          </div>
        </Card>

        {/* Right Expedition Parameters & Rules Card (5 cols) */}
        <Card className="lg:col-span-5 p-8 sm:p-10 flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            <div className="text-xs uppercase tracking-wider text-[#8E8E99]">
              Expedition Telemetry
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-[#0E0E12] border border-white/[0.06]">
                <div className="text-xs text-[#8E8E99]">Chambers</div>
                <div className="font-mono text-2xl text-white mt-1">{hunt.locations.length}</div>
              </div>
              <div className="p-5 rounded-xl bg-[#0E0E12] border border-white/[0.06]">
                <div className="text-xs text-[#8E8E99]">Cryptic Clues</div>
                <div className="font-mono text-2xl text-[#E5A93C] mt-1">{numClues}</div>
              </div>
              <div className="p-5 rounded-xl bg-[#0E0E12] border border-white/[0.06]">
                <div className="text-xs text-[#8E8E99]">Hidden Traps</div>
                <div className="font-mono text-2xl text-[#E5484D] mt-1">{numTraps}</div>
              </div>
              <div className="p-5 rounded-xl bg-[#0E0E12] border border-white/[0.06]">
                <div className="text-xs text-[#8E8E99]">Time Limit</div>
                <div className="font-mono text-2xl text-white mt-1">{hunt.time_limit_minutes}m</div>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-[#0E0E12] border border-white/[0.06] space-y-2">
              <div className="text-xs uppercase tracking-wider text-[#8E8E99]">Active Twists</div>
              {twists.length > 0 ? (
                <div className="text-sm text-white font-medium">{twists.join(' · ')}</div>
              ) : (
                <div className="text-xs text-[#8E8E99]">Standard Labyrinth (No Extra Modifiers)</div>
              )}
            </div>
          </div>

          <p className="text-xs text-[#8E8E99] leading-relaxed border-t border-white/[0.06] pt-4">
            The labyrinth map remains uncharted until your expedition concludes. Read each chamber
            carefully and decipher the poetic clues to find the vault.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default HuntPreviewPage;