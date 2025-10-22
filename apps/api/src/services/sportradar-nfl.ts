/**
 * Sportradar NFL API v7 Client
 * Handles weekly schedule and play-by-play data
 */

import { LRUCache } from 'lru-cache';

const SR_API_KEY = process.env.SPORTRADAR_NFL_API_KEY || '';
const SR_ACCESS = process.env.SPORTRADAR_ACCESS_LEVEL || 'trial';
const SR_BASE = `https://api.sportradar.com/nfl/official/${SR_ACCESS}/v7/en`;

// Cache schedule for 10 minutes (TTL per docs)
const scheduleCache = new LRUCache<string, any>({ 
  max: 50, 
  ttl: 1000 * 60 * 10 
});

// Cache PBP for 1 hour (stable after game)
const pbpCache = new LRUCache<string, any>({ 
  max: 100, 
  ttl: 1000 * 60 * 60 
});

export interface WeekGame {
  gameId: string;
  season: number;
  seasonType: 'REG' | 'POST' | 'PRE';
  week: number;
  home: string;
  away: string;
  startTime: string;
  status?: string;
  homeScore?: number;
  awayScore?: number;
}

export interface GameEvent {
  gameId: string;
  quarter: number;
  clock: string;
  type: 'PASS_TD' | 'RUSH_TD' | 'REC_TD' | 'INT' | 'FUM' | 'SACK' | 'BIG_PASS' | 'BIG_RUN';
  offense: string;
  defense: string;
  yardage?: number;
  passer?: string;
  rusher?: string;
  receiver?: string;
  tackler?: string;
  interceptor?: string;
  fumblingPlayer?: string;
  recoveringPlayer?: string;
  playText: string;
}

export class SportradarNFLClient {
  
