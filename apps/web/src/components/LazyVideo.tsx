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
}

export function LazyVideo({ src, type = 'mp4', poster, startTime = 0, autoPlay = false, muted, className = '', eager = false }: LazyVideoProps) {
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
        <div className="aspect-video w-full rounded-xl overflow-hidden bg-gradient-to-br from-white/10 to-white/5 border border-white/10 animate-pulse flex items-center justify-center text-[10px] tracking-wide text-white/40">
          Loading video…
        </div>
      )}
      {loaded && (
        <VideoPlayer
          source={{ type, src }}
          poster={poster}
          startTime={startTime}
          autoPlay={autoPlay}
          muted={muted}
        />
      )}
    </div>
  );
}

export default LazyVideo;