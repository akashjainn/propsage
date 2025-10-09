/**
 * NFL Evidence Service - Week 5 Highlights Integration
 * 
 * This service queries your TwelveLabs index of Week 5 NFL highlights
 * and converts them into structured evidence for PropSage betting lines.
 */

import { LRUCache } from "lru-cache";

// Types for NFL evidence
export interface NFLEvidenceClip {
  id: string;
  videoId: string;
  t0: number;  // clip start (seconds)
  t1: number;  // clip end (seconds)
  label: string;  // original query
  tags: string[];  // e.g., ["TD_RUSH","RZ","Q4"]
  confidence: number;  // TwelveLabs confidence score
  actors?: {
    players?: string[];
    teams?: string[];
  };
  game?: {
    week: number;
    home: string;
    away: string;
    quarter?: number;
  };
  context: {
    transcript?: string;
    thumbnail?: string;
  };
  // PropSage evidence fields
  evidenceWeight: number;
  deltaMu: number;
  deltaSigma: number;
}

interface TLSearchHit {
  video_id: string;
  score: number;
  start: number;
  end: number;
  transcription?: string;
  thumbnail_url?: string;
  metadata?: any;
}

// NFL-specific query patterns
const NFL_QUERY_PATTERNS: Record<string, string[]> = {
  // Rushing props
  'rushing_attempts': [
    'rushing attempt handoff',
    'running play backfield',
    'ground game carry'
  ],
  'rushing_yards': [
    'explosive run 10+ yards',
    'rushing touchdown long run',
    'breakaway run sideline'
  ],
  'rushing_touchdowns': [
    'rushing touchdown goal line',
    'touchdown run red zone',
    'ground game touchdown'
  ],
  
  // Passing props
  'passing_attempts': [
    'pass attempt quarterback throw',
    'passing play downfield',
    'quarterback drop back throw'
  ],
  'passing_yards': [
    'explosive pass 20+ yards',
    'deep ball touchdown pass',
    'long completion downfield'
  ],
  'passing_touchdowns': [
    'touchdown pass end zone',
    'passing touchdown red zone',
    'quarterback touchdown throw'
  ],
  
  // Receiving props
  'receptions': [
    'reception catch target',
    'pass completion receiver',
    'catch and run receiver'
  ],
  'receiving_yards': [
    'explosive reception 15+ yards',
    'long catch and run',
    'deep ball reception'
  ],
  'receiving_touchdowns': [
    'touchdown reception end zone',
    'receiving touchdown catch',
    'touchdown pass to receiver'
  ],
  
  // Situational contexts
  'red_zone': [
    'red zone attempt goal line',
    'inside 20 yard line',
    'goal to go situation'
  ],
  'fourth_quarter': [
    'fourth quarter drive',
    'game winning drive',
    'two minute drill'
  ],
  'third_down': [
    '3rd and long conversion',
    'third down attempt',
    '3rd and short'
  ],
  'default': ['football play', 'offensive play', 'team play']
};

// Evidence impact weights based on situation
const EVIDENCE_WEIGHTS: Record<string, { weight: number; deltaMu: number; deltaSigma: number }> = {
  'rushing_touchdowns': { weight: 0.9, deltaMu: 0.15, deltaSigma: -0.05 },
  'passing_touchdowns': { weight: 0.85, deltaMu: 0.12, deltaSigma: -0.04 },
  'red_zone': { weight: 0.8, deltaMu: 0.08, deltaSigma: -0.03 },
  'fourth_quarter': { weight: 0.75, deltaMu: 0.06, deltaSigma: -0.02 },
  'explosive_plays': { weight: 0.7, deltaMu: 0.04, deltaSigma: -0.01 },
  'default': { weight: 0.6, deltaMu: 0.02, deltaSigma: 0 }
};

// Cache for evidence queries (30 minutes)
const evidenceCache = new LRUCache<string, NFLEvidenceClip[]>({
  max: 100,
  ttl: 1000 * 60 * 30
});

export class NFLEvidenceService {
  private apiKey: string;
  private indexId: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.TWELVELABS_API_KEY || '';
    this.indexId = process.env.TWELVELABS_INDEX_ID || '';
    this.baseUrl = process.env.TWELVELABS_BASE_URL || 'https://api.twelvelabs.io/v1.3';
    
