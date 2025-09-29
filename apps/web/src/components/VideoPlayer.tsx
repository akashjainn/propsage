"use client";
import React, { useEffect, useRef, useState } from 'react';
import * as Sentry from '@sentry/nextjs';
import { emitVideoPlay, onVideoPlay } from '@/lib/videoEvents';

export type VideoSource = { type: 'hls' | 'mp4'; src: string };

interface Props {
  source: VideoSource;
  poster?: string;
  captions?: { src: string; srclang: string; label: string; default?: boolean }[];
  autoPlay?: boolean;
  muted?: boolean;
  startTime?: number;
  onReady?: () => void;
  onError?: (e: { code: string; detail?: any }) => void;
  telemetryCtx?: Record<string, unknown>;
}

export default function VideoPlayer({
  source,
  poster,
  captions = [],
  autoPlay = false,
  muted,
  startTime = 0,
  onReady,
  onError,
  telemetryCtx = {}
}: Props) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<any>(null);
  const idRef = useRef<string>(`${Date.now()}_${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
  const video = ref.current;
    if (!video) return;

    video.muted = muted ?? autoPlay;
    video.playsInline = true;

    const handleCanPlay = () => {
      if (startTime > 0) {
        try { video.currentTime = startTime; } catch {}
      }
      if (autoPlay) {
        video.play().catch(err => {
          onError?.({ code: 'AUTOPLAY_BLOCKED', detail: String(err) });
          Sentry.addBreadcrumb({ category: 'video', level: 'info', message: 'autoplay_blocked', data: { src: source.src } });
        });
      }
      onReady?.();
    };
    const handleError = () => {
      onError?.({ code: 'MEDIA_ERROR', detail: video.error });
      Sentry.captureMessage('Video media error', { level: 'warning', extra: { error: video.error, src: source.src } });
    };
    const handleStalled = () => onError?.({ code: 'STALL', detail: 'Network stalled' });

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);
    video.addEventListener('stalled', handleStalled);
    const off = onVideoPlay(({ id }) => {
      if (id !== idRef.current && !video.paused && !video.ended) {
        try { video.pause(); } catch {}
      }
    });

    const handlePlay = () => {
      emitVideoPlay(idRef.current);
      Sentry.addBreadcrumb({ category: 'video', level: 'info', message: 'video_play', data: { src: source.src, id: idRef.current } });
    };
    video.addEventListener('play', handlePlay);
    Sentry.addBreadcrumb({ category: 'video', level: 'debug', message: 'video_component_mount', data: { src: source.src, autoPlay } });

    (async () => {
      if (source.type === 'hls') {
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        if ((window as any).MediaSource && !isSafari) {
          const { default: Hls } = await import('hls.js');
          if (Hls.isSupported()) {
            const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
            hls.on(Hls.Events.ERROR, (_e: any, data: any) => {
              const code = `HLS_${data.details || data.type}`;
              onError?.({ code, detail: data });
              Sentry.captureMessage('Video HLS error', { level: 'warning', extra: { code, detail: data, src: source.src } });
            });
            hls.attachMedia(video);
            hls.on(Hls.Events.MEDIA_ATTACHED, () => hls.loadSource(source.src));
            hlsRef.current = hls;
          } else {
            video.src = source.src; // fallback
          }
        } else {
          video.src = source.src; // Safari native
        }
      } else {
        video.src = source.src;
      }
    })();

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
      video.removeEventListener('stalled', handleStalled);
      video.removeEventListener('play', handlePlay);
      off();
      try { hlsRef.current?.destroy(); } catch {}
      hlsRef.current = null;
    };
  }, [source.src, source.type, autoPlay, muted, startTime]);

  return (
    <video
      ref={ref}
      poster={poster}
      controls
      preload="metadata"
      className="w-full rounded-xl bg-black aspect-video"
    >
      {captions.map(c => (
        <track key={c.src} kind="captions" src={c.src} srcLang={c.srclang} label={c.label} default={c.default} />
      ))}
    </video>
  );
}
