import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { Button, Card } from '../components/ui/Primitives';

const THEMES = ['Fantasy', 'Sci-Fi', 'Pirate', 'Horror', 'Detective', 'Archaeology'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

const STAGES = [
  'Weaving the labyrinth paths...',
  'Hiding cryptic verses behind locked chambers...',
  'Setting traps and calculating the shortest route...',
  'Writing the story and guardian riddle...',
];

const CreateHuntPage: React.FC = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState('Fantasy');
  const [difficulty, setDifficulty] = useState('Medium');
  const [numLocations, setNumLocations] = useState(10);
  const [numClues, setNumClues] = useState(3);
  const [numTraps, setNumTraps] = useState(3);
  const [timeLimit, setTimeLimit] = useState(15);

  const [enableNpc, setEnableNpc] = useState(false);
  const [enableDynamicGraph, setEnableDynamicGraph] = useState(false);
  const [enableGuardian, setEnableGuardian] = useState(true);

  const [isGenerating, setIsGenerating] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const maxClues = Math.min(8, Math.max(1, numLocations - 3));
  const maxTraps = Math.min(10, Math.max(1, numLocations - 2));

  const DIFFICULTY_INFO: Record<string, { summary: string; details: string }> = {
    Easy: {
      summary: '5 Lives · 120 Energy · Shorter Vault Depth',
      details: 'Gentle poetic clues, mild trap penalties, and generous stamina.',
    },
    Medium: {
      summary: '3 Lives · 100 Energy · Moderate Vault Depth',
      details: 'Cryptic metaphorical verses, balanced labyrinth branching, and standard traps.',
    },
    Hard: {
      summary: '2 Lives · 80 Energy · Deep Vault Distance',
      details: 'Arcane poetic enigmas, heavy stamina drain, severe traps, and deep multi-hop paths.',
    },
  };

  const handleDifficultySelect = (d: string) => {
    setDifficulty(d);
    if (d === 'Easy') {
      setNumLocations(7);
      setNumClues(2);
      setNumTraps(1);
      setTimeLimit(20);
      setEnableNpc(false);
      setEnableDynamicGraph(false);
      setEnableGuardian(false);
    } else if (d === 'Medium') {
      setNumLocations(10);
      setNumClues(3);
      setNumTraps(3);
      setTimeLimit(15);
      setEnableNpc(false);
      setEnableDynamicGraph(false);
      setEnableGuardian(true);
    } else if (d === 'Hard') {
      setNumLocations(14);
      setNumClues(5);
      setNumTraps(5);
      setTimeLimit(10);
      setEnableNpc(true);
      setEnableDynamicGraph(true);
      setEnableGuardian(true);
    }
  };

  const handleLocationsChange = (val: number) => {
    setNumLocations(val);
    const nextMaxClues = Math.min(8, Math.max(1, val - 3));
    const nextMaxTraps = Math.min(10, Math.max(1, val - 2));
    if (numClues > nextMaxClues) setNumClues(nextMaxClues);
    if (numTraps > nextMaxTraps) setNumTraps(nextMaxTraps);
  };

  const handleGenerate = async () => {
    setError(null);
    setIsGenerating(true);
    setStageIndex(0);

    const interval = setInterval(() => {
      setStageIndex((prev) => (prev < STAGES.length - 1 ? prev + 1 : prev));
    }, 900);

    try {
      const hunt = await api.generateHunt({
        theme,
        difficulty,
        num_locations: numLocations,
        num_clues: numClues,
        num_traps: numTraps,
        time_limit: timeLimit,
        enable_npc: enableNpc,
        enable_dynamic_graph: enableDynamicGraph,
        enable_guardian: enableGuardian,
      });
      clearInterval(interval);
      navigate(`/preview/${hunt.id}`);
    } catch (err) {
      clearInterval(interval);
      console.error(err);
      setError('Failed to generate world. Make sure the backend server is running.');
      setIsGenerating(false);
    }
  };

  if (isGenerating) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="max-w-md w-full text-center space-y-4">
          <Loader2 className="w-7 h-7 text-[#E5A93C] animate-spin mx-auto" />
          <h2 className="font-serif-display text-4xl text-white">Forging Your World</h2>
          <p className="text-sm text-[#8E8E99] h-6 transition-all">{STAGES[stageIndex]}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1680px] mx-auto px-6 sm:px-10 lg:px-14 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-[#E5A93C] mb-1">
            Labyrinth Configuration
          </div>
          <h1 className="font-serif-display text-4xl sm:text-5xl text-white">New Expedition</h1>
        </div>
        <p className="text-sm text-[#8E8E99]">
          Shape the realm, its difficulty depth, and the hazards waiting inside.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-[#E5484D]/10 border border-[#E5484D]/30 text-xs text-[#FF8589]">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN (7 cols): Setting, Difficulty & Scale */}
        <Card className="lg:col-span-7 space-y-8 p-6 sm:p-8">
          {/* 1. Setting */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#8E8E99] mb-3">
              Realm Setting
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {THEMES.map((t) => {
                const active = theme === t;
                return (
                  <button
                    type="button"
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`py-3 px-4 rounded-xl text-sm font-medium border transition-all cursor-pointer ${
                      active
                        ? 'bg-[#E5A93C]/15 border-[#E5A93C] text-white'
                        : 'bg-[#0E0E12] border-white/[0.06] text-[#8E8E99] hover:text-white hover:border-white/[0.15]'
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Difficulty */}
          <div className="space-y-3 pt-2 border-t border-white/[0.06]">
            <label className="block text-xs uppercase tracking-wider text-[#8E8E99]">
              Difficulty Tier
            </label>
            <div className="grid grid-cols-3 gap-2 p-1.5 bg-[#0E0E12] rounded-xl border border-white/[0.06]">
              {DIFFICULTIES.map((d) => {
                const active = difficulty === d;
                return (
                  <button
                    type="button"
                    key={d}
                    onClick={() => handleDifficultySelect(d)}
                    className={`py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      active
                        ? 'bg-[#1D1D26] text-white shadow-xs border border-[#E5A93C]/40'
                        : 'text-[#8E8E99] hover:text-white'
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
            <div className="px-4 py-3 rounded-xl bg-[#0E0E12] border border-white/[0.05] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="font-mono text-[#E5A93C]">{DIFFICULTY_INFO[difficulty]?.summary}</span>
              <span className="text-[#8E8E99]">{DIFFICULTY_INFO[difficulty]?.details}</span>
            </div>
          </div>

          {/* 3. Scale Sliders in a 2x2 Widescreen Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-white/[0.06]">
            <div className="p-4 rounded-xl bg-[#0E0E12] border border-white/[0.05] space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[#8E8E99]">Chambers</span>
                <span className="font-mono text-white">{numLocations} rooms</span>
              </div>
              <input
                type="range"
                min="5"
                max="25"
                value={numLocations}
                onChange={(e) => handleLocationsChange(parseInt(e.target.value, 10))}
                className="w-full accent-[#E5A93C] cursor-pointer"
              />
            </div>

            <div className="p-4 rounded-xl bg-[#0E0E12] border border-white/[0.05] space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[#8E8E99]">Cryptic Clues</span>
                <span className="font-mono text-white">{numClues}</span>
              </div>
              <input
                type="range"
                min="0"
                max={maxClues}
                value={numClues}
                onChange={(e) => setNumClues(parseInt(e.target.value, 10))}
                className="w-full accent-[#E5A93C] cursor-pointer"
              />
            </div>

            <div className="p-4 rounded-xl bg-[#0E0E12] border border-white/[0.05] space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[#8E8E99]">Deadly Traps</span>
                <span className="font-mono text-white">{numTraps}</span>
              </div>
              <input
                type="range"
                min="0"
                max={maxTraps}
                value={numTraps}
                onChange={(e) => setNumTraps(parseInt(e.target.value, 10))}
                className="w-full accent-[#E5A93C] cursor-pointer"
              />
            </div>

            <div className="p-4 rounded-xl bg-[#0E0E12] border border-white/[0.05] space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[#8E8E99]">Time Limit</span>
                <span className="font-mono text-white">{timeLimit} min</span>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                step="5"
                value={timeLimit}
                onChange={(e) => setTimeLimit(parseInt(e.target.value, 10))}
                className="w-full accent-[#E5A93C] cursor-pointer"
              />
            </div>
          </div>
        </Card>

        {/* RIGHT COLUMN (5 cols): Twists & Launch */}
        <Card className="lg:col-span-5 space-y-6 p-6 sm:p-8">
          <div className="space-y-3">
            <label className="block text-xs uppercase tracking-wider text-[#8E8E99]">
              Labyrinth Twists
            </label>

            {[
              {
                checked: enableNpc,
                onChange: setEnableNpc,
                title: 'The Hunter',
                desc: 'A relentless BFS stalker tracks your footsteps from the vault.',
              },
              {
                checked: enableDynamicGraph,
                onChange: setEnableDynamicGraph,
                title: 'Collapsing Passages',
                desc: 'Corridors can crumble behind you, forcing alternate routes.',
              },
              {
                checked: enableGuardian,
                onChange: setEnableGuardian,
                title: 'Vault Guardian',
                desc: 'An ancient gatekeeper demands the answer to a riddle at the end.',
              },
            ].map((mod) => (
              <div
                key={mod.title}
                onClick={() => mod.onChange(!mod.checked)}
                className="flex items-center justify-between p-4 rounded-xl bg-[#0E0E12] border border-white/[0.06] hover:border-white/[0.14] transition-colors cursor-pointer select-none"
              >
                <div className="pr-4">
                  <div className="text-sm font-medium text-white">{mod.title}</div>
                  <div className="text-xs text-[#8E8E99] mt-0.5">{mod.desc}</div>
                </div>
                <div
                  className={`w-10 h-5.5 rounded-full p-0.5 transition-colors shrink-0 ${
                    mod.checked ? 'bg-[#E5A93C]' : 'bg-white/[0.12]'
                  }`}
                >
                  <div
                    className={`w-4.5 h-4.5 rounded-full bg-[#0B0B0E] transition-transform ${
                      mod.checked ? 'translate-x-4.5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-[#0E0E12] border border-white/[0.05] space-y-2 text-xs">
            <div className="flex justify-between text-[#8E8E99]">
              <span>Selected Realm</span>
              <span className="text-white font-medium">{theme}</span>
            </div>
            <div className="flex justify-between text-[#8E8E99]">
              <span>Difficulty &amp; Scale</span>
              <span className="font-mono text-white">
                {difficulty} • {numLocations} Chambers
              </span>
            </div>
            <div className="flex justify-between text-[#8E8E99]">
              <span>Clues &amp; Hazards</span>
              <span className="font-mono text-white">
                {numClues} Clues • {numTraps} Traps
              </span>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            className="w-full py-4 text-base"
            onClick={handleGenerate}
          >
            Forge Expedition
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default CreateHuntPage;