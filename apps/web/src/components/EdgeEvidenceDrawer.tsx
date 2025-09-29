'use client';
import { useMemo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FEATURES, TL_INDEX } from '@/lib/features';
import { useTlSearch } from '@/hooks/useTlSearch';
import VideoPlayer from '@/components/VideoPlayer';
import LazyVideo from '@/components/LazyVideo';
import { pushToast } from '@/components/ToastBus';
import FallbackClips from '@/components/FallbackClips';
import { Drawer, AnimatedList, Skeleton } from '@/components/ui/motion';
import { slideInFromBottom, staggerChildren, staggerItem, easeOut } from '@/lib/motion';
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

  return (
    <AnimatePresence>
      {open && edge && (
        <Drawer
          isOpen={open}
          onClose={onClose}
          className="sm:w-[540px]"
        >
          <motion.div
            data-testid="evidence-drawer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={easeOut}
            className="space-y-6"
          >
            {/* Header */}
            <div className="space-y-3">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...easeOut, delay: 0.1 }}
              >
                <div className="text-sm text-white/50 font-medium">Evidence for</div>
                <div className="text-2xl font-bold text-white">{edge.player}</div>
                <div className="text-lg text-white/80">{edge.market}</div>
                {gameTitle && (
                  <div className="text-sm text-white/50 flex items-center gap-2 mt-2">
                    <span className="w-1 h-1 rounded-full bg-white/30" />
                    <span>{gameTitle}</span>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Video Evidence Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...easeOut, delay: 0.2 }}
              className="space-y-4"
            >
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="w-1 h-6 bg-gradient-primary rounded-full" />
                Video Evidence
              </h3>
              
              {loading && (
                <motion.div
                  variants={staggerChildren(0.1)}
                  initial="initial"
                  animate="animate" 
                  className="space-y-4"
                >
                  {Array.from({ length: 2 }).map((_, i) => (
                    <motion.div key={i} variants={staggerItem}>
                      <Skeleton className="h-48 aspect-video" />
                    </motion.div>
                  ))}
                </motion.div>
              )}
              
              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-sm text-red-400 p-4 rounded-xl glass border border-red-400/20 text-center"
                >
                  Search failed. Try again.
                </motion.div>
              )}
              
              {results?.length > 0 && (
                <motion.div
                  variants={staggerChildren(0.12)}
                  initial="initial"
                  animate="animate"
                  className="space-y-6"
                >
                  {results.slice(0, 3).map((r: any, idx: number) => (
                    <motion.div 
                      key={`${r.videoId ?? r.url}-${r.start}`} 
                      variants={staggerItem}
                      className="glass rounded-2xl p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/70 font-medium">
                          Match Score: <span className="text-primary-400 font-bold">{r.score?.toFixed?.(2) ?? '—'}</span>
                        </span>
                        <span className="text-white/50 font-medium">
                          {Math.round(r.start)}s–{Math.round(r.end)}s
                        </span>
                      </div>
                      <LazyVideo 
                        src={r.url} 
                        type={r.url.endsWith('.m3u8') ? 'hls' : 'mp4'}
                        startTime={r.start}
                        eager={idx === 0}
                        className="shadow-lg"
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}
              
              {/* Fallback clips */}
              {!loading && edge && (!tlEnabled || (results?.length ?? 0) === 0) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...easeOut, delay: 0.3 }}
                >
                  {prefetch ? (
                    <motion.div 
                      variants={staggerChildren(0.1)}
                      initial="initial"
                      animate="animate"
                      className="space-y-4"
                    >
                      {prefetch.map((c: any, idx: number) => (
                        <motion.div 
                          key={`${c.url}-${c.start}`} 
                          variants={staggerItem}
                          className="glass rounded-2xl p-4 space-y-3"
                        >
                          <div className="text-sm text-white/50 font-medium">
                            {Math.round(c.start)}s–{Math.round(c.end)}s
                          </div>
                          <LazyVideo
                            src={c.url}
                            type={c.url.endsWith('.m3u8') ? 'hls' : 'mp4'}
                            startTime={c.start}
                            eager={idx === 0}
                            className="shadow-lg"
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <FallbackClips game={gameTitle ?? ''} edge={edge} />
                  )}
                </motion.div>
              )}
            </motion.div>
            {/* Stats Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...easeOut, delay: 0.4 }}
              className="space-y-6 pt-6 border-t border-white/10"
            >
              <motion.div 
                variants={staggerChildren(0.08)}
                initial="initial"
                animate="animate"
                className="grid grid-cols-2 gap-4"
              >
                <motion.div 
                  variants={staggerItem}
                  className="p-4 rounded-2xl glass-subtle text-center group"
                  whileHover={{ 
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                    scale: 1.02
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="text-xs text-white/40 font-medium mb-2">Market Line</div>
                  <div className="text-2xl font-bold text-white tabular-nums">{edge.marketLine ?? '—'}</div>
                </motion.div>
                
                <motion.div 
                  variants={staggerItem}
                  className="p-4 rounded-2xl glass-subtle text-center group"
                  whileHover={{ 
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                    scale: 1.02
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="text-xs text-white/40 font-medium mb-2">Fair Line</div>
                  <div className="text-2xl font-bold text-white tabular-nums">{edge.fairLine ?? '—'}</div>
                </motion.div>
                
                <motion.div 
                  variants={staggerItem}
                  className={`p-4 rounded-2xl glass-subtle text-center group border ${
                    (edge.edgePct ?? 0) >= 0 
                      ? 'border-green-400/20 bg-green-400/5' 
                      : 'border-red-400/20 bg-red-400/5'
                  }`}
                  whileHover={{ 
                    scale: 1.02,
                    backgroundColor: (edge.edgePct ?? 0) >= 0 
                      ? "rgba(34, 197, 94, 0.1)" 
                      : "rgba(239, 68, 68, 0.1)"
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="text-xs text-white/40 font-medium mb-2">Edge %</div>
                  <div className={`text-2xl font-bold tabular-nums ${ 
                    (edge.edgePct ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {edge.edgePct ? `${edge.edgePct > 0 ? '+' : ''}${edge.edgePct.toFixed(1)}%` : '—'}
                  </div>
                </motion.div>
                
                <motion.div 
                  variants={staggerItem}
                  className="p-4 rounded-2xl glass-subtle text-center group"
                  whileHover={{ 
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                    scale: 1.02
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="text-xs text-white/40 font-medium mb-2">Confidence</div>
                  <div className="text-2xl font-bold text-white tabular-nums">
                    {edge.confidence != null ? `${Math.round(edge.confidence * 100)}%` : '—'}
                  </div>
                </motion.div>
              </motion.div>
              
              {/* Why Section */}
              {edge.bullets && edge.bullets.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...easeOut, delay: 0.5 }}
                  className="space-y-4 glass rounded-2xl p-6"
                >
                  <h4 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="w-1 h-5 bg-gradient-primary rounded-full" />
                    Why this edge exists
                  </h4>
                  <motion.div 
                    variants={staggerChildren(0.1)}
                    initial="initial"
                    animate="animate"
                    className="space-y-3"
                  >
                    {edge.bullets.map((bullet, i) => (
                      <motion.div 
                        key={i} 
                        variants={staggerItem}
                        className="flex items-start gap-3 text-white/80"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-2 flex-shrink-0" />
                        <span className="leading-relaxed">{bullet}</span>
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>
              )}
              
              {/* Analysis Section */}
              {edge.analysis && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...easeOut, delay: 0.6 }}
                  className="space-y-4 glass rounded-2xl p-6"
                >
                  <h4 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="w-1 h-5 bg-gradient-primary rounded-full" />
                    Analysis
                  </h4>
                  <p className="text-white/80 leading-relaxed">{edge.analysis}</p>
                </motion.div>
              )}
            </motion.div>
            
          </motion.div>
        </Drawer>
      )}
    </AnimatePresence>
  );
}
