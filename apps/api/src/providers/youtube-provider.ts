import { LRUCache } from "lru-cache";
import { 
  ClipProvider, 
  SocialClip, 
  ClipSearchQuery, 
  YouTubeSearchResult, 
  YouTubeVideoDetails,
  buildSearchQuery,
  calculateRelevance
} from "../types/social-clips";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || "AIzaSyBwtw5d1DiFVqyI7PfSwNG1mrYKkBbSwjI";
const YOUTUBE_BASE_URL = "https://www.googleapis.com/youtube/v3";

// Cache search results for 6 hours
const searchCache = new LRUCache<string, SocialClip[]>({ 
  max: 500, 
  ttl: 1000 * 60 * 60 * 6 
});

// Cache video details for 24 hours
const videoCache = new LRUCache<string, SocialClip>({ 
  max: 1000, 
  ttl: 1000 * 60 * 60 * 24 
});

export class YouTubeProvider implements ClipProvider {
  platform = "youtube" as const;

  async search(query: ClipSearchQuery): Promise<SocialClip[]> {
    if (!YOUTUBE_API_KEY) {
      console.warn("YouTube API key not configured");
      return [];
    }

    const searchQueries = buildSearchQuery(query);
    if (searchQueries.length === 0) return [];

    const cacheKey = JSON.stringify({ query, timestamp: Math.floor(Date.now() / (1000 * 60 * 30)) });
    const cached = searchCache.get(cacheKey);
    if (cached) return cached;

    try {
      const allClips: SocialClip[] = [];
      
      // Search with multiple queries to get diverse results
      for (const searchQuery of searchQueries) {
        const clips = await this.searchYouTube(searchQuery, query.limit || 8);
        allClips.push(...clips);
      }

      // Remove duplicates by video ID
      const uniqueClips = allClips.reduce((acc, clip) => {
        if (!acc.find(c => c.externalId === clip.externalId)) {
          acc.push(clip);
        }
        return acc;
      }, [] as SocialClip[]);

      // Calculate relevance scores and sort
      const scoredClips = uniqueClips.map(clip => ({
        ...clip,
        relevanceScore: calculateRelevance(clip, query)
      })).sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

      const finalResults = scoredClips.slice(0, query.limit || 12);
      searchCache.set(cacheKey, finalResults);
      return finalResults;

    } catch (error) {
      console.error("YouTube search error:", error);
      return [];
    }
  }

  async getClipById(videoId: string): Promise<SocialClip | null> {
    const cached = videoCache.get(videoId);
    if (cached) return cached;

    try {
      const response = await fetch(
        `${YOUTUBE_BASE_URL}/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`
      );

      if (!response.ok) throw new Error(`YouTube API error: ${response.status}`);
      
      const data = await response.json();
      if (!data.items || data.items.length === 0) return null;

      const video: YouTubeVideoDetails = data.items[0];
      const clip = this.convertToSocialClip(video);
      
      videoCache.set(videoId, clip);
      return clip;
    } catch (error) {
      console.error("YouTube video fetch error:", error);
      return null;
    }
  }

  async generateEmbedHtml(clip: SocialClip): Promise<string> {
    const videoId = clip.externalId;
    const startParam = clip.startTime ? `&start=${clip.startTime}` : '';
    const endParam = clip.endTime ? `&end=${clip.endTime}` : '';
    
    return `
      <div class="youtube-embed-container" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;">
        <iframe 
          src="https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1${startParam}${endParam}"
          frameborder="0" 
          allowfullscreen
          style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
          loading="lazy">
        </iframe>
      </div>
    `;
  }

  private async searchYouTube(searchQuery: string, maxResults: number = 8): Promise<SocialClip[]> {
    const params = new URLSearchParams({
      part: 'snippet',
      q: searchQuery,
      type: 'video',
      order: 'relevance',
      maxResults: maxResults.toString(),
      key: YOUTUBE_API_KEY,
      // Focus on recent college football content
      publishedAfter: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), // Last year
      videoDefinition: 'any',
      videoDuration: 'any',
      safeSearch: 'none'
    });

    const response = await fetch(`${YOUTUBE_BASE_URL}/search?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`YouTube search API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.items) return [];

    // Get additional details for each video
    const videoIds = data.items.map((item: YouTubeSearchResult) => item.id.videoId).join(',');
    const detailsResponse = await fetch(
      `${YOUTUBE_BASE_URL}/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${YOUTUBE_API_KEY}`
    );

