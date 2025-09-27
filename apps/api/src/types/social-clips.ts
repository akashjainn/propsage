export type Platform = "youtube" | "twitter" | "instagram" | "tiktok" | "reddit" | "twelvelabs";

export interface SocialClip {
  id: string;
  platform: Platform;
  externalId: string;        // YouTube videoId, Tweet ID, etc.
  url: string;               // Canonical URL
  title?: string;
  author?: string;
  authorUrl?: string;
  publishedAt?: Date;
  thumbnailUrl?: string;
  playerHtml?: string;       // Cached oEmbed HTML for embeds
  duration?: number;         // Duration in seconds
  viewCount?: number;
  description?: string;
  startTime?: number;        // Optional: start at specific time (seconds)
  endTime?: number;          // Optional: end at specific time (seconds)
  tags: string[];            // ["Ryan Puglisi", "Georgia", "QB", "highlights"]
  relevanceScore?: number;   // 0-1 relevance to search query
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
  stat?: string;              // "passing", "rushing", "receiving"
  gameType?: string;          // "highlights", "touchdown", "interception"
  limit?: number;
}

export interface ClipProvider {
  platform: Platform;
  search(query: ClipSearchQuery): Promise<SocialClip[]>;
  getClipById(id: string): Promise<SocialClip | null>;
  generateEmbedHtml(clip: SocialClip): Promise<string>;
}

// YouTube-specific types
export interface YouTubeSearchResult {
  kind: string;
  etag: string;
  id: {
    kind: string;
    videoId: string;
  };
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default: { url: string; width: number; height: number };
      medium: { url: string; width: number; height: number };
      high: { url: string; width: number; height: number };
    };
    channelTitle: string;
    publishTime: string;
  };
}

export interface YouTubeVideoDetails {
  kind: string;
  etag: string;
  id: string;
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default: { url: string; width: number; height: number };
      medium: { url: string; width: number; height: number };
      high: { url: string; width: number; height: number };
      standard?: { url: string; width: number; height: number };
      maxres?: { url: string; width: number; height: number };
    };
    channelTitle: string;
    categoryId: string;
    defaultLanguage?: string;
    defaultAudioLanguage?: string;
  };
  statistics?: {
    viewCount: string;
    likeCount: string;
    favoriteCount: string;
    commentCount: string;
  };
  contentDetails?: {
    duration: string;
    definition: string;
    caption: string;
  };
}

// Twitter/X-specific types (for future implementation)
export interface TwitterTweet {
  id: string;
  text: string;
  author_id: string;
  created_at: string;
  public_metrics?: {
    retweet_count: number;
    like_count: number;
    reply_count: number;
    quote_count: number;
  };
  attachments?: {
    media_keys: string[];
  };
}

// Search query builders
export function buildSearchQuery(query: ClipSearchQuery): string[] {
  const queries: string[] = [];
  
  if (query.player && query.opponent && query.date) {
    // Most specific: player vs opponent on date
    queries.push(`${query.player} vs ${query.opponent} ${query.date} highlights`);
    queries.push(`${query.player} ${query.opponent} ${query.date?.slice(0, 4)}`);
  }
  
  if (query.player && query.team && query.stat) {
    // Player + stat highlights
    queries.push(`${query.player} ${query.team} ${query.stat} highlights`);
    queries.push(`${query.player} ${query.stat} highlights ${query.date?.slice(0, 4) || '2024'}`);
  }
  
  if (query.player && query.team) {
    // General player highlights
    queries.push(`${query.player} ${query.team} highlights`);
    queries.push(`${query.player} highlights college football`);
  }
  
  if (query.team && query.opponent && query.date) {
    // Team game highlights
    queries.push(`${query.team} vs ${query.opponent} ${query.date} highlights`);
    queries.push(`${query.team} ${query.opponent} highlights ${query.date?.slice(0, 4)}`);
  }
  
  if (query.team) {
    // General team highlights
    queries.push(`${query.team} highlights college football ${query.date?.slice(0, 4) || '2024'}`);
  }
  
  return queries.slice(0, 3); // Limit to top 3 queries
}

// Relevance scoring
export function calculateRelevance(clip: SocialClip, query: ClipSearchQuery): number {
  let score = 0;
  const title = clip.title?.toLowerCase() || '';
  const description = clip.description?.toLowerCase() || '';
  const searchText = `${title} ${description}`;
  
  // Player name match (highest priority)
  if (query.player && searchText.includes(query.player.toLowerCase())) {
    score += 0.4;
  }
  
  // Team name match
  if (query.team && searchText.includes(query.team.toLowerCase())) {
    score += 0.2;
  }
  
  // Opponent match
  if (query.opponent && searchText.includes(query.opponent.toLowerCase())) {
    score += 0.15;
  }
  
  // Stat-specific keywords
  if (query.stat) {
    const statKeywords = {
      passing: ['pass', 'throw', 'touchdown pass', 'passing', 'yards'],
      rushing: ['rush', 'run', 'rushing', 'carries', 'yards'],
      receiving: ['catch', 'reception', 'receiving', 'yards']
    };
    
    const keywords = statKeywords[query.stat.toLowerCase() as keyof typeof statKeywords] || [];
    const matches = keywords.filter(keyword => searchText.includes(keyword));
    score += matches.length * 0.05;
  }
  
  // Recency bonus (newer videos are more relevant)
  if (clip.publishedAt) {
    const daysSincePublish = (Date.now() - clip.publishedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSincePublish < 7) score += 0.1;      // Published this week
    else if (daysSincePublish < 30) score += 0.05; // Published this month
  }
  
  // View count bonus (more popular = more likely to be relevant)
  if (clip.viewCount) {
    if (clip.viewCount > 100000) score += 0.05;
    else if (clip.viewCount > 10000) score += 0.03;
    else if (clip.viewCount > 1000) score += 0.01;
  }
  
  return Math.min(1, score); // Cap at 1.0
}