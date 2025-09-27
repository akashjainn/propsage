"use client"
import React, { useRef, useEffect, useState } from 'react';
import { TLMoment } from './EvidenceRail';

interface MomentPlayerProps {
  moment: TLMoment;
  s3Url: string;
  onClose: () => void;
  autoPlay?: boolean;
  controls?: boolean;
}

export function MomentPlayer({ 
  moment, 
  s3Url, 
  onClose, 
  autoPlay = true, 
  controls = true 
}: MomentPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setLoading(false);
      setDuration(video.duration);
      
      // Jump to the moment's start time
      video.currentTime = moment.startTime;
      
      if (autoPlay) {
        video.play().then(() => {
          setIsPlaying(true);
          startTimeTracking();
        }).catch(console.error);
      }
    };

    const handleError = () => {
      setError('Failed to load video');
      setLoading(false);
    };

    const handleTimeUpdate = () => {
      const currentTime = video.currentTime;
      setCurrentTime(currentTime);
      
      // Auto-pause at end time if specified
      if (moment.endTime && currentTime >= moment.endTime) {
        video.pause();
        setIsPlaying(false);
        stopTimeTracking();
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('error', handleError);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', () => setIsPlaying(true));
    video.addEventListener('pause', () => setIsPlaying(false));

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('error', handleError);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', () => setIsPlaying(true));
      video.removeEventListener('pause', () => setIsPlaying(false));
      stopTimeTracking();
    };
  }, [moment.startTime, moment.endTime, autoPlay]);

  const startTimeTracking = () => {
    intervalRef.current = setInterval(() => {
      if (videoRef.current) {
        setCurrentTime(videoRef.current.currentTime);
      }
    }, 100);
  };

  const stopTimeTracking = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
  };

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      stopTimeTracking();
    } else {
      video.play().then(() => startTimeTracking()).catch(console.error);
    }
  };

  const seekTo = (time: number) => {
    const video = videoRef.current;
    if (!video) return;
    
    video.currentTime = Math.max(moment.startTime, Math.min(moment.endTime || duration, time));
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickRatio = clickX / rect.width;
    
    const momentDuration = (moment.endTime || duration) - moment.startTime;
    const targetTime = moment.startTime + (clickRatio * momentDuration);
    seekTo(targetTime);
  };

  const jumpToStart = () => {
    seekTo(moment.startTime);
  };

  const jumpToEnd = () => {
    if (moment.endTime) {
      seekTo(moment.endTime - 1); // Jump to 1 second before end
    }
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await videoRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const momentDuration = (moment.endTime || duration) - moment.startTime;
  const momentProgress = Math.max(0, Math.min(1, 
    (currentTime - moment.startTime) / momentDuration
  ));

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-[var(--surface)] rounded-2xl ring-1 ring-[var(--stroke)] p-8 max-w-md text-center">
          <div className="text-red-400 text-4xl mb-4">⚠️</div>
          <div className="text-[var(--fg)] mb-2">Video Error</div>
          <div className="text-[var(--fg-dim)] text-sm mb-6">{error}</div>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-[var(--iris)] text-white rounded-lg hover:bg-[var(--iris)]/80 transition"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
      <div className="w-full max-w-4xl mx-4 bg-[var(--surface)] rounded-2xl ring-1 ring-[var(--stroke)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[var(--fg)] truncate">
              {moment.label}
            </h3>
            <div className="text-sm text-[var(--fg-dim)] flex items-center gap-2 mt-1">
              <span>🎬 Evidence Clip</span>
              <span>•</span>
              <span>{formatTime(moment.startTime)} → {formatTime(moment.endTime || duration)}</span>
              <span>•</span>
              <span className={`capitalize px-2 py-0.5 rounded-full text-xs ${
                moment.confidence === 'high' ? 'bg-green-500/20 text-green-400' :
                moment.confidence === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {moment.confidence} confidence
              </span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="ml-4 p-2 hover:bg-white/10 rounded-lg transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Video Player */}
        <div className="relative bg-black">
          <video
            ref={videoRef}
            src={s3Url}
            className="w-full aspect-video"
            playsInline
            preload="metadata"
          />
          
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          )}
        </div>

        {/* Custom Controls */}
        {controls && (
          <div className="p-4 space-y-3 bg-black/20">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div 
                className="w-full h-2 bg-white/20 rounded-full cursor-pointer relative"
                onClick={handleProgressClick}
              >
                {/* Moment bounds indicator */}
                <div 
                  className="absolute top-0 h-full bg-[var(--iris)]/30 rounded-full"
                  style={{
                    left: `${(moment.startTime / duration) * 100}%`,
                    width: `${(momentDuration / duration) * 100}%`
                  }}
                />
                
                {/* Current progress */}
                <div 
                  className="absolute top-0 h-full bg-[var(--iris)] rounded-full transition-all duration-100"
                  style={{ 
                    left: `${(moment.startTime / duration) * 100}%`,
                    width: `${momentProgress * (momentDuration / duration) * 100}%`
                  }}
                />
                
                {/* Playhead */}
                <div 
                  className="absolute top-1/2 w-4 h-4 bg-white rounded-full transform -translate-y-1/2 -translate-x-1/2 shadow-lg"
                  style={{ 
                    left: `${(currentTime / duration) * 100}%`
                  }}
                />
              </div>
              
              <div className="flex justify-between text-xs text-[var(--fg-dim)]">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Jump to Start */}
                <button 
                  onClick={jumpToStart}
                  className="p-2 hover:bg-white/10 rounded-lg transition"
                  title="Jump to start of moment"
                >
                  ⏮️
                </button>
                
                {/* Play/Pause */}
                <button 
                  onClick={togglePlayPause}
                  className="p-3 hover:bg-white/10 rounded-lg transition"
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? '⏸️' : '▶️'}
                </button>
                
                {/* Jump to End */}
                <button 
                  onClick={jumpToEnd}
                  className="p-2 hover:bg-white/10 rounded-lg transition"
                  title="Jump to end of moment"
                  disabled={!moment.endTime}
                >
                  ⏭️
                </button>
                
                {/* Volume */}
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔊</span>
                  <input 
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => {
                      const vol = parseFloat(e.target.value);
                      setVolume(vol);
                      if (videoRef.current) {
                        videoRef.current.volume = vol;
                      }
                    }}
                    className="w-20"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Replay Moment */}
                <button 
                  onClick={() => {
                    seekTo(moment.startTime);
                    if (!isPlaying) togglePlayPause();
                  }}
                  className="px-3 py-2 bg-[var(--iris)]/20 text-[var(--iris)] rounded-lg hover:bg-[var(--iris)]/30 transition text-sm"
                >
                  🔄 Replay Moment
                </button>
                
                {/* Fullscreen */}
                <button 
                  onClick={toggleFullscreen}
                  className="p-2 hover:bg-white/10 rounded-lg transition"
                  title="Toggle fullscreen"
                >
                  {isFullscreen ? '🗗' : '🗖'}
                </button>
              </div>
            </div>

            {/* Moment Context */}
            <div className="text-sm text-[var(--fg-dim)] bg-black/20 rounded-lg p-3">
              <div className="font-medium text-[var(--fg)] mb-1">📊 Context</div>
              <div>Query: "{moment.query}"</div>
              <div>Relevance Score: {Math.round(moment.score * 100)}%</div>
              <div>Duration: {formatTime(momentDuration)}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}