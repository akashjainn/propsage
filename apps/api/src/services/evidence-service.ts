import { LRUCache } from "lru-cache";
import { twelveLabsClient, isVideoIntelligenceAvailable } from "./twelve-labs-client";
import { 
  MomentPack, 
  PropType, 
  TLMoment,
  PropEvidence,
  EvidenceFeature,
  PROP_INTENT_LIBRARY,
  buildMomentQuery
} from "../types/twelve-labs";

// Cache for moment packs (1 hour - updated after games)
const momentPackCache = new LRUCache<string, MomentPack>({ 
  max: 500, 
  ttl: 1000 * 60 * 60 
});

// Cache for evidence summaries (30 minutes)
const evidenceCache = new LRUCache<string, PropEvidence>({ 
  max: 200, 
  ttl: 1000 * 60 * 30 
});

// Mock video database - in production this would be your actual database
interface MockVideo {
  id: string;
  gameId: string;
  s3Url: string;
  tlVideoId?: string;
  title: string;
  status: 'indexing' | 'ready' | 'failed';
  teams: string[];
  players: string[];
  createdAt: Date;
}

// Mock data for demo - replace with real database calls
const MOCK_VIDEOS: MockVideo[] = [
  {
    id: 'vid_georgia_alabama_2024',
    gameId: 'game_georgia_alabama_2024_09_27',
    s3Url: 'https://propsage-clips.s3.amazonaws.com/cfb/georgia-alabama-highlights.mp4',
    tlVideoId: 'tl_video_12345',
    title: 'Georgia vs Alabama - Key Plays',
    status: 'ready',
    teams: ['Georgia', 'Alabama'],
    players: ['Carson Beck', 'Ryan Puglisi', 'Jalen Milroe'],
    createdAt: new Date('2024-09-27')
  },
  {
    id: 'vid_georgia_recap_week4',
    gameId: 'game_georgia_recap_2024_week4',
    s3Url: 'https://propsage-clips.s3.amazonaws.com/cfb/georgia-week4-recap.mp4',
    tlVideoId: 'tl_video_67890',
    title: 'Georgia Week 4 Recap',
    status: 'ready', 
    teams: ['Georgia'],
    players: ['Carson Beck', 'Ryan Puglisi', 'Brock Bowers'],
    createdAt: new Date('2024-09-25')
  }
];

export class EvidenceService {
  
  /**
   * Build moment pack for a specific player and prop type
   * This would typically run after games to precompute evidence
   */
  async buildMomentPack(
    playerId: string, 
    playerName: string,
    propType: PropType, 
    gameId?: string
  ): Promise<MomentPack | null> {
    
    if (!isVideoIntelligenceAvailable()) {
      console.warn('TwelveLabs not available - returning empty moment pack');
      return null;
    }

    const cacheKey = `momentpack_${playerId}_${propType}_${gameId || 'all'}`;
    const cached = momentPackCache.get(cacheKey);
    if (cached) return cached;

    try {
      // Get relevant videos for this player/game
      const videos = this.getRelevantVideos(playerName, gameId);
      if (videos.length === 0) {
        console.log(`No videos found for ${playerName} in game ${gameId}`);
        return null;
      }

      // Get prop intent queries
      const intent = PROP_INTENT_LIBRARY[propType];
      if (!intent) {
        console.warn(`No intent library found for prop type: ${propType}`);
        return null;
      }

      // Build search queries for this player
      const queries = buildMomentQuery(intent, playerName);
      const videoIds = videos.map(v => v.tlVideoId).filter(Boolean) as string[];

      // Search TwelveLabs for moments
      const moments = await twelveLabsClient.searchMoments(queries, videoIds, 8);

      // Create moment pack
      const momentPack: MomentPack = {
        id: `pack_${playerId}_${propType}_${Date.now()}`,
        playerId,
        propType,
        gameId,
        moments,
        metadata: {
          totalMoments: moments.length,
          avgConfidence: this.calculateAverageConfidence(moments),
          lastUpdated: new Date(),
          queries
        }
      };

      // Cache the result
      momentPackCache.set(cacheKey, momentPack);
      
      console.log(`Built moment pack for ${playerName} ${propType}: ${moments.length} moments`);
      return momentPack;

    } catch (error) {
      console.error('Error building moment pack:', error);
      return null;
    }
  }

  /**
   * Get precomputed moment pack for a player/prop combination
   */
  async getMomentPack(playerId: string, propType: PropType, gameId?: string): Promise<MomentPack | null> {
    const cacheKey = `momentpack_${playerId}_${propType}_${gameId || 'all'}`;
    return momentPackCache.get(cacheKey) || null;
  }

