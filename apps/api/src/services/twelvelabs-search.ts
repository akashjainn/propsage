/**
 * Enhanced TwelveLabs Search Service
 * Replaces mock fallbacks with real API calls
 */

import { twelveLabsClient } from './twelve-labs-client.js';
import { TLMoment } from '../types/twelve-labs.js';
import { LRUCache } from 'lru-cache';

// Enhanced caching with different TTLs
const searchCache = new LRUCache<string, any>({ 
  max: 500, 
  ttl: 1000 * 60 * 30  // 30 minutes
});

const playerVideoCache = new LRUCache<string, string[]>({ 
  max: 200, 
  ttl: 1000 * 60 * 60  // 1 hour
});

export class TwelveLabsSearchService {
  
  /**
   * Search for clips by player and stat/market
   */
  async searchClips(params: {
    player?: string;
    stat?: string;
    market?: string;
    gameId?: string;
    limit?: number;
  }): Promise<{
    clips: any[];
    total: number;
    cached: boolean;
    source: 'twelvelabs' | 'fallback';
    indexStatus: string;
  }> {
    
    const { player, stat, market, gameId, limit = 10 } = params;
    const cacheKey = this.buildCacheKey(params);
    
    // Check cache first
    const cached = searchCache.get(cacheKey);
    if (cached) {
      return { ...cached, cached: true };
    }
    
    try {
      // Build search queries
      const queries = this.buildSearchQueries(player, stat, market);
      
      // Get relevant video IDs (filter by game/player if specified)
      const videoIds = await this.getRelevantVideoIds(player, gameId);
      
      // Search TwelveLabs
      const moments = await twelveLabsClient.searchMoments(queries, videoIds, limit);
      
      // Convert moments to clip format
      const clips = await this.convertMomentsToClips(moments);
      
      const result = {
        clips,
        total: clips.length,
        cached: false,
        source: 'twelvelabs' as const,
        indexStatus: clips.length > 0 ? 'ready' : 'no_results'
      };
      
      // Cache successful results
      if (clips.length > 0) {
        searchCache.set(cacheKey, result);
      }
      
      return result;
      
    } catch (error) {
      console.error('TwelveLabs search error:', error);
      
      // Fallback to mock data if API fails
      return this.fallbackSearch(params);
    }
  }
  
  /**
   * Get specific clip details
   */
  async getClipDetails(clipId: string): Promise<any | null> {
    const cacheKey = `clip:${clipId}`;
    const cached = searchCache.get(cacheKey);
    if (cached) return cached;
    
    try {
      // Parse clip ID format: "tl_videoId_startTime_index"
      const [prefix, videoId, startTime] = clipId.split('_');
      
      if (prefix !== 'tl' || !videoId || !startTime) {
        throw new Error('Invalid TwelveLabs clip ID format');
      }
      
      // Get video metadata from TwelveLabs
      const videoMeta = await twelveLabsClient.getVideoMetadata(videoId);
      if (!videoMeta) return null;
      
      // Build clip details
      const clip = {
        id: clipId,
        platform: 'twelvelabs',
        externalId: videoId,
        title: videoMeta.metadata?.filename || 'TwelveLabs Clip',
        description: `Video clip starting at ${startTime}s`,
        url: `/api/video/clip/${clipId}`,
        thumbnailUrl: `/api/video/thumbnail/${videoId}/${startTime}`,
        duration: 30, // Default clip length
        startTime: parseFloat(startTime),
        endTime: parseFloat(startTime) + 30,
        gameContext: videoMeta.metadata || {},
        relevanceScore: 0.8
      };
      
      searchCache.set(cacheKey, clip);
      return clip;
      
    } catch (error) {
      console.error('Error getting clip details:', error);
      return null;
    }
  }
  
  /**
   * Build search queries for TwelveLabs based on player/stat
   */
  private buildSearchQueries(player?: string, stat?: string, market?: string): string[] {
    const queries: string[] = [];
    const searchTerm = stat || market || '';
    
    if (player && searchTerm) {
      // Player-specific queries
      queries.push(`${player} ${searchTerm}`);
      
      // Add variations based on stat type
      if (searchTerm.toLowerCase().includes('pass')) {
        queries.push(`${player} throwing touchdown`);
        queries.push(`${player} passing yards`);
      } else if (searchTerm.toLowerCase().includes('rush')) {
        queries.push(`${player} running touchdown`);
        queries.push(`${player} rushing yards`);
      } else if (searchTerm.toLowerCase().includes('receiv')) {
        queries.push(`${player} catching touchdown`);
        queries.push(`${player} receiving yards`);
      }
    } else if (searchTerm) {
      // Generic stat queries
      queries.push(searchTerm);
    } else {
      // Default highlights
      queries.push('touchdown', 'big play', 'highlight');
    }
    
    return queries.slice(0, 3); // Limit to 3 queries for efficiency
  }
  
