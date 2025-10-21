/**
 * Unified Evidence Service with League-Aware Filtering
 * 
 * Wrapper service that routes evidence requests to the correct league-specific
 * service while ensuring no cross-contamination between CFB and NFL clips.
 */

import { LRUCache } from 'lru-cache';
import { twelveLabsClient } from './twelve-labs-client.js';
import type { TLMoment } from '../types/twelve-labs.js';
import {
  LeagueContext,
  buildLeagueAwareQuery,
  buildMetadataFilter,
  filterByLeague,
  rankByLeagueContext,
  validateContext,
  detectLeague,
  League
} from './league-context.js';

export interface EvidenceSearchOptions {
  limit?: number;
  minScore?: number;
  indexId?: string;
}

export interface UnifiedEvidenceClip {
  id: string;
  videoId: string;
  league: League;
  start: number;
  end: number;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  confidence: number;
  metadata: {
    league: string;
    team?: string;
    opponent?: string;
    week?: number;
    season?: string;
    player?: string;
    propType?: string;
    tags?: string[];
  };
  url: string;
}

export class UnifiedEvidenceService {
  private cache = new Map<string, { results: UnifiedEvidenceClip[]; timestamp: number }>();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Search for evidence with league context
   */
  async searchEvidence(
    context: LeagueContext,
    options: EvidenceSearchOptions = {}
  ): Promise<UnifiedEvidenceClip[]> {
    // Validate context
    const validation = validateContext(context);
    if (!validation.valid) {
      throw new Error(`Invalid league context: ${validation.errors.join(', ')}`);
    }

    const cacheKey = JSON.stringify({ context, options });
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      console.log(`[UnifiedEvidence] Cache hit for ${context.league}/${context.player}`);
      return cached.results;
    }

    console.log(`[UnifiedEvidence] Searching ${context.league.toUpperCase()}:`, context);

    // Build league-aware query
    const query = buildLeagueAwareQuery(context);
    const metadataFilters = buildMetadataFilter(context);

    console.log(`[UnifiedEvidence] Query: "${query}"`);
    console.log(`[UnifiedEvidence] Filters:`, metadataFilters);

    // Search TwelveLabs (would call actual TL client here)
    const rawResults = await this.performTwelveLabsSearch(
      query,
      metadataFilters,
      options.indexId,
      options.limit || 10
    );

    console.log(`[UnifiedEvidence] Raw results: ${rawResults.length}`);

    // Post-filter by league to remove any cross-contamination
    const leagueFiltered = filterByLeague(
      rawResults,
      context.league,
      context.team
    );

    console.log(`[UnifiedEvidence] After league filter: ${leagueFiltered.length}`);

    // Rank by context relevance
    const ranked = rankByLeagueContext(leagueFiltered, context);

    // Convert to unified format
    const results = ranked.map(r => this.toUnifiedClip(r, context.league));

    // Cache
    this.cache.set(cacheKey, { results, timestamp: Date.now() });

    return results.slice(0, options.limit || 10);
  }

  /**
   * Auto-detect league and search
   * Useful when league context is ambiguous
   */
  async searchWithAutoDetect(
    player: string,
    propType: string,
    team?: string,
    options: EvidenceSearchOptions = {}
  ): Promise<UnifiedEvidenceClip[]> {
    // Try to detect league from team
    const league = team ? detectLeague(team) : null;

    if (!league) {
      console.warn(`[UnifiedEvidence] Could not detect league for team: ${team}`);
      // Search both leagues and merge (not recommended for production)
      const nflResults = await this.searchEvidence(
        { league: 'nfl', player, team, propType, season: '2024', week: 5 },
        { ...options, limit: Math.ceil((options.limit || 10) / 2) }
      );
      const cfbResults = await this.searchEvidence(
        { league: 'cfb', player, team, propType, season: '2024' },
        { ...options, limit: Math.ceil((options.limit || 10) / 2) }
      );
      return [...nflResults, ...cfbResults]
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, options.limit || 10);
    }

    // League detected, do targeted search
    const context: LeagueContext = {
      league,
      player,
      team,
      propType,
      season: '2024',
      ...(league === 'nfl' ? { week: 5 } : {})
    };

    return this.searchEvidence(context, options);
  }

  /**
   * Batch search for multiple players/props
   */
  async batchSearch(
    contexts: LeagueContext[],
    options: EvidenceSearchOptions = {}
  ): Promise<Map<string, UnifiedEvidenceClip[]>> {
    const results = new Map<string, UnifiedEvidenceClip[]>();

    // Search in parallel
    await Promise.all(
      contexts.map(async (ctx) => {
        const key = `${ctx.league}:${ctx.player}:${ctx.propType}`;
        try {
          const clips = await this.searchEvidence(ctx, options);
          results.set(key, clips);
        } catch (error) {
          console.error(`[UnifiedEvidence] Batch search failed for ${key}:`, error);
          results.set(key, []);
        }
      })
    );

    return results;
  }

  /**
   * Perform actual TwelveLabs search
   */
  private async performTwelveLabsSearch(
    query: string,
    metadataFilters: Record<string, any>,
    indexId?: string,
    limit: number = 10
  ): Promise<TLMoment[]> {
    console.log(`[UnifiedEvidence] TL Search: query="${query}", filters=`, metadataFilters);
    
    try {
      // Build array of query strings - single query for now
      const queries = [query];
      
      // Extract video IDs from filters if present (TL client expects this format)
      const videoIds = metadataFilters.video_id ? 
        (Array.isArray(metadataFilters.video_id) ? metadataFilters.video_id : [metadataFilters.video_id]) 
        : undefined;
      
      // Search using TwelveLabs client
      const moments = await twelveLabsClient.searchMoments(queries, videoIds, limit);
      
      console.log(`[UnifiedEvidence] Found ${moments.length} moments`);
      return moments;
      
    } catch (error) {
      console.error('[UnifiedEvidence] TL search error:', error);
      return [];
    }
  }

  /**
   * Convert TL moment to unified clip format
   */
  private toUnifiedClip(moment: TLMoment, league: League): UnifiedEvidenceClip {
    // Parse confidence string to number
    const confidenceMap = { low: 0.4, medium: 0.6, high: 0.8 };
    const confidenceValue = typeof moment.confidence === 'string' 
      ? confidenceMap[moment.confidence] || 0.5
      : moment.score || 0.5;
    
    return {
      id: moment.id,
      videoId: moment.videoId,
      league,
      start: moment.startTime,
      end: moment.endTime,
      title: moment.label || 'Highlight',
      description: moment.query || undefined,
      thumbnailUrl: moment.thumbnailUrl,
      confidence: confidenceValue,
      metadata: {
        league: league.toUpperCase(),
        team: undefined, // Would come from video metadata if available
        opponent: undefined,
        week: undefined,
        season: undefined,
        player: undefined,
        propType: undefined,
        tags: []
      },
      url: moment.thumbnailUrl || '' // TL client returns thumbnail, HLS comes from video metadata
    };
  }

  /**
   * Clear cache (useful for testing or after reindexing)
   */
  clearCache(): void {
    this.cache.clear();
    console.log('[UnifiedEvidence] Cache cleared');
  }
}

// Singleton instance
export const unifiedEvidenceService = new UnifiedEvidenceService();
