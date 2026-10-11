import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowDown } from 'lucide-react';
import { api } from '../services/api';
import type { GameSession, Hunt } from '../types';
import { Button, Card, LoadingState } from '../components/ui/Primitives';
import { GraphCanvas } from '../components/ui/GraphCanvas';

const cleanVerse = (text?: string) => {
  if (!text) return '';
  return text.replace(/\s*\/\s*/g, '\n').trim();
};

const ResultsPage: React.FC = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<GameSession | null>(null);
  const [hunt, setHunt] = useState<Hunt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    api
      .getSession(parseInt(sessionId, 10))
      .then((s) => {
        setSession(s);
        return api.getHunt(s.hunt_id);
      })
      .then((h) => {
        setHunt(h);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [sessionId]);

  const actualRouteNodes: string[] = useMemo(() => {
    if (!hunt || !session) return [];
    const arr: string[] = [];
    const sLoc = hunt.locations.find((l) => l.is_start);
    if (sLoc) {
      arr.push(sLoc.node_id);
      if (session.moves) {
        session.moves.forEach((m) => arr.push(m.to_node));
      }
    }
    return arr;
  }, [hunt, session]);

  if (loading) return <LoadingState title="Recording Chronicle..." />;
  if (!session || !hunt) {
    return <div className="text-center mt-24 text-[#E5484D]">Results unavailable.</div>;
  }

  const isWin = session.status === 'WON';
  const analysis = hunt.analysis_data || {};
  const getLocName = (n_id: string) =>
    hunt.locations.find((l) => l.node_id === n_id)?.name || n_id;

  const cluePath: { clueText: string; unlocks: string; locName: string; foundAt: string }[] = [];
  const guardianRiddles: { locName: string; riddle: string; answer: string }[] = [];
  hunt.locations.forEach((loc) => {
    if (loc.clue && loc.clue.unlocks_node) {
      cluePath.push({
        clueText: loc.clue.text,
        unlocks: loc.clue.unlocks_node,
        locName: getLocName(loc.clue.unlocks_node),
        foundAt: loc.name,
      });
    }
    if (loc.has_guardian && (loc.guardian_description || loc.guardian_condition)) {
      const rawDesc = (loc.guardian_description || '').replace(/\\n/g, '\n');
      const marker = 'The Guardian speaks:';
      let riddleText = rawDesc;
      if (rawDesc.includes(marker)) {
        const parts = rawDesc.split(marker);
        riddleText = parts[1].trim().replace(/^["“]|["”]$/g, '');
      }
      guardianRiddles.push({
        locName: loc.name,
        riddle: riddleText,
        answer: loc.guardian_condition || 'Unknown',
      });
    }
  });

  const optLen = analysis.dijkstra_path?.length || 1;

  return (
    <div className="w-full max-w-[1680px] mx-auto px-6 sm:px-10 lg:px-14 py-10 space-y-8">
      {/* Outcome Header */}
      <div className="text-center space-y-2">
        <div
          className={`text-xs uppercase tracking-[0.2em] ${
            isWin ? 'text-[#30A46C]' : 'text-[#E5484D]'
          }`}
        >
          {isWin ? 'Expedition Complete' : 'Expedition Lost'}
        </div>
        <h1 className="font-serif-display text-5xl sm:text-6xl text-white font-normal">
          {isWin ? 'The Relic is Yours' : 'Lost in the Labyrinth'}
        </h1>
        <p className="text-sm text-[#8E8E99]">
          {hunt.title} • {actualRouteNodes.length} chambers traversed (Optimal: {optLen})
        </p>
      </div>

      {/* Map Comparison */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between text-xs uppercase tracking-wider text-[#8E8E99]">
          <span>Labyrinth Route Comparison</span>
          <span>Dijkstra Cost: {analysis.dijkstra_cost ?? 'N/A'}</span>
        </div>
        <GraphCanvas
          hunt={hunt}
          mode="comparison"
          actualRouteNodes={actualRouteNodes}
        />
      </Card>

      {/* Side-by-Side Path Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="space-y-4">
          <div className="flex items-center justify-between text-xs uppercase tracking-wider text-[#8E8E99]">
            <span>Your Path</span>
            <span className="font-mono text-white">{actualRouteNodes.length} steps</span>
          </div>
          <div className="flex flex-col items-center">
            {actualRouteNodes.map((n_id, idx) => (
              <React.Fragment key={`actual-${idx}`}>
                <div className="w-full py-2.5 px-4 rounded-xl bg-[#0E0E12] border border-white/[0.06] text-sm text-center text-white">
                  {getLocName(n_id)}
                </div>
                {idx < actualRouteNodes.length - 1 && (
                  <ArrowDown className="w-3.5 h-3.5 text-[#8E8E99] my-1" />
                )}
              </React.Fragment>
            ))}
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center justify-between text-xs uppercase tracking-wider text-[#E5A93C]">
            <span>Optimal Route (Dijkstra)</span>
            <span className="font-mono">{optLen} steps</span>
          </div>
          {analysis.dijkstra_path ? (
            <div className="flex flex-col items-center">
              {analysis.dijkstra_path.map((n_id: string, idx: number) => (
                <React.Fragment key={`opt-${idx}`}>
                  <div className="w-full py-2.5 px-4 rounded-xl bg-[#E5A93C]/10 border border-[#E5A93C]/30 text-sm text-center text-[#F6D58E]">
                    {getLocName(n_id)}
                  </div>
                  {idx < analysis.dijkstra_path.length - 1 && (
                    <ArrowDown className="w-3.5 h-3.5 text-[#E5A93C]/50 my-1" />
                  )}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#8E8E99]">Unavailable</p>
          )}
        </Card>
      </div>

      {/* Guardian Riddle & Answer Reveal */}
      {guardianRiddles.length > 0 && (
        <Card className="space-y-4">
          <div className="text-xs uppercase tracking-wider text-[#8E8E99]">
            Vault Guardian Riddle &amp; Answer
          </div>
          <div className="space-y-3">
            {guardianRiddles.map((g, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-[#0E0E12] border border-[#E5A93C]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm"
              >
                <div className="space-y-1">
                  <div className="text-xs text-[#8E8E99]">
                    Guardian at {g.locName}
                  </div>
                  <div className="text-[#F6D58E] italic whitespace-pre-line">&ldquo;{cleanVerse(g.riddle)}&rdquo;</div>
                </div>
                <div className="px-3.5 py-2 rounded-lg bg-[#E5A93C]/15 border border-[#E5A93C]/40 text-xs font-mono text-[#E5A93C] shrink-0">
                  Answer: <span className="text-white font-semibold uppercase">{g.answer}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Clue Trail */}
      {cluePath.length > 0 && (
        <Card className="space-y-4">
          <div className="text-xs uppercase tracking-wider text-[#8E8E99]">
            Post-Expedition Clue Reveal
          </div>
          <div className="space-y-3">
            {cluePath.map((clue, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-[#0E0E12] border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm"
              >
                <div className="space-y-1">
                  <div className="text-xs text-[#8E8E99]">
                    Clue #{idx + 1} (found in {clue.foundAt})
                  </div>
                  <div className="text-[#D4D4D8] italic whitespace-pre-line">&ldquo;{cleanVerse(clue.clueText)}&rdquo;</div>
                </div>
                <div className="text-xs font-mono text-[#E5A93C] shrink-0">
                  → Pointed to {clue.locName}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
        <Button
          variant="primary"
          size="lg"
          onClick={() => navigate('/create')}
        >
          Start Another Expedition
        </Button>
        <Button
          variant="secondary"
          size="lg"
          onClick={() => navigate(`/analysis/${hunt.id}`)}
        >
          View Algorithm Analysis
        </Button>
      </div>
    </div>
  );
};

export default ResultsPage;
