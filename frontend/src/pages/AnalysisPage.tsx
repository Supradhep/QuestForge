import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { api } from '../services/api';
import type { Hunt } from '../types';
import { Card, LoadingState } from '../components/ui/Primitives';
import { GraphCanvas } from '../components/ui/GraphCanvas';

const AnalysisPage: React.FC = () => {
  const { huntId } = useParams();
  const navigate = useNavigate();
  const [hunt, setHunt] = useState<Hunt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (huntId) {
      setLoading(true);
      api
        .getHunt(parseInt(huntId, 10))
        .then((h) => {
          setHunt(h);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [huntId]);

  if (loading) return <LoadingState title="Loading Algorithm Metrics..." />;
  if (!hunt) return <div className="text-center mt-24 text-[#E5484D]">Not found.</div>;

  const data = hunt.analysis_data || {};

  const algorithms = [
    {
      name: "Kruskal's Minimum Spanning Tree",
      complexity: 'O(E log E)',
      metric: `${data.mst_base_edges} base edges (${data.total_edges || hunt.edges.length} total)`,
      desc: 'Builds the connected dungeon backbone so every chamber is guaranteed reachable without isolated islands.',
    },
    {
      name: 'Breadth-First Search (BFS)',
      complexity: 'O(V + E)',
      metric: `${data.bfs_shortest} minimum steps`,
      desc: 'Verifies unweighted reachability from Start to Vault and powers the Hunter stalker movement.',
    },
    {
      name: "Dijkstra's Shortest Path",
      complexity: 'O((V + E) log V)',
      metric: `Cost ${data.dijkstra_cost} (${data.dijkstra_nodes_explored} nodes relaxed)`,
      desc: 'Evaluates composite edge weights (distance, time, energy, and risk) to find the true optimal route.',
    },
    {
      name: 'Backtracking Lock Resolver',
      complexity: 'DAG State-Space',
      metric: `${data.backtracking_states_explored} states explored`,
      desc: 'Places clues strictly upstream of locked rooms and prunes any circular dependency deadlocks.',
    },
    {
      name: '0/1 Knapsack Loadout',
      complexity: 'O(N × W)',
      metric: 'Ready',
      desc: 'Dynamic programming module for optimizing item selection under strict capacity limits.',
    },
    {
      name: 'Difficulty Scoring Engine',
      complexity: 'O(1)',
      metric: `${hunt.difficulty_score} / 10`,
      desc: 'Weighs path length, cyclic branching density, traps, and clue chain depth into a single score.',
    },
  ];

  return (
    <div className="w-full max-w-[1680px] mx-auto px-6 sm:px-10 lg:px-14 py-10 space-y-8">
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-xs text-[#8E8E99] hover:text-white mb-4 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="font-serif-display text-4xl sm:text-5xl text-white font-normal">
          Under the Hood
        </h1>
        <p className="text-sm text-[#8E8E99] mt-1">
          Graph algorithms and telemetry for &ldquo;{hunt.title}&rdquo;
        </p>
      </div>

      <GraphCanvas hunt={hunt} mode="analysis" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {algorithms.map((alg) => (
          <Card key={alg.name} className="p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-medium text-white">{alg.name}</h3>
                <span className="font-mono text-xs text-[#E5A93C]">{alg.complexity}</span>
              </div>
              <p className="text-xs text-[#8E8E99] leading-relaxed">{alg.desc}</p>
            </div>
            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
              <span className="text-[#8E8E99]">Telemetry</span>
              <span className="font-mono text-white">{alg.metric}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AnalysisPage;