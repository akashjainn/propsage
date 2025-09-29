'use client';

import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Target, Play, ArrowLeft } from 'lucide-react';
import { PropDrawer } from './PropDrawer';
import EdgeEvidenceDrawer from './EdgeEvidenceDrawer';
import { AppShell, SectionHeader } from '@/ui';
import { HoverCard, AnimatedList, Skeleton, AnimatedPercentage, PageTransition } from '@/components/ui/motion';
import { staggerChildren, staggerItem, easeOut, springGentle } from '@/lib/motion';

interface GameProp {
  propType: string;
  propLabel: string;
  marketLine: number;
  fairLine: number;
  edgePct: number;
  confidence: 'high' | 'med' | 'low';
  bullets: Array<{ title: string }>;
  analysis?: string;
}

interface Player {
  playerId: string;
  playerName: string;
  team: string;
  position: string;
  props: GameProp[];
}

interface GameDashboardProps {
  gameId: string;
  gameTitle: string;
  onBack: () => void;
}

export interface GameDashboardHandle {
  focusProp: (propType: string) => void;
}

const GameDashboard = forwardRef<GameDashboardHandle, GameDashboardProps>(function GameDashboard({ gameId, gameTitle, onBack }, ref) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEdge, setSelectedEdge] = useState<any | null>(null);
  const [evidenceOpen, setEvidenceOpen] = useState(false);

  useImperativeHandle(ref, () => ({
    focusProp: (propType: string) => {
      // Find the prop and open its drawer
      for (const player of players) {
        const prop = player.props.find(p => p.propType === propType);
        if (prop) {
          const edge = {
            id: `${player.playerId}_${prop.propType}`,
            gameId: gameId,
            player: player.playerName,
            team: player.team,
            market: prop.propLabel,
            marketLine: prop.marketLine,
            fairLine: prop.fairLine,
            edgePct: prop.edgePct,
            confidence: prop.confidence === 'high' ? 0.9 : prop.confidence === 'med' ? 0.75 : 0.6,
            bullets: prop.bullets?.map(b => b.title) || [],
            analysis: prop.analysis
          };
          setSelectedEdge(edge);
          setEvidenceOpen(true);
          break;
        }
      }
    }
  }));

  useEffect(() => {
    // Use the insights API instead of the hardcoded games API
    fetch(`/api/insights/${gameId}`)
      .then(async res => {
        const json = await res.json();
        if (typeof window !== 'undefined') {
          console.debug('[GameDashboard] /api/insights response', { gameId, json });
        }
        return json;
      })
      .then(data => {
        if (data.players) {
          setPlayers(data.players);
        } else if (data.insights) {
          // Transform insights array into players structure
          const playersMap = new Map();
          data.insights.forEach((prop: any) => {
            if (!playersMap.has(prop.playerId)) {
              playersMap.set(prop.playerId, {
                playerId: prop.playerId,
                playerName: prop.player,
                team: prop.team,
                position: prop.position,
                props: []
              });
            }
            
            // Format propType into a readable label
            const propLabel = prop.propType
              .split('_')
              .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
            
            // Convert confidence number to category
            let confidenceCategory = 'med';
            if (prop.confidence >= 90) confidenceCategory = 'high';
            else if (prop.confidence < 70) confidenceCategory = 'low';
            
            // Transform bullets from string array to object array if needed
            const bulletObjects = prop.bullets.map((bullet: string | { title: string }) => 
              typeof bullet === 'string' ? { title: bullet } : bullet
            );
            
            playersMap.get(prop.playerId).props.push({
              propType: prop.propType,
              propLabel: propLabel,
              marketLine: prop.marketLine,
              fairLine: prop.fairLine,
              edgePct: prop.edge,
              confidence: confidenceCategory,
              bullets: bulletObjects,
              analysis: prop.analysis
            });
          });
          setPlayers(Array.from(playersMap.values()));
        } else if (data.props) {
          // Legacy support for old props format
          const playersMap = new Map();
          data.props.forEach((prop: any) => {
            if (!playersMap.has(prop.playerId)) {
              playersMap.set(prop.playerId, {
                playerId: prop.playerId,
                playerName: prop.playerName || prop.player,
                team: prop.team,
                position: prop.position,
                props: []
              });
            }
            playersMap.get(prop.playerId).props.push({
              propType: prop.propType || prop.stat,
              propLabel: prop.propLabel || prop.label,
              marketLine: prop.marketLine || prop.line,
              fairLine: prop.fairLine,
              edgePct: prop.edgePct || prop.edge,
              confidence: prop.confidence || 'med',
              bullets: prop.bullets || []
            });
          });
          setPlayers(Array.from(playersMap.values()));
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load from insights API, trying props API:', err);
        
        // Fallback to props API if insights fails
        fetch(`/api/games/${gameId}/props`)
          .then(async res => {
            const json = await res.json();
            if (typeof window !== 'undefined') {
              console.debug('[GameDashboard] fallback /api/games/[gameId]/props response', { gameId, json });
            }
            return json;
          })
          .then(data => {
            if (data.props) {
              // Legacy support for old props format
              const playersMap = new Map();
              data.props.forEach((prop: any) => {
                if (!playersMap.has(prop.playerId)) {
                  playersMap.set(prop.playerId, {
                    playerId: prop.playerId,
                    playerName: prop.playerName || prop.player,
                    team: prop.team,
                    position: prop.position,
                    props: []
                  });
                }
                playersMap.get(prop.playerId).props.push({
                  propType: prop.propType || prop.stat,
                  propLabel: prop.propLabel || prop.label,
                  marketLine: prop.marketLine || prop.line,
                  fairLine: prop.fairLine,
                  edgePct: prop.edgePct || prop.edge,
                  confidence: prop.confidence || 'med',
                  bullets: prop.bullets || []
                });
              });
              setPlayers(Array.from(playersMap.values()));
            }
            setLoading(false);
          })
          .catch(fallbackErr => {
            console.error('Both APIs failed:', fallbackErr);
            setLoading(false);
          });
      });
  }, [gameId]);

  const handlePropSelect = (playerId: string, playerName: string, prop: GameProp, team: string) => {
    const edge = {
      id: `${playerId}_${prop.propType}`,
      gameId: gameId,
      player: playerName,
      team: team,
      market: prop.propLabel,
      marketLine: prop.marketLine,
      fairLine: prop.fairLine,
      edgePct: prop.edgePct,
      confidence: prop.confidence === 'high' ? 0.9 : prop.confidence === 'med' ? 0.75 : 0.6,
      bullets: prop.bullets?.map(b => b.title) || [],
      analysis: prop.analysis
    };
    setSelectedEdge(edge);
    setEvidenceOpen(true);
  };

  const getEdgeColor = (edgePct: number) => {
    if (Math.abs(edgePct) < 5) return 'text-white/60';
    return edgePct > 0 ? 'text-green-400' : 'text-red-400';
  };

  const getEdgeBg = (edgePct: number) => {
    if (Math.abs(edgePct) < 5) return 'bg-white/5 border-white/10';
    return edgePct > 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20';
  };

  const getConfidenceBadge = (confidence: string) => {
    const colors = {
      high: 'bg-green-500/20 text-green-400 border-green-500/30',
      med: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      low: 'bg-white/10 text-white/60 border-white/20'
    };
    return colors[confidence as keyof typeof colors] || colors.low;
  };

  if (loading) {
    return (
      <AppShell>
        <PageTransition>
          <motion.div 
            className="mb-8 flex items-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={easeOut}
          >
            <motion.button
              onClick={onBack}
              className="p-3 glass rounded-xl hover:bg-white/20 transition-colors flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={springGentle}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </motion.button>
            <SectionHeader
              title={`${gameTitle} Props`}
              subtitle="Loading prop insights and video evidence..."
            />
          </motion.div>
          
          <motion.div 
            variants={staggerChildren(0.1)}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div key={i} variants={staggerItem}>
                <Skeleton className="h-40 rounded-2xl" />
              </motion.div>
            ))}
          </motion.div>
        </PageTransition>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageTransition>
        {/* Header */}
        <motion.div 
          className="mb-8 flex items-center justify-between"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={easeOut}
        >
          <div className="flex items-center gap-4">
            <motion.button
              onClick={onBack}
              className="p-3 glass rounded-xl hover:bg-white/20 transition-colors flex items-center gap-2 font-medium"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={springGentle}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </motion.button>
            <SectionHeader
              title={gameTitle}
              subtitle="Market vs Fair Line Analysis backed by video evidence"
            />
          </div>
          <motion.div 
            className="text-right glass rounded-2xl p-4"
            whileHover={{ scale: 1.02 }}
            transition={springGentle}
          >
            <div className="text-sm text-white/60 font-medium">Total Props</div>
            <div className="text-3xl font-bold tabular-nums accent">
              {players.reduce((sum, p) => sum + p.props.length, 0)}
            </div>
          </motion.div>
        </motion.div>

        {/* Top Edges Section */}
        <motion.section 
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...easeOut, delay: 0.1 }}
        >
          <SectionHeader
            title="Top Edge Opportunities"
            subtitle="Highest value props based on video analysis and fair line calculation"
          />
          <motion.div 
            variants={staggerChildren(0.1)}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6"
          >
            {players
              .flatMap(player => 
                player.props.map(prop => ({ ...prop, playerId: player.playerId, playerName: player.playerName, team: player.team, position: player.position }))
              )
              .sort((a, b) => Math.abs(b.edgePct) - Math.abs(a.edgePct))
              .slice(0, 3)
              .map((prop, i) => {
                const positive = prop.edgePct >= 0;
                return (
                  <motion.div key={`${prop.playerId}-${prop.propType}`} variants={staggerItem}>
                    <HoverCard
                      elevated
                      onClick={() => handlePropSelect(prop.playerId, prop.playerName, prop, prop.team)}
                      className="p-5 md:p-6 cursor-pointer group overflow-hidden relative min-h-[148px] flex flex-col justify-between"
                    >
                      {/* Ranking badge */}
                      <div className="absolute top-4 left-4 w-8 h-8 rounded-full glass-strong flex items-center justify-center text-sm font-bold text-white">
                        #{i + 1}
                      </div>
                      
                      {/* Gradient background */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      <div className="relative z-10 pt-6">
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex-1 min-w-0">
                            <motion.div 
                              className="font-bold text-white text-base md:text-lg mb-1 truncate"
                              whileHover={{ x: 2 }}
                              transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            >
                              {prop.playerName}
                            </motion.div>
                            <div className="text-sm text-white/60 flex items-center gap-2">
                              <span className="font-medium">{prop.team}</span>
                              <span className="w-1 h-1 rounded-full bg-white/30" />
                              <span>{prop.propLabel}</span>
                            </div>
                          </div>
                          
                          <div className="text-right flex flex-col items-end gap-1">
                            <AnimatedPercentage 
                              value={prop.edgePct} 
                              className="text-lg md:text-xl" 
                            />
                            <motion.div 
                              className="text-[11px] text-white/50 font-medium px-2 py-1 rounded-md glass-subtle"
                              whileHover={{ scale: 1.05 }}
                              transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            >
                              {prop.confidence.toUpperCase()}
                            </motion.div>
                          </div>
                        </div>
                        
                        {/* Enhanced prop lines visual */}
                        <div className="flex items-stretch gap-2">
                          <div className="flex-1 flex items-center justify-center rounded-lg border border-white/15 glass-subtle px-2 py-1.5">
                            <span className="text-[10px] text-white/40 mr-1">M</span>
                            <span className="font-semibold tabular-nums text-sm">{prop.marketLine}</span>
                          </div>
                          <div className="flex-1 flex items-center justify-center rounded-lg border border-white/15 glass-subtle px-2 py-1.5">
                            <span className="text-[10px] text-white/40 mr-1">F</span>
                            <span className="font-semibold tabular-nums text-sm">{prop.fairLine}</span>
                          </div>
                          <div className={`flex-1 flex items-center justify-center rounded-lg border px-2 py-1.5 font-bold text-sm ${positive ? 'border-green-400/30 text-green-300 bg-green-400/5' : 'border-red-400/30 text-red-300 bg-red-400/5'}`}> 
                            {positive ? 'OVR' : 'UND'}
                          </div>
                        </div>
                      </div>
                      
                      {/* Click indicator */}
                      <motion.div 
                        className="absolute bottom-2 right-2 w-6 h-6 rounded-full glass-subtle flex items-center justify-center opacity-0 group-hover:opacity-100"
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <svg className="w-3 h-3 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </motion.div>
                    </HoverCard>
                  </motion.div>
                );
              })}
          </motion.div>
        </motion.section>

        {/* All Players Grid */}
        <motion.section 
          className="space-y-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...easeOut, delay: 0.2 }}
        >
          <SectionHeader
            title="All Players & Props"
            subtitle="Complete breakdown with video evidence for each prop bet"
          />
          <motion.div
            variants={staggerChildren(0.1)}
            initial="initial"
            animate="animate"
            className="space-y-8"
          >
            {players.map(player => (
              <motion.div key={player.playerId} variants={staggerItem}>
                <div className="glass rounded-3xl p-8">
                  <motion.div 
                    className="flex items-center gap-6 mb-8"
                    whileHover={{ x: 4 }}
                    transition={springGentle}
                  >
                    <motion.div 
                      className="w-16 h-16 bg-gradient-to-br from-[var(--mint)] to-[var(--iris)] rounded-2xl flex items-center justify-center text-xl font-bold shadow-lg"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={springGentle}
                    >
                      {player.playerName.split(' ').map(n => n[0]).join('')}
                    </motion.div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-white">{player.playerName}</h3>
                      <p className="text-white/60 font-medium">{player.position} • {player.team}</p>
                    </div>
                    <motion.div 
                      className="text-right glass-subtle rounded-2xl p-4"
                      whileHover={{ scale: 1.05 }}
                      transition={springGentle}
                    >
                      <div className="text-sm text-white/60 font-medium">Props Available</div>
                      <div className="text-2xl font-bold accent tabular-nums">{player.props.length}</div>
                    </motion.div>
                  </motion.div>

                  <motion.div 
                    variants={staggerChildren(0.05)}
                    initial="initial"
                    animate="animate"
                    className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
                  >
                    {player.props.map(prop => {
                      const positive = prop.edgePct >= 0;
                      return (
                        <motion.div key={prop.propType} variants={staggerItem}>
                          <HoverCard
                            elevated
                            onClick={() => handlePropSelect(player.playerId, player.playerName, prop, player.team)}
                            className="p-5 cursor-pointer group overflow-hidden relative"
                          >
                            {/* Gradient background */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            
                            <div className="relative z-10">
                              <div className="flex items-center justify-between mb-4">
                                <motion.span 
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                                    prop.confidence === 'high' 
                                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                      : prop.confidence === 'med'
                                      ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                      : 'bg-white/10 text-white/60 border-white/20'
                                  }`}
                                  whileHover={{ scale: 1.05 }}
                                  transition={springGentle}
                                >
                                  {prop.confidence.toUpperCase()}
                                </motion.span>
                                <div className="flex items-center gap-1">
                                  {Math.abs(prop.edgePct) > 10 ? (
                                    <TrendingUp className="w-4 h-4 text-green-500" />
                                  ) : Math.abs(prop.edgePct) > 5 ? (
                                    <Target className="w-4 h-4 text-yellow-500" />
                                  ) : (
                                    <TrendingDown className="w-4 h-4 text-gray-400" />
                                  )}
                                </div>
                              </div>

                              <div className="text-left mb-4">
                                <div className="font-bold text-white mb-2 text-lg">{prop.propLabel}</div>
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                  <div className="text-center p-2 rounded-lg glass-subtle">
                                    <div className="text-[10px] text-white/40 mb-1">Market</div>
                                    <div className="font-bold tabular-nums">{prop.marketLine}</div>
                                  </div>
                                  <div className="text-center p-2 rounded-lg glass-subtle">
                                    <div className="text-[10px] text-white/40 mb-1">Fair</div>
                                    <div className="font-bold tabular-nums">{prop.fairLine}</div>
                                  </div>
                                </div>
                                <motion.div 
                                  className={`text-center py-2 px-3 rounded-xl font-bold text-sm ${
                                    positive 
                                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  }`}
                                  whileHover={{ scale: 1.02 }}
                                  transition={springGentle}
                                >
                                  {positive ? 'OVER' : 'UNDER'} {Math.abs(prop.edgePct).toFixed(1)}%
                                </motion.div>
                              </div>
                            </div>
                            
                            {/* Click indicator */}
                            <motion.div 
                              className="absolute bottom-2 right-2 w-6 h-6 rounded-full glass-subtle flex items-center justify-center opacity-0 group-hover:opacity-100"
                              whileHover={{ scale: 1.1 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Play className="w-3 h-3 text-white/50" />
                            </motion.div>
                          </HoverCard>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.section>

        {/* EdgeEvidenceDrawer */}
        <EdgeEvidenceDrawer
          edge={selectedEdge}
          gameTitle={gameTitle}
          open={evidenceOpen}
          onClose={() => setEvidenceOpen(false)}
        />
      </PageTransition>
    </AppShell>
  );
});

export default GameDashboard;
