"use client";
import React, { useEffect, useRef, useState } from 'react';
import WhyCard from './WhyCard';
import ClipsGrid from './ClipsGrid';
import type { Clip } from './clip.types';

interface DrawerProps {
  propId: string;
  propType: string;
  playerId: string;
  gameId?: string;
  gameTitle?: string;
  marketLine?: number;
  fairLine?: number;
  edgePct?: number;
  bullets?: string[];
  analysis?: string;
  clips?: Clip[];
  isOpen: boolean;
  onClose: () => void;
}

export function PropDrawer({ 
  propId, 
  propType, 
  playerId, 
  gameId,
  gameTitle,
  marketLine = 0, 
  fairLine = 0, 
  edgePct = 0, 
  bullets = [],
  analysis,
  clips = [], 
  isOpen, 
  onClose 
}: DrawerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [loadedClips, setLoadedClips] = useState<any[]>([]);
  const [clipsLoading, setClipsLoading] = useState(false);

  // Focus management
  useEffect(() => {
    if (isOpen && ref.current) {
      ref.current.focus();
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Fetch clips when drawer opens
  useEffect(() => {
    if (isOpen && playerId && propType) {
      setClipsLoading(true);
      setLoadedClips([]);
      
      const playerName = playerId.replace('cfb_', '').replace(/_/g, ' ');
      const market = propType.replace(/_/g, ' ');
      
      const params = new URLSearchParams();
      if (playerName) params.set('player', playerName);
      if (market) params.set('market', market);
      if (gameTitle) params.set('game', gameTitle);
      
      fetch(`/api/tl/clips?${params.toString()}`)
        .then(res => res.json())
        .then(data => {
          setLoadedClips(data.results || []);
        })
        .catch(err => {
          console.error('Failed to fetch clips:', err);
          setLoadedClips([]);
        })
        .finally(() => {
          setClipsLoading(false);
        });
    }
  }, [isOpen, playerId, propType, gameTitle]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex" aria-modal="true" role="dialog">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div 
        ref={ref} 
        className="ml-auto h-full w-full max-w-6xl bg-slate-900 text-white shadow-xl flex flex-col overflow-hidden" 
        tabIndex={-1}
      >
        <header className="p-4 border-b border-white/10 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold">
              {playerId.replace('-', ' ')} — {propType}
            </h2>
            <p className="text-xs text-white/60">Prop ID: {propId}</p>
          </div>
          <button 
            onClick={onClose} 
            className="px-3 py-1 rounded-md text-sm bg-white/10 hover:bg-white/20 transition-colors"
          >
            Close
          </button>
        </header>
        
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {/* Stats Section - Left Column */}
            <section className="order-2 lg:order-1 space-y-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="space-y-1">
                    <div className="text-[11px] uppercase tracking-wide text-white/60">Market</div>
                    <div className="text-lg font-semibold tabular-nums">{marketLine}</div>
                  </div>
                  <div className="w-px h-10 bg-white/20" />
                  <div className="space-y-1">
                    <div className="text-[11px] uppercase tracking-wide text-white/60">Fair</div>
                    <div className="text-lg font-semibold tabular-nums">{fairLine}</div>
                  </div>
                  <div className="w-px h-10 bg-white/20" />
                  <div className="flex flex-col items-end">
                    <div className="text-[11px] uppercase tracking-wide text-white/60 mb-1">Edge</div>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-xl font-bold tabular-nums ${edgePct > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {edgePct > 0 ? '+' : ''}{edgePct.toFixed(1)}<span className="text-sm font-semibold">%</span>
                      </span>
                      <span className="text-[10px] tracking-wide text-white/60">EDGE</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Why Section */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                <h3 className="font-semibold text-white">Why this edge exists</h3>
                <div className="space-y-2 text-sm text-white/80">
                  {bullets.map((bullet, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Analysis Section */}
              {analysis && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                  <h3 className="font-semibold text-white">Clip Analysis</h3>
                  <p className="text-sm text-white/80">{analysis}</p>
                </div>
              )}
            </section>

            {/* Video Evidence Section - Right Column */}
            <aside className="order-1 lg:order-2 space-y-4">
              <h3 className="font-semibold text-white">Video Evidence</h3>
              <div className="space-y-4">
                {clipsLoading ? (
                  <div className="text-sm text-white/60 p-4 rounded-lg bg-white/5 border border-white/10 animate-pulse">
                    Loading video clips...
                  </div>
                ) : loadedClips.length > 0 ? (
                  loadedClips.slice(0, 3).map((clip, i) => (
                    <div key={i} className="space-y-2">
                      <div className="text-sm text-white/60">
                        {clip.title || clip.description}
                      </div>
                      <video
                        src={clip.url}
                        controls
                        preload="metadata"
                        className="w-full rounded-xl bg-black aspect-video"
                        onLoadedMetadata={(e) => {
                          if (clip.start || clip.startTime) {
                            e.currentTarget.currentTime = clip.start || clip.startTime;
                          }
                        }}
                      />
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-white/60 p-4 rounded-lg bg-white/5 border border-white/10">
                    No video clips found for this prop. Our video analysis team is working to add more clips.
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PropDrawer;