    let detailedVideos: YouTubeVideoDetails[] = [];
    if (detailsResponse.ok) {
      const detailsData = await detailsResponse.json();
      detailedVideos = detailsData.items || [];
    }

    return data.items.map((item: YouTubeSearchResult) => {
      const details = detailedVideos.find(v => v.id === item.id.videoId);
      return details ? this.convertToSocialClip(details) : this.convertSearchResultToClip(item);
    }).filter((clip: SocialClip | null): clip is SocialClip => clip !== null);
  }

  private convertToSocialClip(video: YouTubeVideoDetails): SocialClip {
    return {
      id: `youtube_${video.id}`,
      platform: "youtube",
      externalId: video.id,
      url: `https://www.youtube.com/watch?v=${video.id}`,
      title: video.snippet.title,
      author: video.snippet.channelTitle,
      authorUrl: `https://www.youtube.com/channel/${video.snippet.channelId}`,
      publishedAt: new Date(video.snippet.publishedAt),
      thumbnailUrl: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.medium?.url,
      description: video.snippet.description,
      duration: this.parseDuration(video.contentDetails?.duration),
      viewCount: video.statistics?.viewCount ? parseInt(video.statistics.viewCount) : undefined,
      tags: this.extractTags(video.snippet.title, video.snippet.description)
    };
  }

  private convertSearchResultToClip(item: YouTubeSearchResult): SocialClip {
    return {
      id: `youtube_${item.id.videoId}`,
      platform: "youtube",
      externalId: item.id.videoId,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      title: item.snippet.title,
      author: item.snippet.channelTitle,
      authorUrl: `https://www.youtube.com/channel/${item.snippet.channelId}`,
      publishedAt: new Date(item.snippet.publishedAt),
      thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
      description: item.snippet.description,
      tags: this.extractTags(item.snippet.title, item.snippet.description)
    };
  }

  private parseDuration(isoDuration?: string): number | undefined {
    if (!isoDuration) return undefined;
    
    // Parse ISO 8601 duration format (PT4M13S = 4 minutes 13 seconds)
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return undefined;

    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');

    return hours * 3600 + minutes * 60 + seconds;
  }

  private extractTags(title: string, description: string): string[] {
    const text = `${title} ${description}`.toLowerCase();
    const tags: string[] = [];

    // Extract common college football terms
    const cfbTerms = [
      'college football', 'cfb', 'ncaa football',
      'highlights', 'touchdown', 'td', 'interception', 'int',
      'passing', 'rushing', 'receiving', 'sack', 'fumble',
      'quarterback', 'qb', 'running back', 'rb', 'wide receiver', 'wr',
      'tight end', 'te', 'linebacker', 'lb', 'defensive back', 'db',
      'sec', 'big ten', 'acc', 'big 12', 'pac-12', 'big east'
    ];

    cfbTerms.forEach(term => {
      if (text.includes(term)) {
        tags.push(term);
      }
    });

    // Extract potential team names (capitalized words)
    const teamPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g;
    const potentialTeams = title.match(teamPattern) || [];
    
    // Common CFB team names to look for
    const cfbTeams = [
      'Alabama', 'Georgia', 'Ohio State', 'Michigan', 'Texas', 'USC', 
      'Notre Dame', 'Florida', 'LSU', 'Auburn', 'Tennessee', 'Kentucky',
      'Florida State', 'Clemson', 'Miami', 'Virginia Tech', 'North Carolina',
      'Penn State', 'Wisconsin', 'Iowa', 'Minnesota', 'Nebraska',
      'Oklahoma', 'Texas Tech', 'Baylor', 'TCU', 'Kansas State',
      'Oregon', 'Washington', 'Stanford', 'Cal', 'UCLA', 'Arizona State'
    ];

    potentialTeams.forEach(team => {
      if (cfbTeams.some(cfbTeam => cfbTeam.toLowerCase() === team.toLowerCase())) {
        tags.push(team);
      }
    });

    return Array.from(new Set(tags)); // Remove duplicates
  }

  // Utility method to get channel info
  async getChannelInfo(channelId: string) {
    try {
      const response = await fetch(
        `${YOUTUBE_BASE_URL}/channels?part=snippet,statistics&id=${channelId}&key=${YOUTUBE_API_KEY}`
      );
      
      if (response.ok) {
        const data = await response.json();
        return data.items?.[0] || null;
      }
    } catch (error) {
      console.error("Error fetching channel info:", error);
    }
    return null;
  }
}

// Export singleton instance
export const youTubeProvider = new YouTubeProvider();