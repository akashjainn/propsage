"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { normalizePropForFocus } from '@/lib/normalize';
import { HoverCard, AnimatedPercentage } from '@/components/ui/motion';
import { staggerChildren, staggerItem } from '@/lib/motion';

interface EdgeItem {
  id: string;
  gameId: string;
  player: string;
  team: string;
  market: string;
  marketLine: number;
  fairLine: number;
  edgePct: number;
  confidence: number;
  bullets?: string[];
  analysis?: string;
}

interface Props {
  gameId?: string | null;
  onSelect?: (edge: EdgeItem) => void;
}

export default function TopEdgesList({ gameId, onSelect }: Props) {
  console.log('TopEdgesList: Rendering component');
  
  const handleSelect = React.useCallback((edge: EdgeItem) => {
    onSelect?.({ ...edge, normalizedMarket: normalizePropForFocus(edge.market) } as any);
  }, [onSelect]);
  
  // Mock data
  const edges: EdgeItem[] = [
    {
      id: 'edge_stockton_passing_td',
      gameId: gameId || 'uga-alabama-20250927',
      player: 'Gunner Stockton',
      team: 'UGA',
      market: 'Passing TDs',
      marketLine: 1.5,
      fairLine: 1.9,
      edgePct: 21.3,
      confidence: 0.88,
      bullets: [
        'Stockton red‑zone TD rate 42% of drives (team avg 34%)',
        'Alabama defense allows 1.7 passing TDs per game last 4 weeks',
        'UGA using more tempo packages ( +9% pace) boosting total plays',
        'Film: Stockton attacking seams vs split safety looks with success'
      ],
      analysis: 'Video shows Stockton consistently winning on layered seam concepts and leveraging play‑action to freeze linebackers. Alabama has recently conceded intermediate window throws inside the 25. Projection model lifts his median TD passes from 1.4 to 1.9 given matchup and pace uptick.'
    },
    {
      id: 'edge_stockton_deep_ball',
      gameId: gameId || 'uga-alabama-20250927',
      player: 'Gunner Stockton',
      team: 'UGA',
      market: 'Longest Completion',
      marketLine: 37.5,
      fairLine: 42.0,
      edgePct: 12.0,
      confidence: 0.74,
      bullets: [
        'Stockton averages 2.6 deep attempts (20+ air yds) per half',
        'Colbie Young target share on deep posts rising (28% → 34%)',
        'Alabama has surrendered 5 completions 35+ yds past 3 games',
        'Play‑action shot rate for UGA on 2nd & short at 46% (top 10)' 
      ],
      analysis: 'Tendency self‑scout suggests early scripted shot off counter look. Alabama boundary corner rotating late in Cover 6 has produced exposure on deep post window. Probability model gives 57% for a completion ≥38 yds vs implied 47%.'
    },
    {
      id: 'edge_haynes_king_passing',
      gameId: gameId || 'gt-wake-forest-20250927',
      player: 'Haynes King',
      team: 'Georgia Tech',
      market: 'Passing Yards',
      marketLine: 235.5,
      fairLine: 252.0,
      edgePct: 7.0,
      confidence: 0.72,
      bullets: [
        'Wake Forest pressure rate 27% (ACC median 31%) gives cleaner pockets',
        'GT RPO usage up 11% last 3 games increasing YAC opportunity',
        'King averaging 8.4 aDOT vs two‑high; Wake sits in two‑high 62%',
        'Tempo splits: +6.5 plays per game when GT favored by <4 points' 
      ],
      analysis: 'Film: King’s mechanical consistency improved on intermediate glance routes; Wake’s lighter boxes invite RPO glance digs. Projection model lifts mean yardage to 252 given expected play volume and efficiency bump vs sub‑average pressure.'
    }
  ];
  
  console.log('TopEdgesList: edges:', edges);
  
  return (
    <motion.div
      variants={staggerChildren(0.08)}
      initial="initial" 
      animate="animate"
      className="space-y-3"
    >
      {edges.map((edge, index) => {
        const positive = edge.edgePct >= 0;
        return (
          <motion.div key={edge.id} variants={staggerItem}>
            <HoverCard
              elevated
              onClick={() => handleSelect(edge)}
              className="p-6 cursor-pointer group overflow-hidden relative"
              data-testid="edge-row"
            >
              {/* Subtle gradient background */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <motion.div 
                      className="font-bold text-white text-lg mb-1 truncate"
                      whileHover={{ x: 2 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                      {edge.player}
                    </motion.div>
                    <div className="text-sm text-white/60 flex items-center gap-2">
                      <span className="font-medium">{edge.team}</span>
                      <span className="w-1 h-1 rounded-full bg-white/30" />
                      <span>{edge.market}</span>
                    </div>
                  </div>
                  
                  <div className="text-right flex flex-col items-end gap-1">
                    <AnimatedPercentage 
                      value={edge.edgePct} 
                      className="text-xl" 
                    />
                    <motion.div 
                      className="text-[11px] text-white/50 font-medium px-2 py-1 rounded-md glass-subtle"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                      {Math.round(edge.confidence * 100)}% conf
                    </motion.div>
                  </div>
                </div>
                
                {/* Enhanced prop lines visual */}
                <div className="grid grid-cols-3 gap-3">
                  <motion.div 
                    className="rounded-xl border border-white/15 px-3 py-2 text-white/70 glass-subtle text-center"
                    whileHover={{ 
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
                      borderColor: "rgba(255, 255, 255, 0.2)"
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="text-[10px] font-medium text-white/40 mb-1">Market</div>
                    <div className="font-bold tabular-nums">{edge.marketLine}</div>
                  </motion.div>
                  
                  <motion.div 
                    className="rounded-xl border border-white/15 px-3 py-2 text-white/70 glass-subtle text-center"
                    whileHover={{ 
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
                      borderColor: "rgba(255, 255, 255, 0.2)"
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="text-[10px] font-medium text-white/40 mb-1">Fair</div>
                    <div className="font-bold tabular-nums">{edge.fairLine}</div>
                  </motion.div>
                  
                  <motion.div 
                    className={`rounded-xl border px-3 py-2 glass-subtle text-center font-bold ${
                      positive 
                        ? 'border-green-400/30 text-green-300 bg-green-400/5' 
                        : 'border-red-400/30 text-red-300 bg-red-400/5'
                    }`}
                    whileHover={{ 
                      scale: 1.05,
                      backgroundColor: positive 
                        ? "rgba(34, 197, 94, 0.1)" 
                        : "rgba(239, 68, 68, 0.1)"
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <div className="text-[10px] font-medium opacity-70 mb-1">Play</div>
                    <div>{positive ? 'OVER' : 'UNDER'}</div>
                  </motion.div>
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
  );
}