  /**
   * Build evidence summary for a specific prop
   */
  async buildPropEvidence(propId: string, playerId: string, playerName: string, propType: PropType): Promise<PropEvidence | null> {
    const cacheKey = `evidence_${propId}`;
    const cached = evidenceCache.get(cacheKey);
    if (cached) return cached;

    try {
      // Get moment packs for this player/prop
      const recentPack = await this.buildMomentPack(playerId, playerName, propType);
      const momentPacks = recentPack ? [recentPack] : [];

      // Calculate evidence features
      const features = this.calculateEvidenceFeatures(momentPacks, propType);

      // Build summary
      const summary = this.buildEvidenceSummary(momentPacks, features, propType);

      const evidence: PropEvidence = {
        propId,
        momentPacks,
        features,
        summary
      };

      evidenceCache.set(cacheKey, evidence);
      return evidence;

    } catch (error) {
      console.error('Error building prop evidence:', error);
      return null;
    }
  }

  /**
   * Search for moments using free-form query (Ask the Tape feature)
   */
  async searchFreefromMoments(
    query: string, 
    playerName?: string, 
    gameId?: string,
    limit: number = 6
  ): Promise<TLMoment[]> {
    
    if (!isVideoIntelligenceAvailable()) {
      return [];
    }

    try {
      // Get relevant videos
      const videos = this.getRelevantVideos(playerName, gameId);
      const videoIds = videos.map(v => v.tlVideoId).filter(Boolean) as string[];

      // Expand query with synonyms for better results
      const expandedQuery = this.expandQuery(query);
      const queries = playerName 
        ? [expandedQuery.replace('{player}', playerName)]
        : [expandedQuery];

      return await twelveLabsClient.searchMoments(queries, videoIds, limit);

    } catch (error) {
      console.error('Free-form search error:', error);
      return [];
    }
  }

  /**
   * Index a new video clip
   */
  async indexVideoClip(
    gameId: string,
    s3Url: string, 
    title: string,
    teams: string[],
    players: string[]
  ): Promise<string | null> {
    
    if (!isVideoIntelligenceAvailable()) {
      console.warn('TwelveLabs not available for indexing');
      return null;
    }

    try {
      const result = await twelveLabsClient.indexClip({
        gameId,
        s3Url,
        title,
        metadata: {
          team1: teams[0],
          team2: teams[1],
          date: new Date().toISOString().split('T')[0]
        }
      });

      if (!result) return null;

      // In production, save to database
      console.log(`Indexed video: ${title} -> ${result.taskId}`);
      
      return result.videoId;

    } catch (error) {
      console.error('Video indexing error:', error);
      return null;
    }
  }

  /**
   * Batch build moment packs for multiple players (for nightly processing)
   */
  async batchBuildMomentPacks(players: Array<{
    id: string;
    name: string;
    propTypes: PropType[];
    gameId?: string;
  }>): Promise<Map<string, MomentPack[]>> {
    
    const results = new Map<string, MomentPack[]>();

    for (const player of players) {
      const playerPacks: MomentPack[] = [];

      for (const propType of player.propTypes) {
        const pack = await this.buildMomentPack(
          player.id,
          player.name, 
          propType, 
          player.gameId
        );
        
        if (pack) {
          playerPacks.push(pack);
        }
      }

      if (playerPacks.length > 0) {
        results.set(player.id, playerPacks);
      }
    }

    console.log(`Batch built moment packs for ${results.size} players`);
    return results;
  }

  // Private helper methods

  private getRelevantVideos(playerName?: string, gameId?: string): MockVideo[] {
    return MOCK_VIDEOS.filter(video => {
      if (gameId && video.gameId !== gameId) return false;
      if (playerName && !video.players.some(p => 
        p.toLowerCase().includes(playerName.toLowerCase()) ||
        playerName.toLowerCase().includes(p.toLowerCase())
      )) return false;
      return video.status === 'ready';
    });
  }

  private calculateAverageConfidence(moments: TLMoment[]): number {
    if (moments.length === 0) return 0;
    
    const confidenceScores = moments.map(m => {
      switch (m.confidence) {
        case 'high': return 1;
        case 'medium': return 0.6;
        case 'low': return 0.3;
        default: return 0.5;
      }
    });
    
    return confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length;
  }

