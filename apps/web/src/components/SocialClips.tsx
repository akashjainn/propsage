"use client"
import React, { useState, useEffect } from 'react';
import { 
  SocialClip, 
  getPlayerClips, 
  getPropClips, 
  searchClips,
  ClipSearchQuery,
  formatDuration, 
  formatViewCount, 
  formatPublishedAt,
  getPlatformIcon,
  getPlatformColor
} from '@/lib/clips';

interface SocialClipsProps {
  // One of these should be provided to determine what clips to show
  playerId?: string;
  propId?: string;
  searchQuery?: ClipSearchQuery;
  
  // Display options
  limit?: number;
  showSearch?: boolean;
  title?: string;
  className?: string;
}

export function SocialClips({ 
  playerId, 
  propId, 
  searchQuery,
  limit = 6, 
  showSearch = false, 
  title,
  className = "" 
}: SocialClipsProps) {
  const [clips, setClips] = useState<SocialClip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedClip, setSelectedClip] = useState<SocialClip | null>(null);

  useEffect(() => {
    loadClips();
  }, [playerId, propId, searchQuery, limit]);

  const loadClips = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let fetchedClips: SocialClip[] = [];
      
      if (playerId) {
        const response = await getPlayerClips(playerId, limit);
        fetchedClips = response.clips;
      } else if (propId) {
        const response = await getPropClips(propId, limit);
        fetchedClips = response.clips;
      } else if (searchQuery) {
        fetchedClips = await searchClips({ ...searchQuery, limit });
      }
      
      setClips(fetchedClips);
    } catch (err) {
      console.error('Failed to load clips:', err);
      setError(err instanceof Error ? err.message : 'Failed to load clips');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {title && <h3 className="text-lg font-semibold text-[var(--fg)]">{title}</h3>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({length: limit}).map((_, i) => (
            <ClipSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center p-8 ${className}`}>
        <div className="text-red-400 mb-2">Failed to load clips</div>
        <div className="text-sm text-[var(--fg-dim)]">{error}</div>
        <button 
          onClick={loadClips}
          className="mt-4 px-4 py-2 bg-[var(--iris)] text-white rounded-lg hover:bg-[var(--iris)]/80 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  if (clips.length === 0) {
    return (
      <div className={`text-center p-8 text-[var(--fg-dim)] ${className}`}>
        {title && <h3 className="text-lg font-semibold text-[var(--fg)] mb-4">{title}</h3>}
        <div className="text-sm">No video clips found.</div>
        <div className="text-xs mt-1">Try searching for a different player or adjusting your search criteria.</div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {title && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[var(--fg)]">{title}</h3>
          <span className="text-sm text-[var(--fg-dim)]">{clips.length} clips</span>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {clips.map((clip) => (
          <ClipCard 
            key={clip.id} 
            clip={clip} 
            onClick={() => setSelectedClip(clip)}
          />
        ))}
      </div>

      {/* Modal for playing selected clip */}
      {selectedClip && (
        <ClipModal 
          clip={selectedClip} 
          onClose={() => setSelectedClip(null)} 
        />
      )}
    </div>
  );
}

interface ClipCardProps {
  clip: SocialClip;
  onClick: () => void;
}

function ClipCard({ clip, onClick }: ClipCardProps) {
  return (
    <div 
      className="rounded-xl bg-[var(--card)] ring-1 ring-white/10 overflow-hidden cursor-pointer hover:bg-white/5 transition group"
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-black/20">
        {clip.thumbnailUrl ? (
          <img 
            src={clip.thumbnailUrl} 
            alt={clip.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">
            {getPlatformIcon(clip.platform)}
          </div>
        )}
        
        {/* Platform badge */}
        <div 
          className="absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium text-white text-shadow"
          style={{ backgroundColor: getPlatformColor(clip.platform) }}
        >
          {getPlatformIcon(clip.platform)} {clip.platform}
        </div>

        {/* Duration badge */}
        {clip.duration && (
          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 text-white text-xs rounded">
            {formatDuration(clip.duration)}
          </div>
        )}

        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <div className="w-0 h-0 border-l-[12px] border-l-white border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent ml-1"></div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <h4 className="font-medium text-[var(--fg)] line-clamp-2 leading-tight">
          {clip.title || 'Untitled Clip'}
        </h4>
        
        <div className="text-sm text-[var(--fg-dim)] space-y-1">
          {clip.author && (
            <div className="truncate">{clip.author}</div>
          )}
          
          <div className="flex items-center justify-between text-xs">
            <span>{formatPublishedAt(clip.publishedAt)}</span>
            <span>{formatViewCount(clip.viewCount)}</span>
          </div>
        </div>

        {/* Tags */}
        {clip.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {clip.tags.slice(0, 3).map(tag => (
              <span 
                key={tag}
                className="px-2 py-1 text-xs bg-white/10 text-[var(--fg-dim)] rounded-full"
              >
                {tag}
              </span>
            ))}
            {clip.tags.length > 3 && (
              <span className="text-xs text-[var(--fg-dim)]">+{clip.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface ClipModalProps {
  clip: SocialClip;
  onClose: () => void;
}

function ClipModal({ clip, onClose }: ClipModalProps) {
  const [embedHtml, setEmbedHtml] = useState<string>('');
  const [loadingEmbed, setLoadingEmbed] = useState(true);

  useEffect(() => {
    loadEmbed();
  }, [clip.id]);

  const loadEmbed = async () => {
    try {
      if (clip.platform === 'youtube') {
        // For YouTube, we can generate the embed directly
        const videoId = clip.externalId;
        const startParam = clip.startTime ? `&start=${clip.startTime}` : '';
        const endParam = clip.endTime ? `&end=${clip.endTime}` : '';
        
        const html = `
          <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;">
            <iframe 
              src="https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=1${startParam}${endParam}"
              frameborder="0" 
              allowfullscreen
              allow="autoplay"
              style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;">
            </iframe>
          </div>
        `;
        setEmbedHtml(html);
      }
      // TODO: Handle other platforms via API call
    } catch (error) {
      console.error('Failed to load embed:', error);
    } finally {
      setLoadingEmbed(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--surface)] rounded-2xl ring-1 ring-[var(--stroke)] max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[var(--fg)] truncate">
              {clip.title || 'Video Clip'}
            </h3>
            <div className="text-sm text-[var(--fg-dim)] flex items-center gap-2 mt-1">
              <span style={{ color: getPlatformColor(clip.platform) }}>
                {getPlatformIcon(clip.platform)} {clip.platform}
              </span>
              {clip.author && <span>• {clip.author}</span>}
              {clip.duration && <span>• {formatDuration(clip.duration)}</span>}
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
        <div className="aspect-video bg-black">
          {loadingEmbed ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          ) : embedHtml ? (
            <div dangerouslySetInnerHTML={{ __html: embedHtml }} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/60">
              <div className="text-center">
                <div className="text-4xl mb-2">{getPlatformIcon(clip.platform)}</div>
                <div>Unable to load video player</div>
                <a 
                  href={clip.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[var(--iris)] hover:underline text-sm mt-2 inline-block"
                >
                  Watch on {clip.platform}
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-[var(--fg-dim)]">
              {clip.viewCount && <span>{formatViewCount(clip.viewCount)}</span>}
              {clip.publishedAt && <span>{formatPublishedAt(clip.publishedAt)}</span>}
            </div>
            <a 
              href={clip.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-4 py-2 bg-[var(--iris)]/20 text-[var(--iris)] rounded-lg hover:bg-[var(--iris)]/30 transition text-sm"
            >
              Open in {clip.platform}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClipSkeleton() {
  return (
    <div className="rounded-xl bg-[var(--card)] ring-1 ring-white/10 overflow-hidden">
      <div className="aspect-video bg-white/5 animate-pulse"></div>
      <div className="p-4 space-y-2">
        <div className="h-4 bg-white/10 rounded animate-pulse"></div>
        <div className="h-3 bg-white/5 rounded animate-pulse w-2/3"></div>
        <div className="flex justify-between">
          <div className="h-3 bg-white/5 rounded animate-pulse w-16"></div>
          <div className="h-3 bg-white/5 rounded animate-pulse w-12"></div>
        </div>
      </div>
    </div>
  );
}

// Hook for using clips in other components
export function useSocialClips(
  type: 'player' | 'prop' | 'search',
  query: string | ClipSearchQuery,
  limit: number = 6
) {
  const [clips, setClips] = useState<SocialClip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query) return;
    
    const loadClips = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let fetchedClips: SocialClip[] = [];
        
        if (type === 'player' && typeof query === 'string') {
          const response = await getPlayerClips(query, limit);
          fetchedClips = response.clips;
        } else if (type === 'prop' && typeof query === 'string') {
          const response = await getPropClips(query, limit);
          fetchedClips = response.clips;
        } else if (type === 'search' && typeof query === 'object') {
          fetchedClips = await searchClips({ ...query, limit });
        }
        
        setClips(fetchedClips);
      } catch (err) {
        console.error('Failed to load clips:', err);
        setError(err instanceof Error ? err.message : 'Failed to load clips');
      } finally {
        setLoading(false);
      }
    };

    loadClips();
  }, [type, query, limit]);

  return { clips, loading, error };
}