    if (!this.apiKey || !this.indexId) {
      console.warn('NFL Evidence Service: TwelveLabs not configured');
    }
  }

  /**
   * Search TwelveLabs for NFL highlights
   */
  async searchHighlights(query: string, options: {
    limit?: number;
    minScore?: number;
    contextPadding?: number;
  } = {}): Promise<NFLEvidenceClip[]> {
    const { limit = 25, minScore = 0.6, contextPadding = 6 } = options;
    
    if (!this.apiKey) {
      return [];
    }

    const cacheKey = JSON.stringify({ query, limit, minScore });
    const cached = evidenceCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const formData = new FormData();
      formData.append('query_text', query);
      formData.append('index_id', this.indexId);
      formData.append('search_options', 'visual');
      formData.append('search_options', 'audio');
      formData.append('sort_option', 'score');
      formData.append('page_limit', limit.toString());

      const response = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey
        },
        body: formData
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`TwelveLabs search failed: ${response.status} - ${text}`);
      }

      const result = await response.json();
      const hits: TLSearchHit[] = result.data || [];

      const clips = hits
        .filter(hit => hit.score >= minScore * 100) // TL scores are 0-100
        .map(hit => this.createEvidenceClip(hit, query, contextPadding));

      evidenceCache.set(cacheKey, clips);
      return clips;

    } catch (error) {
      console.error('NFL Evidence Service search error:', error);
      return [];
    }
  }

  /**
   * Get evidence for specific NFL prop categories
   */
  async getEvidenceForProp(
    propType: string,
    player?: string,
    team?: string,
    options: { limit?: number; minScore?: number } = {}
  ): Promise<NFLEvidenceClip[]> {
    const queries = this.buildQueriesForProp(propType, player, team);
    const allClips: NFLEvidenceClip[] = [];

    for (const query of queries) {
      const clips = await this.searchHighlights(query, options);
      allClips.push(...clips);
    }

    // Deduplicate and sort by confidence
    const deduplicated = this.deduplicateClips(allClips);
    return deduplicated
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, options.limit || 10);
  }

  /**
   * Build search queries for specific prop types
   */
  private buildQueriesForProp(propType: string, player?: string, team?: string): string[] {
    const baseQueries = NFL_QUERY_PATTERNS[propType] || NFL_QUERY_PATTERNS['default'] || ['football play'];
    
    const queries: string[] = [];
    
    // Add base queries
    queries.push(...baseQueries);
    
    // Add player-specific queries
    if (player) {
      baseQueries.forEach((query: string) => {
        queries.push(`${query} by ${player}`);
        queries.push(`${player} ${query}`);
      });
    }
    
    // Add team-specific queries
    if (team) {
      baseQueries.forEach((query: string) => {
        queries.push(`${query} ${team}`);
        queries.push(`${team} ${query}`);
      });
    }

    return queries.slice(0, 8); // Limit to prevent too many API calls
  }

  /**
   * Create evidence clip with PropSage-compatible fields
   */
  private createEvidenceClip(hit: TLSearchHit, query: string, padding: number): NFLEvidenceClip {
    const tags = this.extractTags(query, hit.transcription);
    const evidenceType = this.categorizeEvidence(tags, query);
    const weights = EVIDENCE_WEIGHTS[evidenceType] || EVIDENCE_WEIGHTS.default;
    
    return {
      id: `nfl_${hit.video_id}_${hit.start}`,
      videoId: hit.video_id,
      t0: Math.max(0, hit.start - padding),
      t1: hit.end + padding,
      label: query,
      tags,
      confidence: hit.score / 100, // Convert TL 0-100 to 0-1
      actors: this.extractActors(hit.transcription),
      game: { week: 5, home: 'TBD', away: 'TBD' }, // Could extract from metadata
      context: {
        transcript: hit.transcription,
        thumbnail: hit.thumbnail_url
      },
      // PropSage evidence fields
      evidenceWeight: weights.weight,
      deltaMu: weights.deltaMu,
      deltaSigma: weights.deltaSigma
    };
  }

  /**
   * Extract relevant tags from query and transcript
   */
  private extractTags(query: string, transcript?: string): string[] {
    const tags: string[] = [];
    
    const text = `${query} ${transcript || ''}`.toLowerCase();
    
    // Situation tags
    if (text.includes('touchdown') || text.includes('td')) tags.push('TOUCHDOWN');
    if (text.includes('red zone') || text.includes('goal line')) tags.push('RED_ZONE');
    if (text.includes('fourth quarter') || text.includes('4th quarter')) tags.push('Q4');
    if (text.includes('two minute') || text.includes('2 minute')) tags.push('TWO_MIN');
    if (text.includes('3rd') || text.includes('third down')) tags.push('THIRD_DOWN');
    if (text.includes('explosive') || text.includes('long')) tags.push('BIG_PLAY');
    
    // Play type tags
    if (text.includes('rush') || text.includes('run')) tags.push('RUSH');
    if (text.includes('pass') || text.includes('throw')) tags.push('PASS');
    if (text.includes('catch') || text.includes('reception')) tags.push('CATCH');
    
    return tags;
  }

  /**
   * Extract player and team names from transcript
   */
  private extractActors(transcript?: string): { players?: string[]; teams?: string[] } {
    if (!transcript) return {};
    
    // Simple name extraction (could be enhanced with NER)
    const playerMatches = transcript.match(/([A-Z][a-z]+ [A-Z][a-z]+)/g) || [];
    const players = [...new Set(playerMatches)].slice(0, 3); // Limit to 3 names
    
    return { players: players.length > 0 ? players : undefined };
  }

  /**
   * Categorize evidence for weight assignment
   */
  private categorizeEvidence(tags: string[], query: string): string {
    if (tags.includes('TOUCHDOWN')) {
      if (tags.includes('RUSH')) return 'rushing_touchdowns';
      if (tags.includes('PASS')) return 'passing_touchdowns';
      return 'touchdowns';
    }
    if (tags.includes('RED_ZONE')) return 'red_zone';
    if (tags.includes('Q4')) return 'fourth_quarter';
    if (tags.includes('BIG_PLAY')) return 'explosive_plays';
    
    return 'default';
  }

  /**
   * Deduplicate clips based on video ID and time overlap
   */
  private deduplicateClips(clips: NFLEvidenceClip[]): NFLEvidenceClip[] {
    const unique: NFLEvidenceClip[] = [];
    
    for (const clip of clips) {
      const isDuplicate = unique.some(existing => 
        existing.videoId === clip.videoId &&
        Math.abs(existing.t0 - clip.t0) < 10 // 10 second overlap threshold
      );
      
      if (!isDuplicate || clip.confidence > (unique.find(u => 
        u.videoId === clip.videoId && Math.abs(u.t0 - clip.t0) < 10
      )?.confidence || 0)) {
        // Remove lower confidence duplicates
        const existingIndex = unique.findIndex(u => 
          u.videoId === clip.videoId && Math.abs(u.t0 - clip.t0) < 10
        );
        if (existingIndex >= 0) {
          unique[existingIndex] = clip;
        } else {
          unique.push(clip);
        }
      }
    }
    
    return unique;
  }

  /**
   * Get comprehensive evidence for a player prop
   */
  async getPlayerPropEvidence(
    playerId: string,
    propType: string,
    options: { team?: string; limit?: number; minScore?: number } = {}
  ) {
    console.log(`🏈 Getting NFL evidence for ${playerId} - ${propType}`);
    
    const evidence = await this.getEvidenceForProp(
      propType,
      playerId,
      options.team,
      { limit: options.limit || 8, minScore: options.minScore || 0.6 }
    );
    
    return {
      playerId,
      propType,
      evidence,
      totalClips: evidence.length,
      avgConfidence: evidence.length > 0 
        ? evidence.reduce((sum, e) => sum + e.confidence, 0) / evidence.length 
        : 0,
      tags: [...new Set(evidence.flatMap(e => e.tags))],
      week: 5,
      createdAt: new Date().toISOString()
    };
  }
}

// Export singleton
export const nflEvidenceService = new NFLEvidenceService();