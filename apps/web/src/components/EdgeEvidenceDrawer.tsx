'use client';
import { useMemo, useEffect, useState } from 'react';
import { FEATURES, TL_INDEX } from '@/lib/features';
import { useTlSearch } from '@/hooks/useTlSearch';
import VideoPlayer from '@/components/VideoPlayer';
import { pushToast } from '@/components/ToastBus';
import FallbackClips from '@/components/FallbackClips';
import * as Sentry from '@sentry/nextjs';

type Edge = { id: string; player: string; team: string; market: string; marketLine?: number; fairLine?: number; edgePct?: number; confidence?: number; bullets?: string[]; analysis?: string; };

export default function EdgeEvidenceDrawer({
  edge, gameTitle, open, onClose,
}: { edge: Edge | null; gameTitle: string | null; open: boolean; onClose: () => void }) {
  const query = useMemo(() => {
    if (!edge) return '';
    return `${edge.player} ${edge.market} ${gameTitle ?? ''}`.trim();
  }, [edge, gameTitle]);

  const tlEnabled = FEATURES.tl && !!TL_INDEX;
  const { loading, results, error } = useTlSearch(
    tlEnabled && open && query ? { indexId: TL_INDEX, query, filters: { game: gameTitle ?? undefined } } : { indexId: '', query: '' }
  );

  useEffect(() => {
    if (open && FEATURES.tl && !TL_INDEX) {
      pushToast('TL feature on but TWELVELABS_INDEX_ID missing. Using demo clips.');
      Sentry.addBreadcrumb({ category: 'config', level: 'warning', message: 'tl_missing_index_id' });
    }
  }, [open]);

  useEffect(() => {
    if (error) {
      pushToast('Clip search failed. Please try again.');
      Sentry.captureMessage('TL search failed', { level: 'warning', extra: { edge, gameTitle, query } });
    }
  }, [error, edge, gameTitle, query]);

  const [prefetch, setPrefetch] = useState<any[] | null>(null);

  useEffect(() => {
    let alive = true;
    if (!edge || !gameTitle) return;
    (async () => {
      try {
        const q = new URLSearchParams({ game: gameTitle, player: edge.player, market: edge.market });
        const r = await fetch(`/api/tl/clips?${q.toString()}`, { cache: 'no-store' }).then(res => res.json());
        if (!alive) return; setPrefetch(r?.results ?? null);
      } catch {}
    })();
    return () => { alive = false; };
  }, [edge?.player, edge?.market, gameTitle]);

  if (!open || !edge) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/50" onClick={onClose}>
  <div data-testid="evidence-drawer" className="absolute right-0 top-0 h-full w-full sm:w-[520px] bg-background shadow-xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-border/60 space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Evidence for</div>
              <div className="text-xl font-semibold">{edge.player} — {edge.market}</div>
              {gameTitle && <div className="text-xs opacity-60">{gameTitle}</div>}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
              aria-label="Close drawer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Clips Section - Always visible at top */}
        <div className="p-4 space-y-4">
          <h3 className="font-semibold text-white">Video Evidence</h3>
          {loading && <div className="h-40 rounded-xl bg-muted/20 animate-pulse" />}
          {error && <div className="text-sm text-destructive">Search failed. Try again.</div>}
          {(results?.length ? results : undefined)?.slice(0, 3).map((r: any) => (
            <div key={`${r.videoId ?? r.url}-${r.start}`} className="space-y-2">
              <div className="text-sm opacity-80">Score {r.score?.toFixed?.(2) ?? '—'} · {Math.round(r.start)}s–{Math.round(r.end)}s</div>
              <video
                src={r.url}
                controls
                preload="metadata"
                className="w-full rounded-xl bg-black aspect-video"
                onLoadedMetadata={(e) => {
                  if (r.start) e.currentTarget.currentTime = r.start;
                }}
              />
            </div>
          ))}
          {/* Fallback if TL disabled OR no results returned */}
          {!loading && edge && (!tlEnabled || (results?.length ?? 0) === 0) && (
            prefetch ? (
              <div className="space-y-4">
                {prefetch.map((c: any) => (
                  <div key={`${c.url}-${c.start}`} className="space-y-2">
                    <div className="text-sm opacity-80">{Math.round(c.start)}s–{Math.round(c.end)}s</div>
                    <video
                      src={c.url}
                      controls
                      preload="metadata"
                      className="w-full rounded-xl bg-black aspect-video"
                      onLoadedMetadata={(e) => {
                        if (c.start) e.currentTarget.currentTime = c.start;
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <FallbackClips game={gameTitle ?? ''} edge={edge} />
            )
          )}
        </div>
        
        {/* Stats Section - Below clips */}
        <div className="p-4 space-y-4 text-sm border-t border-white/10">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-md bg-white/5 border border-white/10">
              <div className="text-xs opacity-60 mb-1">Market Line</div>
              <div className="text-base font-semibold">{edge.marketLine ?? '—'}</div>
            </div>
            <div className="p-3 rounded-md bg-white/5 border border-white/10">
              <div className="text-xs opacity-60 mb-1">Fair Line</div>
              <div className="text-base font-semibold">{edge.fairLine ?? '—'}</div>
            </div>
            <div className="p-3 rounded-md bg-white/5 border border-white/10">
              <div className="text-xs opacity-60 mb-1">Edge %</div>
              <div className={`text-base font-semibold ${ (edge.edgePct ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>{edge.edgePct?.toFixed?.(1) ?? '—'}%</div>
            </div>
            <div className="p-3 rounded-md bg-white/5 border border-white/10">
              <div className="text-xs opacity-60 mb-1">Confidence</div>
              <div className="text-base font-semibold">{edge.confidence != null ? `${Math.round((edge.confidence) * 100)}%` : '—'}</div>
            </div>
          </div>
          
          {/* Why Section */}
          {edge.bullets && edge.bullets.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-white">Why this edge exists</h4>
              <div className="space-y-2 text-sm text-white/80">
                {edge.bullets.map((bullet, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Analysis Section */}
          {edge.analysis && (
            <div className="space-y-3">
              <h4 className="font-semibold text-white">Analysis</h4>
              <p className="text-sm text-white/80">{edge.analysis}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
