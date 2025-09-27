"use client";
import React, { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import type { Clip } from './clip.types';

export interface ClipPlayerProps {
  clip: Clip;
  autoPlay?: boolean; // default true
  onEnded?: () => void;
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function ClipPlayer({ clip, autoPlay = true, onEnded }: ClipPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const reduced = prefersReducedMotion();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleCanPlay = () => {
      setReady(true);
      video.currentTime = clip.start;
      if (autoPlay && !reduced) {
        playSegment();
      } else {
        setShowOverlay(true);
      }
    };

    const timeUpdate = () => {
      if (video.currentTime >= clip.end - 0.1) {
        video.pause();
        onEnded?.();
        setShowOverlay(true);
      }
    };

    const errorHandler = () => {
      setError('unavailable');
      try {
        (window as any).toast?.("Video unavailable — opening source.");
      } catch {}
      window.open(clip.src, '_blank');
    };

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('timeupdate', timeUpdate);
    video.addEventListener('error', errorHandler);
    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('timeupdate', timeUpdate);
      video.removeEventListener('error', errorHandler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clip.id]);

  const playSegment = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      setShowOverlay(false);
      await video.play();
    } catch (e) {
      // autoplay blocked — show overlay
      setShowOverlay(true);
    }
  };

  return (
    <div className="relative w-full">
      <video
        ref={videoRef}
        muted
        playsInline
        preload="metadata"
        poster={clip.thumbnail}
        src={clip.src}
        className="w-full aspect-video rounded-xl bg-black"
      />
      {(showOverlay || error) && (
        <button
          type="button"
            onClick={() => {
              const video = videoRef.current; if (!video) return; video.currentTime = clip.start; playSegment();
            }}
          className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
          aria-label={error ? 'Open source video in new tab' : 'Play clip'}
        >
          <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
            <Play className="w-7 h-7 text-gray-800 ml-0.5" />
          </div>
        </button>
      )}
    </div>
  );
}

export default ClipPlayer;
