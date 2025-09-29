"use client";
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import LazyVideo from './LazyVideo';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import useIsMobile from '@/hooks/useIsMobile';

export interface ClipItem {
  id: string;
  url: string;
  start?: number;
  end?: number;
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  relevance?: number;
  type?: 'mp4' | 'hls';
}

interface ClipCarouselProps {
  clips: ClipItem[];
  eagerFirst?: boolean;
  className?: string;
  onSelectClip?: (clip: ClipItem) => void;
}

export function ClipCarousel({ clips, eagerFirst = true, className = '', onSelectClip }: ClipCarouselProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);
  const isMobile = useIsMobile();

  const scrollTo = useCallback((index: number) => {
    const el = containerRef.current;
    if (!el) return;
    const child = el.children[index] as HTMLElement | undefined;
    if (child) child.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, []);

  const next = () => setActive(a => Math.min(clips.length - 1, a + 1));
  const prev = () => setActive(a => Math.max(0, a - 1));

  useEffect(() => { scrollTo(active); }, [active, scrollTo]);

  // Keyboard navigation
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Scroll container */}
      <div
        ref={containerRef}
        className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 -mx-4 px-4"
        style={{ scrollbarWidth: 'none' }}
      >
        {clips.map((clip, i) => (
          <div
            key={clip.id || clip.url + i}
            className="snap-center shrink-0 w-[calc(100vw-2rem)] sm:w-[360px] max-w-[420px]"
            aria-label={clip.title || `Clip ${i + 1}`}
          >
            <div className={`rounded-2xl border border-white/10 glass-subtle overflow-hidden relative group ${i === active ? 'ring-2 ring-indigo-400/70' : ''}`}
              onClick={() => onSelectClip?.(clip)}
            >
              <LazyVideo
                src={clip.url}
                type={clip.type || (clip.url.endsWith('.m3u8') ? 'hls' : 'mp4')}
                startTime={clip.start}
                poster={clip.thumbnailUrl}
                eager={eagerFirst && i === 0}
                title={clip.title}
                className=""
              />
              <div className="p-3 space-y-2">
                <div className="text-xs uppercase tracking-wide text-white/40 flex items-center justify-between">
                  <span>{clip.relevance != null ? `Score ${(clip.relevance * 100).toFixed(0)}%` : 'Clip'}</span>
                  <span className="font-mono text-[10px] text-white/30">{i + 1}/{clips.length}</span>
                </div>
                {clip.title && <div className="text-sm font-medium text-white/90 line-clamp-2">{clip.title}</div>}
                {clip.description && <div className="text-[11px] text-white/60 line-clamp-2">{clip.description}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation buttons (desktop) */}
      {!isMobile && clips.length > 1 && (
        <>
          <button
            onClick={prev}
            disabled={active === 0}
            aria-label="Previous clip"
            className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/40 hover:bg-black/60 border border-white/10 backdrop-blur flex items-center justify-center text-white/70 disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            disabled={active === clips.length - 1}
            aria-label="Next clip"
            className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/40 hover:bg-black/60 border border-white/10 backdrop-blur flex items-center justify-center text-white/70 disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Progress dots */}
      {clips.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-2">
          {clips.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Go to clip ${i + 1}`}
              className={`h-2.5 w-2.5 rounded-full transition-all ${i === active ? 'bg-indigo-400 w-6' : 'bg-white/25 hover:bg-white/40'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default ClipCarousel;