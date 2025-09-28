'use client';

import React from 'react';
import { TeamLogo } from './TeamLogo';
import { Badge } from '@/ui';
import type { GameLite } from '@/types/cfb';

interface GamesRailProps {
  games: GameLite[];
  selectedGameId: string;
  onGameSelect: (gameId: string) => void;
  loading?: boolean;
}

export default function GamesRail({ games, selectedGameId, onGameSelect, loading = false }: GamesRailProps) {
  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex-shrink-0 p-4 rounded-xl border border-white/10 bg-white/5 min-w-[200px] animate-pulse">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-white/10 rounded-full"></div>
                <div className="w-12 h-4 bg-white/10 rounded"></div>
              </div>
            </div>
            <div className="text-xs text-white/60 mb-2">@</div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-white/10 rounded-full"></div>
                <div className="w-12 h-4 bg-white/10 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="text-center py-8 text-white/50">
        <p>No games available today</p>
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {games.map(game => {
        const isLive = game.state === 'in';
        const isSelected = selectedGameId === game.id;
        
        return (
          <button
            key={game.id}
            onClick={() => onGameSelect(game.id)}
            className={`flex-shrink-0 p-4 rounded-xl border transition-colors min-w-[200px] ${
              isSelected 
                ? 'border-blue-500 bg-blue-500/10' 
                : 'border-white/10 bg-white/5 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <TeamLogo src={game.away.logo} alt={game.away.short} size={24} />
                <span className="text-sm font-medium">{game.away.short}</span>
                {game.away.rank && <Badge color="sky">#{game.away.rank}</Badge>}
              </div>
              {isLive || game.state === 'post' ? (
                <span className="text-sm font-mono">{game.awayScore}</span>
              ) : null}
            </div>
            
            <div className="text-xs text-white/60 mb-2 text-center">@</div>
            
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <TeamLogo src={game.home.logo} alt={game.home.short} size={24} />
                <span className="text-sm font-medium">{game.home.short}</span>
                {game.home.rank && <Badge color="sky">#{game.home.rank}</Badge>}
              </div>
              {isLive || game.state === 'post' ? (
                <span className="text-sm font-mono">{game.homeScore}</span>
              ) : null}
            </div>
            
            <div className="mt-3 flex items-center justify-between">
              <div className="text-xs text-white/50">
                {isLive ? `Q${game.period} • ${game.clock}` : 
                 new Date(game.start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </div>
              <div className="flex items-center gap-1">
                {isLive && <Badge color="emerald">LIVE</Badge>}
                {game.state === 'post' && <Badge>FINAL</Badge>}
                {game.broadcast?.network && (
                  <span className="text-xs text-white/40">{game.broadcast.network}</span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}