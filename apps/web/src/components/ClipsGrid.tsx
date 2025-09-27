'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react';

interface ClipData {
  id: string;
  playerId: string;
  title: string;
  src: string;
  start: number;
  end: number;
  tags: string[];
  thumbnail: string;
  source: string;
  confidence: number;
  gameId: string;
  quarter: number;
  timeRemaining: string;
  description: string;
  searchRelevance?: number;
}

interface ClipsGridProps {
  playerId: string;
  tags?: string[];
  onClipSelect?: (clip: ClipData) => void;
}

export default function ClipsGrid({ playerId, tags, onClipSelect }: ClipsGridProps) {
  const [clips, setClips] = useState<ClipData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClip, setSelectedClip] = useState<ClipData | null>(null);
  const [indexingStatus, setIndexingStatus] = useState<string>('Indexing stream...');
  
  useEffect(() => {
    fetchClips();
  }, [playerId, tags]);

  const fetchClips = async () => {
    setLoading(true);
    setError(null);
    
    // Simulate indexing delay with status updates
    const statusMessages = [
      'Connecting to TwelveLabs...',
      'Indexing video stream...',
      'Analyzing game footage...',
      'Extracting key moments...',
      'Calculating confidence scores...'
    ];
    
    let statusIndex = 0;
    const statusInterval = setInterval(() => {
      if (statusIndex < statusMessages.length - 1) {
        setIndexingStatus(statusMessages[statusIndex]);
        statusIndex++;
      }
    }, 200);

    try {
      const tagsParam = tags?.join(',') || '';
      const url = `/api/clips/player/${playerId}${tagsParam ? `?tags=${tagsParam}` : ''}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch clips');
      }
      
      const data = await response.json();
      
      clearInterval(statusInterval);
      setClips(data.items || []);
    } catch (err) {
      clearInterval(statusInterval);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleClipClick = (clip: ClipData) => {
    setSelectedClip(clip);
    onClipSelect?.(clip);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-500';
    if (confidence >= 0.8) return 'text-yellow-500';
    return 'text-orange-500';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.9) return 'High';
    if (confidence >= 0.8) return 'Medium';
    return 'Low';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Loading Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Video Analysis</h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">{indexingStatus}</span>
          </div>
        </div>
        
        {/* Loading Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-200 animate-pulse rounded-lg aspect-video"></div>
          ))}
        </div>
        
        {/* TwelveLabs Badge */}
        <div className="flex justify-center">
          <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 rounded-full border border-blue-200">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium text-blue-700">Powered by TwelveLabs</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-2">Failed to load clips</div>
        <button 
          onClick={fetchClips}
          className="text-blue-500 hover:text-blue-700 text-sm"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Video Evidence ({clips.length} clips)
        </h3>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-gray-600">Analysis Complete</span>
        </div>
      </div>

      {/* Clips Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clips.map((clip) => (
          <ClipCard 
            key={clip.id} 
            clip={clip} 
            onClick={() => handleClipClick(clip)}
            isSelected={selectedClip?.id === clip.id}
          />
        ))}
      </div>

      {/* TwelveLabs Badge */}
      <div className="flex justify-center">
        <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 rounded-full border border-blue-200">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span className="text-xs font-medium text-blue-700">Powered by TwelveLabs</span>
        </div>
      </div>

      {/* Selected Clip Player */}
      {selectedClip && (
        <ClipPlayer 
          clip={selectedClip} 
          onClose={() => setSelectedClip(null)}
        />
      )}
    </div>
  );
}

interface ClipCardProps {
  clip: ClipData;
  onClick: () => void;
  isSelected: boolean;
}

function ClipCard({ clip, onClick, isSelected }: ClipCardProps) {
  return (
    <div 
      className={`relative bg-white rounded-lg border-2 transition-all cursor-pointer hover:shadow-lg ${
        isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
        <img 
          src={clip.thumbnail} 
          alt={clip.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to a gradient background if thumbnail fails
            e.currentTarget.style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20"></div>
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
            <Play className="w-5 h-5 text-gray-700 ml-0.5" />
          </div>
        </div>

        {/* Duration Badge */}
        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
          {clip.end - clip.start}s
        </div>

        {/* Confidence Badge */}
        <div className={`absolute top-2 right-2 px-2 py-1 bg-white/90 text-xs rounded font-medium ${
          clip.confidence >= 0.9 ? 'text-green-600' : 
          clip.confidence >= 0.8 ? 'text-yellow-600' : 'text-orange-600'
        }`}>
          {Math.round(clip.confidence * 100)}%
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <h4 className="font-medium text-gray-900 text-sm mb-1 line-clamp-1">
          {clip.title}
        </h4>
        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
          {clip.description}
        </p>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-2">
          {clip.tags.slice(0, 3).map((tag) => (
            <span 
              key={tag}
              className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
          {clip.tags.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
              +{clip.tags.length - 3}
            </span>
          )}
        </div>

        {/* Game Info */}
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>Q{clip.quarter} {clip.timeRemaining}</span>
          <span className="flex items-center space-x-1">
            <span>Source:</span>
            <span className="font-medium">{clip.source}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

interface ClipPlayerProps {
  clip: ClipData;
  onClose: () => void;
}

function ClipPlayer({ clip, onClose }: ClipPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Set video to start time and autoplay
    video.currentTime = clip.start;
    video.play();
    setIsPlaying(true);

    // Auto-pause at end time
    const handleTimeUpdate = () => {
      if (video.currentTime >= clip.end) {
        video.pause();
        setIsPlaying(false);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [clip]);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.currentTime = clip.start;
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(!isMuted);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onClose}>
      <div className="relative bg-white rounded-lg max-w-4xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-gray-900">{clip.title}</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Video Player */}
        <div className="relative">
          <video
            ref={videoRef}
            src={clip.src}
            className="w-full aspect-video bg-black"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
          
          {/* Controls Overlay */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={togglePlayPause}
                className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>
              
              <button
                onClick={toggleMute}
                className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <span className="px-2 py-1 bg-white/90 rounded text-sm">
                {clip.end - clip.start}s clip
              </span>
            </div>
          </div>
        </div>

        {/* Clip Info */}
        <div className="p-4">
          <p className="text-gray-600 mb-3">{clip.description}</p>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Confidence:</span>
              <span className={`ml-2 font-medium ${
                clip.confidence >= 0.9 ? 'text-green-600' : 
                clip.confidence >= 0.8 ? 'text-yellow-600' : 'text-orange-600'
              }`}>
                {Math.round(clip.confidence * 100)}%
              </span>
            </div>
            <div>
              <span className="text-gray-500">Game Time:</span>
              <span className="ml-2 font-medium">
                Q{clip.quarter} {clip.timeRemaining}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            {clip.tags.map((tag) => (
              <span 
                key={tag}
                className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}