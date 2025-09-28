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
  marketLine?: number;
  fairLine?: number;
  edgePct?: number;
  bullets?: string[];
  clips?: Clip[];
  isOpen: boolean;
  onClose: () => void;
}

export function PropDrawer({ 
  propId, 
  propType, 
  playerId, 
  gameId, 
  marketLine = 0, 
  fairLine = 0, 
  edgePct = 0, 
  bullets = [], 
  clips = [], 
  isOpen, 
  onClose 
}: DrawerProps) {
  const ref = useRef<HTMLDivElement>(null);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex" aria-modal="true" role="dialog">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div 
        ref={ref} 
        className="ml-auto h-full w-full max-w-6xl bg-white shadow-xl flex flex-col overflow-hidden" 
        tabIndex={-1}
      >
        <header className="p-4 border-b flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-gray-900">
              {playerId.replace('-', ' ')} — {propType}
            </h2>
            <p className="text-xs text-gray-500">Prop ID: {propId}</p>
          </div>
          <button 
            onClick={onClose} 
            className="px-3 py-1 rounded-md text-sm bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            Close
          </button>
        </header>
        
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {/* WhyCard Section - Left Column */}
            <section className="order-2 lg:order-1 space-y-4 whycard relative z-10">
              <div className="p-4 rounded-xl border bg-gradient-to-br from-gray-50 to-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="space-y-1">
                    <div className="text-[11px] uppercase tracking-wide text-gray-500">Market</div>
                    <div className="text-lg font-semibold tabular-nums">{marketLine}</div>
                  </div>
                  <div className="w-px h-10 bg-gray-200" />
                  <div className="space-y-1">
                    <div className="text-[11px] uppercase tracking-wide text-gray-500">Fair</div>
                    <div className="text-lg font-semibold tabular-nums">{fairLine}</div>
                  </div>
                  <div className="w-px h-10 bg-gray-200" />
                  <div className="flex flex-col items-end">
                    <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">Edge</div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold tabular-nums">
                        {edgePct.toFixed(1)}<span className="text-sm font-semibold">%</span>
                      </span>
                      <span className="text-[10px] tracking-wide text-gray-500">EDGE</span>
                    </div>
                  </div>
                </div>
              </div>
              <WhyCard 
                propId={propId} 
                marketLine={marketLine} 
                fairLine={fairLine} 
                edgePct={edgePct} 
                bullets={bullets} 
                isLoading={false} 
              />
            </section>

            {/* ClipsGrid Section - Right Column */}
            <aside className="order-1 lg:order-2 clipsgrid relative z-0">
              <ClipsGrid
                clips={clips}
                selectedPlayer={{ 
                  name: playerId.replace('-', ' '), 
                  position: 'Unknown', 
                  team: 'Unknown' 
                }}
              />
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PropDrawer;