  private calculateEvidenceFeatures(momentPacks: MomentPack[], propType: PropType): EvidenceFeature[] {
    if (momentPacks.length === 0) return [];

    const allMoments = momentPacks.flatMap(pack => pack.moments);
    const features: EvidenceFeature[] = [];

    // Feature 1: Explosive Play Rate
    const explosiveMoments = allMoments.filter(m => 
      m.label.toLowerCase().includes('explosive') || 
      m.label.toLowerCase().includes('deep') ||
      m.label.toLowerCase().includes('long')
    );
    
    if (explosiveMoments.length > 0) {
      features.push({
        name: 'Explosive Play Rate',
        value: explosiveMoments.length,
        unit: 'moments',
        description: `${explosiveMoments.length} explosive plays in recent footage`,
        confidence: explosiveMoments.length >= 3 ? 'high' : explosiveMoments.length >= 2 ? 'medium' : 'low'
      });
    }

    // Feature 2: Red Zone Efficiency (for TD props)
    if (propType.includes('TDS')) {
      const redZoneMoments = allMoments.filter(m =>
        m.label.toLowerCase().includes('red zone') ||
        m.label.toLowerCase().includes('goal line') ||
        m.label.toLowerCase().includes('touchdown')
      );
      
      features.push({
        name: 'Red Zone Moments',
        value: redZoneMoments.length,
        unit: 'clips',
        description: `Red zone efficiency based on ${redZoneMoments.length} recent moments`,
        confidence: redZoneMoments.length >= 2 ? 'high' : 'medium'
      });
    }

    // Feature 3: Pressure Situations (for passing props)
    if (propType.includes('PASS') || propType === 'SACKS' || propType === 'INTERCEPTIONS') {
      const pressureMoments = allMoments.filter(m =>
        m.label.toLowerCase().includes('pressure') ||
        m.label.toLowerCase().includes('hurried') ||
        m.label.toLowerCase().includes('sack')
      );
      
      if (pressureMoments.length > 0) {
        features.push({
          name: 'Under Pressure',
          value: pressureMoments.length,
          unit: 'situations',
          description: `Performance under pressure - ${pressureMoments.length} instances`,
          confidence: pressureMoments.length >= 3 ? 'high' : 'medium'
        });
      }
    }

    return features;
  }

  private buildEvidenceSummary(
    momentPacks: MomentPack[], 
    features: EvidenceFeature[], 
    propType: PropType
  ) {
    const allMoments = momentPacks.flatMap(pack => pack.moments);
    const totalMoments = allMoments.length;
    const avgConfidence = this.calculateAverageConfidence(allMoments);

    // Build risk and support factors based on prop type and features
    const riskFactors: string[] = [];
    const supportFactors: string[] = [];

    const intent = PROP_INTENT_LIBRARY[propType];
    
    // Analyze moments for risk/support factors
    if (propType.includes('PASS')) {
      const pressureMoments = allMoments.filter(m => m.label.includes('pressure'));
      if (pressureMoments.length >= 2) {
        riskFactors.push('Frequently under pressure');
      }
      
      const deepMoments = allMoments.filter(m => m.label.includes('deep'));
      if (deepMoments.length >= 2) {
        supportFactors.push('Strong deep ball accuracy');
      }
    }

    if (propType.includes('RUSH')) {
      const breakawayMoments = allMoments.filter(m => 
        m.label.includes('broken tackle') || m.label.includes('explosive')
      );
      if (breakawayMoments.length >= 2) {
        supportFactors.push('Breaks tackles consistently');
      }
    }

    return {
      totalMoments,
      avgConfidence,
      riskFactors,
      supportFactors
    };
  }

  private expandQuery(query: string): string {
    // Simple query expansion with synonyms
    const synonyms: Record<string, string[]> = {
      'scramble': ['scramble', 'QB run', 'designed run', 'keeper'],
      'pressure': ['pressure', 'hurried', 'rushed', 'hit'],
      'deep': ['deep', 'downfield', 'long', 'bomb'],
      'touchdown': ['touchdown', 'TD', 'score', 'six points'],
      'interception': ['interception', 'INT', 'picked off', 'turnover'],
      'sack': ['sack', 'taken down', 'brought down behind line']
    };

    let expandedQuery = query;
    
    for (const [key, alternatives] of Object.entries(synonyms)) {
      if (query.toLowerCase().includes(key)) {
        // Add alternatives with OR operator
        const alternativeClause = alternatives.slice(1).map(alt => `OR ${alt}`).join(' ');
        expandedQuery = expandedQuery.replace(
          new RegExp(key, 'gi'), 
          `(${key} ${alternativeClause})`
        );
        break; // Only expand one term to keep query manageable
      }
    }

    return expandedQuery;
  }
}

// Export singleton instance
export const evidenceService = new EvidenceService();

// Export utility functions
export function getMockVideoForDemo(): MockVideo[] {
  return MOCK_VIDEOS;
}

export function isEvidenceAvailable(): boolean {
  return isVideoIntelligenceAvailable();
}