  /**
   * Fetch weekly schedule
   */
  async getWeekSchedule(params: {
    year?: number;
    seasonType?: 'REG' | 'POST' | 'PRE';
    week?: number;
  } = {}): Promise<WeekGame[]> {
    const year = params.year || 2024;
    const seasonType = params.seasonType || 'REG';
    const week = params.week || 5;
    
    const cacheKey = `schedule_${year}_${seasonType}_${week}`;
    const cached = scheduleCache.get(cacheKey);
    if (cached) return cached;
    
    if (!SR_API_KEY) {
      console.warn('Sportradar API key not configured');
      return [];
    }
    
    try {
      const url = `${SR_BASE}/games/${year}/${seasonType}/${week}/schedule.json?api_key=${SR_API_KEY}`;
      console.log(`[Sportradar] Fetching schedule: Week ${week}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Sportradar schedule failed: ${response.status}`);
      }
      
      const data = await response.json();
      const games: WeekGame[] = (data.games || []).map((g: any) => ({
        gameId: g.id,
        season: year,
        seasonType,
        week,
        home: g.home?.alias || g.home?.market || '',
        away: g.away?.alias || g.away?.market || '',
        startTime: g.scheduled,
        status: g.status,
        homeScore: g.scoring?.home_points,
        awayScore: g.scoring?.away_points
      }));
      
      scheduleCache.set(cacheKey, games);
      console.log(`[Sportradar] Fetched ${games.length} games for Week ${week}`);
      return games;
      
    } catch (error) {
      console.error('[Sportradar] Schedule fetch error:', error);
      return [];
    }
  }
  
  /**
   * Fetch current week schedule
   */
  async getCurrentWeekSchedule(): Promise<WeekGame[]> {
    if (!SR_API_KEY) return [];
    
    try {
      const url = `${SR_BASE}/games/current_week/schedule.json?api_key=${SR_API_KEY}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Current week schedule failed: ${response.status}`);
      }
      
      const data = await response.json();
      const week = data.week?.sequence || 5;
      const year = data.week?.year || 2024;
      const seasonType = data.week?.type || 'REG';
      
      return (data.games || []).map((g: any) => ({
        gameId: g.id,
        season: year,
        seasonType,
        week,
        home: g.home?.alias || '',
        away: g.away?.alias || '',
        startTime: g.scheduled,
        status: g.status
      }));
      
    } catch (error) {
      console.error('[Sportradar] Current week fetch error:', error);
      return [];
    }
  }
  
  /**
   * Fetch play-by-play for a game
   */
  async getPlayByPlay(gameId: string): Promise<any> {
    const cacheKey = `pbp_${gameId}`;
    const cached = pbpCache.get(cacheKey);
    if (cached) return cached;
    
    if (!SR_API_KEY) {
      console.warn('Sportradar API key not configured');
      return null;
    }
    
    try {
      const url = `${SR_BASE}/games/${gameId}/pbp.json?api_key=${SR_API_KEY}`;
      console.log(`[Sportradar] Fetching PBP: ${gameId}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`PBP fetch failed: ${response.status}`);
      }
      
      const data = await response.json();
      pbpCache.set(cacheKey, data);
      return data;
      
    } catch (error) {
      console.error('[Sportradar] PBP fetch error:', error);
      return null;
    }
  }
  
  /**
   * Extract game events from play-by-play
   */
  async getGameEvents(gameId: string): Promise<GameEvent[]> {
    const pbp = await this.getPlayByPlay(gameId);
    if (!pbp) return [];
    
    const events: GameEvent[] = [];
    const homeTeam = pbp.summary?.home?.alias || '';
    const awayTeam = pbp.summary?.away?.alias || '';
    
    for (const period of pbp.periods || []) {
      const quarter = period.number || 1;
      
      for (const drive of period.pbp || []) {
        for (const play of drive.events || []) {
          const event = this.classifyPlay(play, gameId, quarter, homeTeam, awayTeam);
          if (event) {
            events.push(event);
          }
        }
      }
    }
    
    console.log(`[Sportradar] Extracted ${events.length} events from ${gameId}`);
    return events;
  }
  
  /**
   * Classify a play into a GameEvent
   */
  private classifyPlay(
    play: any, 
    gameId: string, 
    quarter: number,
    homeTeam: string,
    awayTeam: string
  ): GameEvent | null {
    const clock = play.clock || '00:00';
    const playText = play.description || '';
    const offense = play.team?.alias || '';
    const defense = offense === homeTeam ? awayTeam : homeTeam;
    
    // Check for scoring plays
    if (play.scoring) {
      const scorer = play.players?.find((p: any) => p.statistics?.scoring);
      
      // Passing TD
      if (play.play_type === 'pass' && play.scoring) {
        return {
          gameId, quarter, clock, playText,
          type: 'PASS_TD',
          offense, defense,
          yardage: play.statistics?.yards,
          passer: play.players?.find((p: any) => p.position === 'QB')?.name,
          receiver: scorer?.name
        };
      }
      
      // Rushing TD
      if (play.play_type === 'rush' && play.scoring) {
        return {
          gameId, quarter, clock, playText,
          type: 'RUSH_TD',
          offense, defense,
          yardage: play.statistics?.yards,
          rusher: scorer?.name
        };
      }
    }
    
    // Interception
    if (play.play_type === 'pass' && playText.toLowerCase().includes('intercept')) {
      return {
        gameId, quarter, clock, playText,
        type: 'INT',
        offense, defense,
        passer: play.players?.find((p: any) => p.position === 'QB')?.name,
        interceptor: play.players?.find((p: any) => p.statistics?.interceptions)?.name
      };
    }
    
    // Fumble
    if (playText.toLowerCase().includes('fumble')) {
      return {
        gameId, quarter, clock, playText,
        type: 'FUM',
        offense, defense,
        fumblingPlayer: play.players?.find((p: any) => p.statistics?.fumbles)?.name,
        recoveringPlayer: play.players?.find((p: any) => p.statistics?.fumbles_recovered)?.name
      };
    }
    
    // Sack
    if (play.play_type === 'pass' && playText.toLowerCase().includes('sack')) {
      return {
        gameId, quarter, clock, playText,
        type: 'SACK',
        offense, defense,
        passer: play.players?.find((p: any) => p.position === 'QB')?.name,
        tackler: play.players?.find((p: any) => p.statistics?.sacks)?.name
      };
    }
    
    // Big pass (15+ yards)
    if (play.play_type === 'pass' && (play.statistics?.yards || 0) >= 15) {
      return {
        gameId, quarter, clock, playText,
        type: 'BIG_PASS',
        offense, defense,
        yardage: play.statistics.yards,
        passer: play.players?.find((p: any) => p.position === 'QB')?.name,
        receiver: play.players?.find((p: any) => p.statistics?.receptions)?.name
      };
    }
    
    // Big run (10+ yards)
    if (play.play_type === 'rush' && (play.statistics?.yards || 0) >= 10) {
      return {
        gameId, quarter, clock, playText,
        type: 'BIG_RUN',
        offense, defense,
        yardage: play.statistics.yards,
        rusher: play.players?.find((p: any) => p.statistics?.attempts)?.name
      };
    }
    
    return null;
  }
}

export const sportradarNFLClient = new SportradarNFLClient();
