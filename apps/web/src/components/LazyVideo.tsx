"use client";
import React, { useEffect, useState } from 'react';
import { useIntersection } from '@/hooks/useIntersection';
import dynamic from 'next/dynamic';

const VideoPlayer = dynamic(() => import('./VideoPlayer'), { ssr: false });

interface LazyVideoProps {
  src: string;
  type?: 'mp4' | 'hls';
  poster?: string;
  startTime?: number;
  autoPlay?: boolean;
  muted?: boolean;
  className?: string;
  eager?: boolean; // force immediate load (e.g., first deterministic clip)
  title?: string;
}

export function LazyVideo({ src, type = 'mp4', poster, startTime = 0, autoPlay = false, muted, className = '', eager = false, title }: LazyVideoProps) {
  const { ref, inView } = useIntersection<HTMLDivElement>({ rootMargin: '200px', threshold: 0.1, freezeOnceVisible: true });
  const shouldLoad = eager || inView;
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (shouldLoad) {
      const t = setTimeout(() => setLoaded(true), 40); // micro-delay to avoid layout jank
      return () => clearTimeout(t);
    }
  }, [shouldLoad]);

  return (
    <div ref={ref} className={`relative w-full ${className}`}>
      {!loaded && (
        <div className="aspect-video w-full rounded-xl overflow-hidden relative">
          {poster ? (
            // Show blurred poster while waiting for hydration/VideoPlayer mount
            <img 
              src={poster} 
              alt={title || 'Video thumbnail'} 
              className="w-full h-full object-cover blur-sm scale-105 brightness-90" 
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-white/10 to-white/5" />
          )}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="px-3 py-1.5 rounded-full bg-black/60 border border-white/20 text-[11px] tracking-wide text-white/70 font-medium">Loading…</div>
          </div>
        </div>
      )}
      {loaded && (
        <VideoPlayer
          source={{ type, src }}
          poster={poster}
          startTime={startTime}
          autoPlay={autoPlay}
          muted={muted}
          onReady={() => {
            // no-op for now; could emit performance metric
          }}
        />
      )}
    </div>
  );
}

export default LazyVideo;