  /**
   * Get relevant video IDs for filtering (from database or TL index)
   */
  private async getRelevantVideoIds(player?: string, gameId?: string): Promise<string[] | undefined> {
    // Check cache first
    const cacheKey = `videos:${player || 'all'}:${gameId || 'all'}`;
    const cached = playerVideoCache.get(cacheKey);
    if (cached) return cached;
    
    try {
      // TODO: Query your database for relevant video IDs
      // For now, return undefined to search all videos in the index
      
      // Example database query:
      // const videos = await db.query(`
      //   SELECT tl_video_id FROM tl_videos tv
      //   LEFT JOIN tl_player_videos pv ON tv.video_id = pv.video_id
      //   WHERE (pv.player_id = ? OR ? IS NULL)
      //   AND (tv.external_ref = ? OR ? IS NULL)
      //   AND tv.status = 'ready'
      // `, [player, player, gameId, gameId]);
      
      return undefined; // Search all videos for now
      
    } catch (error) {
      console.error('Error getting relevant video IDs:', error);
      return undefined;
    }
  }
  
  /**
   * Convert TL moments to your clip format
   */
  private async convertMomentsToClips(moments: TLMoment[]): Promise<any[]> {
    return moments.map(moment => ({
      id: moment.id,
      platform: 'twelvelabs',
      externalId: moment.videoId,
      title: moment.label,
      description: `${moment.query} (${Math.round(moment.endTime - moment.startTime)}s clip)`,
      url: `/api/video/clip/${moment.id}`,
      thumbnailUrl: moment.thumbnailUrl || `/api/video/thumbnail/${moment.videoId}/${moment.startTime}`,
      author: 'PropSage Highlights',
      duration: Math.round(moment.endTime - moment.startTime),
      publishedAt: new Date().toISOString(),
      startTime: moment.startTime,
      endTime: moment.endTime,
      relevanceScore: moment.score,
      confidence: moment.confidence,
      tags: [moment.query.split(' ')[0]],
      gameContext: {
        videoId: moment.videoId,
        query: moment.query
      }
    }));
  }
  
  /**
   * Fallback to mock data when TwelveLabs is unavailable
   */
  private async fallbackSearch(params: any): Promise<any> {
    console.log('🔄 Using fallback search (TwelveLabs unavailable)');
    
    // Import your existing mock data
    try {
      // Mock data would be imported from your data file
      const TWELVE_LABS_MOCK = { players: {} }; // Placeholder
      
      // Use existing mock logic here
      const mockClips = this.processMockData(TWELVE_LABS_MOCK, params);
      
      return {
        clips: mockClips,
        total: mockClips.length,
        cached: false,
        source: 'fallback' as const,
        indexStatus: 'mock_data'
      };
      
    } catch (error) {
      console.error('Fallback search also failed:', error);
      return {
        clips: [],
        total: 0,
        cached: false,
        source: 'fallback' as const,
        indexStatus: 'error'
      };
    }
  }
  
  private processMockData(mockData: any, params: any): any[] {
    // Implement your existing mock data processing logic here
    // This is a simplified version
    const { player, stat, limit = 10 } = params;
    
    if (!mockData.players) return [];
    
    const clips: any[] = [];
    
    for (const [playerId, playerData] of Object.entries(mockData.players)) {
      const pData = playerData as any;
      
      // Filter by player if specified
      if (player && !pData.name?.toLowerCase().includes(player.toLowerCase())) {
        continue;
      }
      
      for (const video of pData.videos || []) {
        // Filter by stat if specified
        if (stat && !video.tags?.some((tag: string) => 
          tag.toLowerCase().includes(stat.toLowerCase()) ||
          stat.toLowerCase().includes(tag.toLowerCase())
        )) {
          continue;
        }
        
        clips.push({
          id: `mock_${video.id}`,
          platform: 'mock',
          title: video.title,
          url: video.url,
          thumbnailUrl: video.thumbnail,
          duration: video.duration,
          relevanceScore: video.confidence,
          tags: video.tags
        });
      }
    }
    
    return clips.slice(0, limit);
  }
  
  private buildCacheKey(params: any): string {
    const { player, stat, market, gameId, limit } = params;
    return `search:${player || ''}:${stat || ''}:${market || ''}:${gameId || ''}:${limit || 10}`;
  }
}

export const tlSearchService = new TwelveLabsSearchService();