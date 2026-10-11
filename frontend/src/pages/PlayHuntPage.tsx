import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Zap, Clock, Key, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import type { GameSession, Hunt, Edge } from '../types';
import { Button, Card, Modal, LoadingState } from '../components/ui/Primitives';

const cleanVerse = (text?: string) => {
  if (!text) return '';
  return text.replace(/\s*\/\s*/g, '\n').trim();
};

const PlayHuntPage: React.FC = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<GameSession | null>(null);
  const [hunt, setHunt] = useState<Hunt | null>(null);
  const [loading, setLoading] = useState(true);
  const [eventMessage, setEventMessage] = useState<{ type: string; text: string } | null>(null);

  const [negotiationModal, setNegotiationModal] = useState<any | null>(null);
  const [negotiationText, setNegotiationText] = useState('');
  const [negotiationFeedback, setNegotiationFeedback] = useState<string | null>(null);
  const [negotiationSubmitting, setNegotiationSubmitting] = useState(false);
  const [moving, setMoving] = useState(false);

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
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  }, [sessionId]);

  const handleMove = async (toNode: string) => {
    if (!session || moving) return;
    setMoving(true);
    try {
      const res = await api.movePlayer(session.id, toNode);
      if (res.success) {
        setSession(res.session);
        if (res.event) {
          setEventMessage({
            type: res.event.type,
            text: res.event.text || res.event.description,
          });
        } else {
          setEventMessage(null);
        }

        if (res.session.status === 'WON' || res.session.status === 'LOST') {
          setTimeout(() => navigate(`/results/${session.id}`), 1400);
        } else {
          setMoving(false);
        }
      } else {
        setMoving(false);
        if (res.event?.type === 'guardian') {
          setNegotiationFeedback(null);
          setNegotiationModal(res.event);
        } else {
          setEventMessage({
            type: 'locked',
            text: res.message || 'This chamber is sealed. You need to find its clue first.',
          });
        }
      }
    } catch (e) {
      console.error(e);
      setMoving(false);
    }
  };

  const handleNegotiateSubmit = async () => {
    if (!negotiationText.trim() || !session || !negotiationModal) return;
    setNegotiationSubmitting(true);
    setNegotiationFeedback(null);
    try {
      const res = await api.negotiateGuardian(
        session.id,
        negotiationModal.node_id,
        negotiationText.trim()
      );
      if (res.success) {
        setSession(res.session);
        const targetNode = negotiationModal.node_id;
        setNegotiationModal(null);
        setNegotiationText('');
        handleMove(targetNode);
      } else {
        setNegotiationFeedback(res.ai_response || 'The Guardian does not accept that answer.');
      }
    } catch (e) {
      console.error(e);
      setNegotiationFeedback('Could not reach the Guardian.');
    } finally {
      setNegotiationSubmitting(false);
    }
  };

  if (loading) return <LoadingState title="Entering the Labyrinth..." />;
  if (!session || !hunt) {
    return <div className="text-center mt-24 text-[#E5484D]">Session not found.</div>;
  }

  const currentLocation = hunt.locations.find((l) => l.node_id === session.current_node);
  const adjacentEdges = hunt.edges.filter(
    (e) => e.from_node === session.current_node || e.to_node === session.current_node
  );

  const getNeighborInfo = (edge: Edge) => {
    const neighborId = edge.from_node === session.current_node ? edge.to_node : edge.from_node;
    const neighborLoc = hunt.locations.find((l) => l.node_id === neighborId);
    return { edge, neighborLoc };
  };

  const visitedNodes: string[] = [];
  const startLoc = hunt.locations.find((l) => l.is_start);
  if (startLoc) visitedNodes.push(startLoc.node_id);
  session.moves?.forEach((m) => visitedNodes.push(m.to_node));
  const visitedSet = new Set(visitedNodes);

  const parseGuardianDescription = (raw?: string) => {
    if (!raw) return { lore: 'An ancient guardian blocks the way.', riddle: '' };
    const normalized = raw.replace(/\\n/g, '\n');
    const parts = normalized.split(/The Guardian speaks:/i);
    if (parts.length > 1) {
      return {
        lore: parts[0].trim(),
        riddle: parts[1].replace(/^["'\s]+|["'\s]+$/g, '').trim(),
      };
    }
    return { lore: normalized, riddle: '' };
  };

  const guardianParsed = parseGuardianDescription(negotiationModal?.description);
  const totalCluesInHunt = hunt.locations.filter((l) => l.clue).length;

  const maxHearts = hunt.difficulty_level === 'Easy' ? 5 : hunt.difficulty_level === 'Hard' ? 2 : 3;

  return (
    <div className="w-full max-w-[1680px] mx-auto px-6 sm:px-10 lg:px-14 py-8 space-y-8">
      {/* Slim Floating HUD Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-3.5 rounded-2xl bg-[#131318] border border-white/[0.07]">
        <div className="flex items-center gap-6">
          {/* Hearts */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.max(maxHearts, session.lives) }, (_, i) => i + 1).map((idx) => (
                <Heart
                  key={idx}
                  className={`w-4 h-4 ${
                    idx <= session.lives
                      ? 'text-[#E5484D] fill-[#E5484D]'
                      : 'text-white/[0.12]'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-[#8E8E99] ml-1">{session.lives} Lives</span>
          </div>

          <div className="h-4 w-px bg-white/[0.08]" />

          {/* Energy */}
          <div className="flex items-center gap-2.5">
            <Zap className="w-4 h-4 text-[#E5A93C]" />
            <div className="w-24 h-1.5 bg-white/[0.08] rounded-full overflow-hidden hidden sm:block">
              <div
                className="h-full bg-[#E5A93C] transition-all duration-300"
                style={{ width: `${Math.max(0, Math.min(100, session.energy))}%` }}
              />
            </div>
            <span className="font-mono text-xs text-white">{session.energy} EN</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Clues */}
          <div className="flex items-center gap-1.5 text-xs">
            <Key className="w-3.5 h-3.5 text-[#529CCA]" />
            <span className="font-mono text-white">
              {session.clues_found.length}/{totalCluesInHunt}
            </span>
            <span className="text-[#8E8E99] hidden sm:inline">Clues</span>
          </div>

          <div className="h-4 w-px bg-white/[0.08]" />

          {/* Clock */}
          <div className="flex items-center gap-1.5 text-xs">
            <Clock className="w-3.5 h-3.5 text-[#8E8E99]" />
            <span className="font-mono text-white">
              {Math.floor(session.time_remaining / 60)}:
              {(session.time_remaining % 60).toString().padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Tabletop Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT: Current Chamber Story & Tactile Path Choices (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentLocation?.node_id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="space-y-5 p-8">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-[#E5A93C] mb-1">
                    {currentLocation?.is_start
                      ? 'Starting Chamber'
                      : currentLocation?.is_treasure
                      ? 'The Vault'
                      : `Step ${visitedNodes.length}`}
                  </div>
                  <h1 className="font-serif-display text-4xl sm:text-5xl text-white font-normal">
                    {currentLocation?.name}
                  </h1>
                </div>

                <p className="text-base sm:text-[17px] text-[#D4D4D8] leading-[1.75]">
                  {currentLocation?.description}
                </p>

                {/* Inline Event Toast */}
                {eventMessage && (
                  <div
                    className={`p-4 rounded-xl border text-sm ${
                      eventMessage.type === 'trap' || eventMessage.type === 'npc_attack'
                        ? 'bg-[#E5484D]/10 border-[#E5484D]/30 text-[#FF8589]'
                        : eventMessage.type === 'locked' ||
                          eventMessage.type === 'collapse' ||
                          eventMessage.type === 'npc_near'
                        ? 'bg-[#E5A93C]/10 border-[#E5A93C]/30 text-[#F6D58E]'
                        : 'bg-[#529CCA]/10 border-[#529CCA]/30 text-[#9AD0F5]'
                    }`}
                  >
                    <div className="text-[11px] font-mono uppercase tracking-wider opacity-75 mb-0.5">
                      {eventMessage.type === 'clue'
                        ? 'Clue Discovered'
                        : eventMessage.type.replace('_', ' ')}
                    </div>
                    <div className="whitespace-pre-line">{cleanVerse(eventMessage.text)}</div>
                  </div>
                )}
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* Tactile Path Choices */}
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-wider text-[#8E8E99] px-1">
              Choose Your Next Path
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {adjacentEdges.map((edge) => {
                const info = getNeighborInfo(edge);
                if (!info.neighborLoc) return null;

                const edgeStr1 = `${edge.from_node}-${edge.to_node}`;
                const edgeStr2 = `${edge.to_node}-${edge.from_node}`;
                const isCollapsed =
                  session.collapsed_edges?.includes(edgeStr1) ||
                  session.collapsed_edges?.includes(edgeStr2);
                const isVisited = visitedSet.has(info.neighborLoc.node_id);

                return (
                  <button
                    key={edge.id}
                    disabled={isCollapsed || moving}
                    onClick={() => !isCollapsed && handleMove(info.neighborLoc!.node_id)}
                    className={`group w-full px-5 py-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-4 ${
                      isCollapsed
                        ? 'bg-[#131318]/40 border-white/[0.04] opacity-40 cursor-not-allowed'
                        : 'bg-[#131318] border-white/[0.07] hover:border-[#E5A93C]/60 hover:bg-[#17171E] cursor-pointer'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`text-base font-medium transition-colors ${
                            isCollapsed
                              ? 'line-through text-[#8E8E99]'
                              : 'text-white group-hover:text-[#E5A93C]'
                          }`}
                        >
                          {info.neighborLoc.name}
                        </span>
                        {!isCollapsed && isVisited && (
                          <span className="text-[11px] text-[#30A46C]">Visited</span>
                        )}
                      </div>

                      {!isCollapsed ? (
                        <div className="flex items-center gap-3 text-xs text-[#8E8E99] font-mono mt-1">
                          <span>-{edge.energy_cost} Energy</span>
                          <span>·</span>
                          <span>{edge.time_cost}s</span>
                          <span>·</span>
                          <span className={edge.danger >= 4 ? 'text-[#E5484D]' : ''}>
                            Risk {edge.danger}
                          </span>
                        </div>
                      ) : (
                        <div className="text-xs text-[#E5484D] mt-0.5">Passage collapsed</div>
                      )}
                    </div>

                    {!isCollapsed && (
                      <ArrowRight className="w-4 h-4 text-[#8E8E99] group-hover:text-[#E5A93C] group-hover:translate-x-0.5 transition-all shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: Field Notebook & Footsteps Trail (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Field Notes (Clues) */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between text-xs uppercase tracking-wider text-[#8E8E99]">
              <span>Field Notes &amp; Clues</span>
              <span className="font-mono">
                {session.clues_found.length}/{totalCluesInHunt}
              </span>
            </div>

            {session.clues_found.length === 0 ? (
              <p className="text-xs text-[#8E8E99] py-6 text-center leading-relaxed">
                No clues uncovered yet. Explore connected chambers to find notes guiding you toward
                the vault.
              </p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {session.clues_found.map((clueId, idx) => {
                  const clueLoc = hunt.locations.find((l) => l.clue?.id === clueId);

                  return (
                    <div
                      key={clueId}
                      className="p-4 rounded-xl bg-[#0E0E12] border border-white/[0.07] space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#E5A93C] font-medium">
                          Clue #{idx + 1} • Found in {clueLoc?.name}
                        </span>
                        <span className="font-mono text-[#8E8E99]">Cryptic Note</span>
                      </div>
                      <p className="text-xs sm:text-sm text-[#D4D4D8] leading-relaxed italic whitespace-pre-line">
                        &ldquo;{cleanVerse(clueLoc?.clue?.text)}&rdquo;
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Quiet Footsteps Trail */}
          <Card className="p-6 space-y-2.5">
            <div className="text-xs uppercase tracking-wider text-[#8E8E99]">
              Path Taken ({visitedSet.size} chambers explored)
            </div>
            <div className="text-xs text-[#8E8E99] leading-relaxed">
              {visitedNodes.map((id, i) => {
                const loc = hunt.locations.find((l) => l.node_id === id);
                return (
                  <React.Fragment key={`${id}-${i}`}>
                    <span className={i === visitedNodes.length - 1 ? 'text-white font-medium' : ''}>
                      {loc?.name || id}
                    </span>
                    {i < visitedNodes.length - 1 && <span className="mx-1.5 opacity-40">→</span>}
                  </React.Fragment>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* Guardian Riddle Modal */}
      <Modal
        isOpen={Boolean(negotiationModal)}
        onClose={() => setNegotiationModal(null)}
        title="The Vault Guardian"
        subtitle="Answer the riddle to unseal the chamber"
        footer={
          <>
            <Button variant="ghost" onClick={() => setNegotiationModal(null)}>
              Step Back
            </Button>
            <Button
              variant="primary"
              isLoading={negotiationSubmitting}
              disabled={!negotiationText.trim()}
              onClick={handleNegotiateSubmit}
            >
              Speak Answer
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-[#8E8E99] leading-relaxed whitespace-pre-line">{cleanVerse(guardianParsed.lore)}</p>

          {guardianParsed.riddle && (
            <div className="p-5 rounded-xl bg-[#0E0E12] border border-[#E5A93C]/30">
              <p className="font-serif-display text-2xl text-[#F6D58E] leading-snug whitespace-pre-line">
                &ldquo;{cleanVerse(guardianParsed.riddle)}&rdquo;
              </p>
            </div>
          )}

          {negotiationFeedback && (
            <p className="text-xs text-[#FF8589]">{negotiationFeedback}</p>
          )}

          <input
            type="text"
            value={negotiationText}
            onChange={(e) => setNegotiationText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleNegotiateSubmit();
              }
            }}
            placeholder="Type your answer..."
            autoFocus
            className="w-full bg-[#0E0E12] border border-white/[0.12] rounded-xl px-4 py-3 text-sm text-white placeholder-[#8E8E99] focus:outline-none focus:border-[#E5A93C]"
          />
        </div>
      </Modal>
    </div>
  );
};

export default PlayHuntPage;