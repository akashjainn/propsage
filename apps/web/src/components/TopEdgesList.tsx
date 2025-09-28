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
}

interface Props {
  gameId?: string | null;
  onSelect?: (edge: EdgeItem) => void;
}

export default function TopEdgesList({ gameId, onSelect }: Props) {
  console.log('TopEdgesList: Rendering component');
  
  // Mock data
  const edges: EdgeItem[] = [
    {
      id: 'mock_1',
      gameId: gameId || 'mock_game',
      player: 'Jayden Maiava',
      team: 'USC',
      market: 'Interceptions',
      marketLine: 0.5,
      fairLine: 0.8,
      edgePct: 24.1,
      confidence: 0.91
    },
    {
      id: 'mock_2', 
      gameId: gameId || 'mock_game',
      player: 'Quinn Ewers',
      team: 'Texas',
      market: 'Passing Yards',
      marketLine: 275.5,
      fairLine: 295.0,
      edgePct: -7.2,
      confidence: 0.83
    },
    {
      id: 'mock_3',
      gameId: gameId || 'mock_game', 
      player: 'Tre Harris',
      team: 'Ole Miss',
      market: 'Receiving Yards',
      marketLine: 85.5,
      fairLine: 95.0,
      edgePct: 11.1,
      confidence: 0.76
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
              onClick={() => onSelect?.({ ...edge, normalizedMarket: normalizePropForFocus(edge.market) } as any)}
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