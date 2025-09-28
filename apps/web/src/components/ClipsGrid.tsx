"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Play } from 'lucide-react';
import type { Clip } from './clip.types';
import { useVideoThumb } from '../hooks/useVideoThumb';

interface ClipsGridProps {
  clips: Clip[];
  selectedPlayer?: { name: string; position: string; team: string };
}

// Component to handle thumbnail extraction from video first frame
const ThumbnailImage: React.FC<{ clip: Clip; className?: string; alt?: string }> = ({ clip, className, alt }) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);
  const isMockClip = clip.src.includes('/api/video/mock/') || clip.id.includes('_');
  
  // Intersection observer to only extract thumbnails for visible clips
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Stop observing once visible
        }
      },
      { threshold: 0.1 }
    );
    
    if (imgRef.current) {
      observer.observe(imgRef.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  // Extract thumbnail from first frame of video (only for visible real clips)
  const extractedThumb = useVideoThumb(
    !isMockClip && isVisible ? clip.src : undefined, 
    clip.start || 0
  );

  // Priority: extracted thumbnail > provided thumbnail > fallback API > placeholder
  const thumbnailSrc = extractedThumb || clip.thumbnail || `/api/thumb/${clip.id}`;
  const isExtracting = !extractedThumb && !isMockClip && isVisible;

  return (
    <div className="relative">
      <img
        ref={imgRef}
        src={thumbnailSrc}
        alt={alt || clip.title}
        className={className}
        onError={(e) => {
          // Fallback chain: API endpoint -> SVG placeholder
          const target = e.target as HTMLImageElement;
          if (target.src !== `/api/thumb/${clip.id}`) {
            target.src = `/api/thumb/${clip.id}`;
          }
        }}
      />
      {isExtracting && (
        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

const ClipsGrid: React.FC<ClipsGridProps> = ({ clips, selectedPlayer }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  if (clips.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 rounded-xl bg-gray-50">
        <div className="text-center">
          <Play className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No clips found</h3>
          <p className="text-gray-500">
            {selectedPlayer 
              ? `Video clips for ${selectedPlayer.name} will load when TwelveLabs is configured` 
              : 'Try searching for a player to see their video clips'
            }
          </p>
        </div>
      </div>
    );
  }

  const currentClip = clips[currentIndex];
  const isMockClip = currentClip.src.includes('/api/video/mock/') || currentClip.id.includes('_');

  return (
    <div className="space-y-4">
      {/* Current clip display */}
      <div className="rounded-xl overflow-hidden shadow-lg">
        {isMockClip ? (
          <div className="relative w-full aspect-video rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
            <div className="text-center text-white p-6">
              <div className="text-lg font-semibold mb-2">��� {currentClip.title}</div>
              <div className="text-sm opacity-75 mb-3">Mock clip for demonstration</div>
              <div className="text-xs opacity-50">Video will be available when TwelveLabs is configured</div>
              <div className="mt-4 flex items-center justify-center gap-2 text-xs opacity-75">
                <Play className="w-4 h-4" />
                <span>{Math.round(currentClip.end - currentClip.start)}s duration</span>
              </div>
            </div>
          </div>
        ) : (
          <video 
            controls 
            muted 
            playsInline 
            preload="metadata" 
            poster={currentClip.thumbnail} 
            src={currentClip.src} 
            className="w-full aspect-video rounded-xl bg-black" 
          />
        )}
        
        {/* Clip info */}
        <div className="p-4 bg-white">
          <h3 className="font-semibold text-lg mb-2">{currentClip.title}</h3>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Clip {currentIndex + 1} of {clips.length}</span>
            <span>{Math.round(currentClip.start)}s - {Math.round(currentClip.end)}s</span>
          </div>
        </div>
      </div>

      {/* Clip navigation thumbnails */}
      {clips.length > 1 && (
        <div className="grid grid-cols-3 gap-3">
          {clips.map((clip, index) => (
            <button
              key={clip.id}
              onClick={() => setCurrentIndex(index)}
              className={`relative rounded-lg overflow-hidden transition-all ${
                index === currentIndex 
                  ? 'ring-2 ring-blue-500 ring-offset-2' 
                  : 'hover:ring-2 hover:ring-gray-300'
              }`}
            >
              <ThumbnailImage
                clip={clip}
                className="w-full aspect-video object-cover"
                alt={clip.title}
              />
              <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                <Play className="w-6 h-6 text-white" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                <div className="text-white text-xs font-medium truncate">
                  {clip.title}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClipsGrid;
