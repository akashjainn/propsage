"use client";
import React, { useEffect, useState } from 'react';
import { normalizePropForFocus } from '@/lib/normalize';

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
  const [edges, setEdges] = useState<EdgeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) return;
    let alive = true;
    (async () => {
      setLoading(true); setError(null);
      try {
        const r = await fetch(`/api/edges/${gameId}`, { cache: 'no-store' });
        const json = await r.json();
        if (!alive) return;
        setEdges(Array.isArray(json?.edges) ? json.edges : []);
      } catch (e: any) {
        if (alive) setError(e.message || 'Failed to load edges');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [gameId]);

  if (!gameId) return <div className="text-sm text-white/50">Select a game to view edges.</div>;
  if (loading) return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-20 rounded-xl bg-white/10 animate-pulse" />
      ))}
    </div>
  );
  if (error) return <div className="text-sm text-red-400">{error}</div>;
  if (!edges.length) return <div className="text-sm text-white/50">No edge opportunities yet.</div>;

  return (
    <ul className="rounded-2xl bg-white/5 overflow-visible">
      {edges.map(edge => {
        const positive = edge.edgePct >= 0;
        return (
          <li
            key={edge.id}
            data-testid="edge-row"
            onClick={() => onSelect?.({ ...edge, normalizedMarket: normalizePropForFocus(edge.market) } as any)}
            className="p-4 border-b border-white/10 last:border-b-0 cursor-pointer hover:bg-white/10 transition-colors group"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-semibold text-white">{edge.player}</div>
                <div className="text-xs text-white/60">{edge.team} • {edge.market}</div>
              </div>
              <div className="text-right">
                <div className={`font-bold ${positive ? 'text-green-400' : 'text-red-400'}`}>{positive ? '+' : ''}{edge.edgePct.toFixed(1)}%</div>
                <div className="text-[10px] text-white/50">{Math.round(edge.confidence * 100)}% conf</div>
              </div>
            </div>
            {/* Prop lines visual */}
            <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] font-medium">
              <div className="rounded-md border border-white/15 px-2 py-1 text-white/70 bg-white/5">Mkt {edge.marketLine}</div>
              <div className="rounded-md border border-white/15 px-2 py-1 text-white/70 bg-white/5">Fair {edge.fairLine}</div>
              <div className={`rounded-md border px-2 py-1 bg-white/5 ${positive ? 'border-green-400/40 text-green-300' : 'border-red-400/40 text-red-300'}`}>{positive ? 'OVER' : 'UNDER'}</div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}