/**
 * Maps GameEvents to TwelveLabs search queries
 * Implements event-to-market rules for clip evidence
 */

import { TwelveLabsClient } from './twelve-labs-client.js';
import { GameEvent } from './sportradar-nfl.js';
import { TLMoment } from '../types/twelve-labs.js';
import { config } from '../config.js';

export type PropMarket = 
  | 'PASS_YDS' 
  | 'PASS_TDS' 
  | 'RUSH_YDS' 
  | 'RUSH_TDS' 
  | 'REC_YDS' 
  | 'REC_TDS'
  | 'RECEPTIONS'
  | 'ANYTIME_TD'
  | 'INTS'
  | 'SACKS';

interface ClipRequest {
  gameId: string;
  player: string;
  market: PropMarket;
  limit?: number;
}

export class EventClipMapper {
  private tlClient: TwelveLabsClient;
  
  constructor() {
    // Use NFL-specific index from config
    this.tlClient = new TwelveLabsClient({
      indexId: config.twelveLabsIndexByLeague.nfl || config.twelveLabsIndexByLeague.cfb
    });
    console.log('[EventClipMapper] Initialized with NFL index:', config.twelveLabsIndexByLeague.nfl);
  }
  
  /**
   * Get clips for a player/market combination
   */
  async getClipsForProp(request: ClipRequest): Promise<TLMoment[]> {
    const { gameId, player, market, limit = 4 } = request;
    
    // Build TL search query based on market
    const query = this.buildQuery(player, market);
    
    console.log(`[EventClipMapper] Searching TL: player=${player}, market=${market}, gameId=${gameId}`);
    console.log(`[EventClipMapper] Query: "${query}"`);
    
    // Search with gameId filter
    const moments = await this.tlClient.searchMoments(
      [query],
      undefined, // no videoId filter - use entire index
      limit
    );
    
    // Filter by gameId in post-processing (if TL doesn't support it directly)
    // In production, pass gameId as metadata filter if TL API supports it
    const filtered = moments.filter(m => {
      // Check if video metadata contains this gameId
      // For now, return all - you'll need to check video metadata
      return true;
    });
    
    console.log(`[EventClipMapper] Found ${filtered.length} clips`);
    return filtered.slice(0, limit);
  }
  
  /**
   * Get clips from specific events
   */
  async getClipsFromEvents(
    events: GameEvent[],
    player: string,
    market: PropMarket,
    limit: number = 4
  ): Promise<TLMoment[]> {
    // Filter events relevant to this player/market
    const relevantEvents = this.filterEventsForMarket(events, player, market);
    
    if (relevantEvents.length === 0) {
      console.log(`[EventClipMapper] No relevant events for ${player} ${market}`);
      return [];
    }
    
    // Build queries from events
    const queries = relevantEvents
      .slice(0, 3) // Limit to avoid rate limits
      .map(event => this.eventToQuery(event, player));
    
    console.log(`[EventClipMapper] Searching ${queries.length} events for ${player}`);
    
    // Search each event
    const allMoments: TLMoment[] = [];
    for (const query of queries) {
      const moments = await this.tlClient.searchMoments([query], undefined, 2);
      allMoments.push(...moments);
    }
    
    // Deduplicate and return top clips
    const unique = this.deduplicateMoments(allMoments);
    return unique.slice(0, limit);
  }
  
  /**
   * Build TL query from player and market
   */
  private buildQuery(player: string, market: PropMarket): string {
    const queries: Record<PropMarket, string> = {
      PASS_YDS: `${player} throwing completion`,
      PASS_TDS: `${player} touchdown pass`,
      RUSH_YDS: `${player} rushing`,
      RUSH_TDS: `${player} rushing touchdown`,
      REC_YDS: `${player} catching reception`,
      REC_TDS: `${player} receiving touchdown`,
      RECEPTIONS: `${player} catching pass`,
      ANYTIME_TD: `${player} touchdown`,
      INTS: `${player} interception`,
      SACKS: `${player} sacked`
    };
    
    return queries[market] || `${player}`;
  }
  
  /**
   * Convert GameEvent to TL search query
   */
  private eventToQuery(event: GameEvent, player: string): string {
    const parts: string[] = [player];
    
    switch (event.type) {
      case 'PASS_TD':
        parts.push('touchdown pass');
        if (event.receiver) parts.push(event.receiver);
        break;
      case 'RUSH_TD':
        parts.push('rushing touchdown');
        break;
      case 'REC_TD':
        parts.push('receiving touchdown');
        break;
      case 'INT':
        parts.push('interception');
        break;
      case 'FUM':
        parts.push('fumble');
        break;
      case 'SACK':
        parts.push('sacked');
        break;
      case 'BIG_PASS':
        parts.push('long pass', `${event.yardage} yards`);
        break;
      case 'BIG_RUN':
        parts.push('big run', `${event.yardage} yards`);
        break;
    }
    
    return parts.join(' ');
  }
  
  /**
   * Filter events by player and market
   */
  private filterEventsForMarket(
    events: GameEvent[],
    player: string,
    market: PropMarket
  ): GameEvent[] {
    const playerLower = player.toLowerCase();
    
    return events.filter(event => {
      // Check if player is involved
      const involvedPlayer = [
        event.passer,
        event.rusher,
        event.receiver,
        event.tackler,
        event.interceptor,
        event.fumblingPlayer,
        event.recoveringPlayer
      ]
        .filter(Boolean)
        .map(p => p?.toLowerCase())
        .some(p => p?.includes(playerLower) || playerLower.includes(p || ''));
      
      if (!involvedPlayer) return false;
      
      // Match event type to market
      switch (market) {
        case 'PASS_YDS':
        case 'PASS_TDS':
          return ['PASS_TD', 'BIG_PASS'].includes(event.type) && 
                 event.passer?.toLowerCase().includes(playerLower);
        
        case 'RUSH_YDS':
        case 'RUSH_TDS':
          return ['RUSH_TD', 'BIG_RUN'].includes(event.type) && 
                 event.rusher?.toLowerCase().includes(playerLower);
        
        case 'REC_YDS':
        case 'REC_TDS':
        case 'RECEPTIONS':
          return ['REC_TD', 'BIG_PASS'].includes(event.type) && 
                 event.receiver?.toLowerCase().includes(playerLower);
        
        case 'ANYTIME_TD':
          return ['PASS_TD', 'RUSH_TD', 'REC_TD'].includes(event.type);
        
        case 'INTS':
          return event.type === 'INT';
        
        case 'SACKS':
          return event.type === 'SACK';
        
        default:
          return false;
      }
    });
  }
  
  /**
   * Deduplicate moments by video + timestamp
   */
  private deduplicateMoments(moments: TLMoment[]): TLMoment[] {
    const seen = new Set<string>();
    return moments.filter(m => {
      const key = `${m.videoId}_${Math.floor(m.startTime / 5)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}

export const eventClipMapper = new EventClipMapper();
