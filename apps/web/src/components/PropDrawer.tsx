"use client";
import React, { useEffect, useRef, useState } from 'react';
import WhyCard from './WhyCard';
import ClipsGrid, { ClipsGridProps } from './ClipsGrid';
import type { Clip } from './clip.types';
import { useIndexJobs, enqueueIndex } from '@/hooks/useIndexing';
import { useTlClips } from '@/lib/useTlClips';
import { useInsights } from '@/hooks/useInsights';
import type { PropInsights } from '@/types/insights';

interface DrawerProps {
  propId: string;
  propType: ClipsGridProps['propType'];
  playerId: string;
  gameId?: string; // e.g., 'illinois-usc-20250927'
  marketLine?: number;
  fairLine?: number;
  edgePct?: number; // optional; prefer insights.edgePct
  bullets?: string[];
  clips?: Clip[]; // fallback clips
  isOpen: boolean;
  onClose: () => void;
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function useCountUp(value: number, durationMs = 900) {
  const [display, setDisplay] = useState(0);
  const reduced = prefersReducedMotion();
  useEffect(() => {
    if (reduced) { setDisplay(value); return; }
    let start: number | null = null;
    let raf: number;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const progress = Math.min(1, (ts - start) / durationMs);
      setDisplay(value * progress);
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, durationMs, reduced]);
  return display;
}

export function PropDrawer({ propId, propType, playerId, gameId, marketLine, fairLine, edgePct, bullets = [], clips = [], isOpen, onClose }: DrawerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { insights, isLoading: insightsLoading, error: insightsError } = useInsights(isOpen ? propId : undefined);
  const effectiveMarket = insights?.marketLine ?? marketLine ?? 0;
  const effectiveFair = insights?.fairLine ?? fairLine ?? 0;
  const effectiveEdge = insights?.edgePct ?? edgePct ?? 0;
  const allBullets = insights?.bullets?.map(b => b.title) ?? bullets;
  // Clips from Insights service (model-produced / curated) remain; TwelveLabs search augments / replaces when available.
  const insightClips: Clip[] = (insights?.supportingClips || []).map(c => ({
    id: c.id,
    playerId: playerId,
    title: c.id.replace(/c_/,'').replace(/_/g,' '),
    src: `/video/${c.id}.mp4`,
    start: c.start,
    end: c.end,
    thumbnail: `/thumbs/${c.id}.jpg`,
    tags: c.tags,
    confidence: c.confidence ?? 0.9
  }));
  const edgeAnim = useCountUp(effectiveEdge);
  const reduced = prefersReducedMotion();
  const [loadingClips, setLoadingClips] = useState(true);
  const { clips: tlClips, loading: tlLoading, search: tlSearch } = useTlClips();
  const { jobs } = useIndexJobs(playerId);
  const latestJob = jobs.slice().sort((a,b)=> new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
  const status = latestJob?.status;

  // Kick off TwelveLabs semantic search when drawer opens or prop context changes.
  useEffect(() => {
    if (!isOpen) return;
    setLoadingClips(true);
    const playerName = playerId.replace('-', ' ');
    const query = `${playerName} ${propType}`;
    tlSearch(query, gameId, propType, playerName).finally(() => setLoadingClips(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, propId, playerId, propType, gameId]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        const focusables = ref.current?.querySelectorAll<HTMLElement>('button, a, input, [tabindex]:not([tabindex="-1"])');
        if (!focusables || focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex" aria-modal="true" role="dialog" aria-label="Prop analysis drawer">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div ref={ref} className="ml-auto h-full w-full max-w-5xl bg-white shadow-xl flex flex-col overflow-hidden" tabIndex={-1}>
        <header className="p-4 border-b flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-gray-900" tabIndex={-1}>{playerId.replace('-', ' ')} — {propType}</h2>
            <p className="text-xs text-gray-500">Prop ID: {propId}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-xs">
              <span className={`px-2 py-1 rounded-full border flex items-center gap-1 ${status==='ready' ? 'bg-green-50 border-green-200 text-green-700' : status==='failed' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-amber-50 border-amber-200 text-amber-700'}`}> 
                {status === 'ready' ? '✔' : status === 'failed' ? '⚠' : '⏳'}
                <span>{status ? status : 'idle'}</span>
                {latestJob?.clipCount && status==='ready' && <span className="text-[10px] text-gray-500">{latestJob.clipCount} clips</span>}
              </span>
              <button onClick={()=>enqueueIndex(playerId,'https://youtu.be/demo')} className="px-2 py-1 rounded-md border text-gray-600 hover:bg-gray-100">Index</button>
            </div>
            <button onClick={onClose} className="px-3 py-1 rounded-md text-sm bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400">Close</button>
          </div>
        </header>
        <div className="grid grid-cols-12 gap-6 p-6 overflow-y-auto">
          <div className="col-span-12 md:col-span-4 space-y-4">
            <div className="p-4 rounded-xl border bg-gradient-to-br from-gray-50 to-white">
              <div className="flex items-center justify-between mb-3">
                <div className="space-y-1">
                  <div className="text-[11px] uppercase tracking-wide text-gray-500">Market</div>
                  <div className="text-lg font-semibold tabular-nums">{insightsLoading ? '—' : effectiveMarket}</div>
                </div>
                <div className="w-px h-10 bg-gray-200" />
                <div className="space-y-1">
                  <div className="text-[11px] uppercase tracking-wide text-gray-500">Fair</div>
                  <div className="text-lg font-semibold tabular-nums">{insightsLoading ? '—' : effectiveFair}</div>
                </div>
                <div className="w-px h-10 bg-gray-200" />
                <div className="flex flex-col items-end">
                  <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">Edge</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold tabular-nums">{insightsLoading ? '—' : (reduced ? effectiveEdge : edgeAnim).toFixed(1)}<span className="text-sm font-semibold">%</span></span>
                    <span className="text-[10px] tracking-wide text-gray-500">OVER/UNDER</span>
                  </div>
                </div>
              </div>
            </div>
            <WhyCard 
              propId={propId} 
              marketLine={effectiveMarket} 
              fairLine={effectiveFair} 
              edgePct={effectiveEdge} 
              bullets={allBullets} 
              isLoading={insightsLoading} 
            />
            {insightsError && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md p-2">No insight data yet <button onClick={()=>window.location.reload()} className="underline ml-1">Retry</button></div>
            )}
          </div>
          <div className="col-span-12 md:col-span-8">
            <ClipsGrid
              playerId={playerId}
              propType={propType}
              isLoading={loadingClips || tlLoading || insightsLoading}
              clips={
                // Priority: TwelveLabs results if present, else insight clips, else fallback provided props
                tlClips.length ? tlClips.map(c => ({
                  id: c.id,
                  playerId,
                  title: `${propType} evidence`,
                  src: c.src || `/api/video/clip/${c.id}`,
                  start: c.start,
                  end: c.end,
                  thumbnail: `/api/thumb/${c.id}`,
                  tags: c.keywords || [],
                  confidence: c.confidence,
                })) : (insightClips.length ? insightClips : clips)
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default PropDrawer;
