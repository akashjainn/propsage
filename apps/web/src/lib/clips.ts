const BASE = process.env.NEXT_PUBLIC_API_URL!;

export type Platform = "youtube" | "twitter" | "instagram" | "tiktok" | "reddit";

export interface SocialClip {
  id: string;
  platform: Platform;
  externalId: string;
  url: string;
  title?: string;
  author?: string;
  authorUrl?: string;
  publishedAt?: Date;
  thumbnailUrl?: string;
  playerHtml?: string;
  duration?: number;
  viewCount?: number;
  description?: string;
  startTime?: number;
  endTime?: number;
  tags: string[];
  relevanceScore?: number;
  gameContext?: {
    opponent?: string;
    date?: string;
    week?: number;
    season?: number;
  };
}

export interface ClipSearchQuery {
  player?: string;
  team?: string;
  opponent?: string;
  date?: string;
  stat?: string;
  gameType?: string;
  limit?: number;
}

export interface ClipSearchResponse {
  clips: SocialClip[];
  total: number;
  cached: boolean;
  providers: string[];
}

export interface PlayerClipsResponse {
  clips: SocialClip[];
  player: {
    id: string;
    name: string;
    team?: string;
  };
  total: number;
}

export interface PropClipsResponse {
  clips: SocialClip[];
  prop: {
    id: string;
    playerName: string;
    team?: string;
    stat: string;
    marketLine: number;
  };
  total: number;
}

// Search for clips by various criteria
export const searchClips = async (query: ClipSearchQuery): Promise<SocialClip[]> => {
  const params = new URLSearchParams();
  
  if (query.player) params.set('player', query.player);
  if (query.team) params.set('team', query.team);
  if (query.opponent) params.set('opponent', query.opponent);
  if (query.date) params.set('date', query.date);
  if (query.stat) params.set('stat', query.stat);
  if (query.gameType) params.set('gameType', query.gameType);
  if (query.limit) params.set('limit', query.limit.toString());

  const response = await fetch(`${BASE}/cfb/clips?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to search clips');
  
  const data: ClipSearchResponse = await response.json();
  return data.clips || [];
};

// Get clips for a specific player
export const getPlayerClips = async (playerId: string, limit?: number): Promise<PlayerClipsResponse> => {
  const params = new URLSearchParams();
  if (limit) params.set('limit', limit.toString());

  const response = await fetch(`${BASE}/cfb/clips/player/${encodeURIComponent(playerId)}?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to get player clips');
  return response.json();
};

// Get clips relevant to a specific prop
export const getPropClips = async (propId: string, limit?: number): Promise<PropClipsResponse> => {
  const params = new URLSearchParams();
  if (limit) params.set('limit', limit.toString());

  const response = await fetch(`${BASE}/cfb/clips/prop/${encodeURIComponent(propId)}?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to get prop clips');
  return response.json();
};

// Get detailed information about a specific clip
export const getClipById = async (clipId: string): Promise<SocialClip> => {
  const response = await fetch(`${BASE}/cfb/clips/${encodeURIComponent(clipId)}`);
  if (!response.ok) throw new Error('Failed to get clip details');
  
  const data = await response.json();
  return data.clip;
};

// Get embed HTML for a clip
export const getClipEmbed = async (clipId: string): Promise<{ html: string; clip: Partial<SocialClip> }> => {
  const response = await fetch(`${BASE}/cfb/clips/${encodeURIComponent(clipId)}/embed`);
  if (!response.ok) throw new Error('Failed to get clip embed');
  return response.json();
};

// Helper functions
export function formatDuration(seconds?: number): string {
  if (!seconds) return 'Unknown';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes === 0) {
    return `${remainingSeconds}s`;
  } else if (minutes < 60) {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}

export function formatViewCount(count?: number): string {
  if (!count) return '';
  
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M views`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K views`;
  } else {
    return `${count} views`;
  }
}

export function formatPublishedAt(date?: Date): string {
  if (!date) return '';
  
  const publishedDate = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - publishedDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes}m ago`;
    }
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else if (diffDays < 30) {
    const diffWeeks = Math.floor(diffDays / 7);
    return `${diffWeeks}w ago`;
  } else if (diffDays < 365) {
    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths}mo ago`;
  } else {
    const diffYears = Math.floor(diffDays / 365);
    return `${diffYears}y ago`;
  }
}

export function getPlatformIcon(platform: Platform): string {
  switch (platform) {
    case 'youtube':
      return '▶️';
    case 'twitter':
      return '🐦';
    case 'instagram':
      return '📷';
    case 'tiktok':
      return '🎵';
    case 'reddit':
      return '🤖';
    default:
      return '📹';
  }
}

export function getPlatformColor(platform: Platform): string {
  switch (platform) {
    case 'youtube':
      return '#FF0000';
    case 'twitter':
      return '#1DA1F2';
    case 'instagram':
      return '#E4405F';
    case 'tiktok':
      return '#000000';
    case 'reddit':
      return '#FF4500';
    default:
      return '#666666';
  }
}