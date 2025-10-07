// Base Data Provider Interface
import type { 
  LiveDataProvider, 
  GameQuery, 
  GameLite, 
  PropOffer, 
  OddsSnapshot, 
  LiveEvent 
} from '../types';

/**
 * Abstract base class for all live data providers
 * Implements common functionality like caching, rate limiting, and error handling
 */
export abstract class BaseLiveDataProvider implements LiveDataProvider {
  protected cache: Map<string, { data: any; expiry: number }> = new Map();
  protected rateLimiter: Map<string, number> = new Map();
  
  constructor(
    protected config: {
      cacheTimeoutMs?: number;
      rateLimitPerMinute?: number;
      maxRetries?: number;
      updateIntervalMs?: number;
    } = {}
  ) {
    this.config = {
      cacheTimeoutMs: 30000, // 30 seconds
      rateLimitPerMinute: 60,
      maxRetries: 3,
      updateIntervalMs: 30000, // 30 seconds
      ...config
    };
  }

  abstract getGames(params: GameQuery): Promise<GameLite[]>;
  abstract getPropOffers(gameId: string): Promise<PropOffer[]>;
  abstract getOddsSnapshots(gameId: string): Promise<OddsSnapshot[]>;
  abstract subscribeGame(gameId: string, callback: (event: LiveEvent) => void): () => void;

  /**
   * Cache wrapper with TTL
   */
  protected async withCache<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    ttlMs?: number
  ): Promise<T> {
    const cached = this.cache.get(key);
    const now = Date.now();
    
    if (cached && cached.expiry > now) {
      return cached.data;
    }
    
    const data = await fetcher();
    this.cache.set(key, {
      data,
      expiry: now + (ttlMs || this.config.cacheTimeoutMs!)
    });
    
    return data;
  }

  /**
   * Rate limiter check
   */
  protected async checkRateLimit(endpoint: string): Promise<void> {
    const key = `${endpoint}:${Math.floor(Date.now() / 60000)}`; // per minute
    const count = this.rateLimiter.get(key) || 0;
    
    if (count >= this.config.rateLimitPerMinute!) {
      throw new Error(`Rate limit exceeded for ${endpoint}`);
    }
    
    this.rateLimiter.set(key, count + 1);
  }

  /**
   * Retry wrapper with exponential backoff
   */
  protected async withRetry<T>(
    operation: () => Promise<T>, 
    maxRetries = this.config.maxRetries!
  ): Promise<T> {
    let lastError: Error;
    
    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (i === maxRetries) break;
        
        // Exponential backoff: 1s, 2s, 4s, etc.
        const delay = Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }

  /**
   * Clean up expired cache entries
   */
  protected cleanupCache(): void {
    const now = Date.now();
    for (const [key, { expiry }] of this.cache.entries()) {
      if (expiry <= now) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * Mock Data Provider - Your current implementation
 * Used for development and testing
 */
export class MockDataProvider extends BaseLiveDataProvider {
  private mockGames: GameLite[] = [
    {
      id: "uga-alabama-20251006",
      start: new Date().toISOString(),
      state: "pre" as const,
      home: { id: "333", name: "Alabama Crimson Tide", short: "Alabama", abbrev: "BAMA" },
      away: { id: "61", name: "Georgia Bulldogs", short: "Georgia", abbrev: "UGA" },
    },
    {
      id: "gt-wake-forest-20251006", 
      start: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
      state: "pre" as const,
      home: { id: "154", name: "Wake Forest Demon Deacons", short: "Wake Forest", abbrev: "WAKE" },
      away: { id: "59", name: "Georgia Tech Yellow Jackets", short: "Georgia Tech", abbrev: "GT" },
    },
    {
      id: "illinois-usc-20251006",
      start: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
      state: "pre" as const,
      home: { id: "30", name: "USC Trojans", short: "USC", abbrev: "USC" },
      away: { id: "356", name: "Illinois Fighting Illini", short: "Illinois", abbrev: "ILL" },
    }
  ];

  async getGames(params: GameQuery): Promise<GameLite[]> {
    await this.checkRateLimit('games');
    
    return this.withCache('mock-games', async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      let filtered = [...this.mockGames];
      
      if (params.status && params.status !== 'all') {
        filtered = filtered.filter(g => g.state === params.status);
      }
      
      if (params.limit) {
        filtered = filtered.slice(0, params.limit);
      }
      
      return filtered;
    }, 60000); // Cache for 1 minute
  }

  async getPropOffers(gameId: string): Promise<PropOffer[]> {
    await this.checkRateLimit('props');
    
    return this.withCache(`props-${gameId}`, async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Mock prop offers for the game
      return [
        {
          id: `prop-${gameId}-passing-yards-1`,
          gameId,
          playerId: "player-1",
          playerName: "Quarterback A",
          team: "UGA",
          position: "QB",
          market: 'passing_yards' as const,
          book: 'draftkings' as const,
          line: 285.5,
          overPrice: -110,
          underPrice: -110,
          impliedProb: 0.524,
          fairLine: 290.2,
          edge: 0.015,
          confidence: 0.73,
          lastUpdated: new Date().toISOString(),
          isLive: true
        },
        {
          id: `prop-${gameId}-rushing-yards-1`,
          gameId,
          playerId: "player-2", 
          playerName: "Running Back B",
          team: "BAMA",
          position: "RB",
          market: 'rushing_yards' as const,
          book: 'fanduel' as const,
          line: 125.5,
          overPrice: -105,
          underPrice: -115,
          impliedProb: 0.512,
          fairLine: 118.3,
          edge: -0.028,
          confidence: 0.81,
          lastUpdated: new Date().toISOString(),
          isLive: true
        }
      ];
    }, 15000); // Cache for 15 seconds
  }

  async getOddsSnapshots(gameId: string): Promise<OddsSnapshot[]> {
    await this.checkRateLimit('odds-history');
    
    return this.withCache(`odds-${gameId}`, async () => {
      const now = new Date();
      const snapshots: OddsSnapshot[] = [];
      
      // Generate mock historical snapshots (last 30 minutes)
      for (let i = 30; i >= 0; i -= 5) {
        const timestamp = new Date(now.getTime() - i * 60 * 1000);
        
        snapshots.push({
          id: `snapshot-${gameId}-${i}`,
          propOfferId: `prop-${gameId}-passing-yards-1`,
          line: 285.5 + (Math.random() - 0.5) * 2, // Small random movement
          overPrice: -110 + Math.floor((Math.random() - 0.5) * 10),
          underPrice: -110 + Math.floor((Math.random() - 0.5) * 10),
          timestamp: timestamp.toISOString(),
          volume: Math.floor(Math.random() * 1000)
        });
      }
      
      return snapshots;
    }, 30000); // Cache for 30 seconds
  }

  subscribeGame(gameId: string, callback: (event: LiveEvent) => void): () => void {
    // Mock real-time updates
    const interval = setInterval(() => {
      // Simulate occasional prop updates
      if (Math.random() < 0.1) { // 10% chance every interval
        callback({
          type: 'odds_update',
          gameId,
          data: {
            propId: `prop-${gameId}-passing-yards-1`,
            newLine: 285.5 + (Math.random() - 0.5) * 4,
            newOverPrice: -110 + Math.floor((Math.random() - 0.5) * 20)
          },
          timestamp: new Date().toISOString()
        });
      }
    }, 5000); // Every 5 seconds
    
    // Return unsubscribe function
    return () => clearInterval(interval);
  }
}

/**
 * The Odds API Provider - Real implementation
 * Connects to The Odds API for live sports betting data
 */
export class TheOddsAPIProvider extends BaseLiveDataProvider {
  private apiKey: string;
  private baseUrl = 'https://api.the-odds-api.com/v4';
  
  constructor(apiKey: string, config = {}) {
    super({
      cacheTimeoutMs: 15000, // 15 seconds for live data
      rateLimitPerMinute: 100, // The Odds API limit
      ...config
    });
    this.apiKey = apiKey;
  }

  async getGames(params: GameQuery): Promise<GameLite[]> {
    await this.checkRateLimit('odds-api-games');
    
    return this.withRetry(async () => {
      const leagues = params.leagues?.join(',') || 'americanfootball_ncaaf';
      const response = await fetch(
        `${this.baseUrl}/sports/${leagues}/odds?` +
        `apiKey=${this.apiKey}&regions=us&markets=h2h&oddsFormat=american`,
        { headers: { 'Accept': 'application/json' } }
      );
      
      if (!response.ok) {
        throw new Error(`The Odds API error: ${response.status}`);
      }
      
      const data = await response.json();
      return this.normalizeGames(data);
    });
  }

  async getPropOffers(gameId: string): Promise<PropOffer[]> {
    await this.checkRateLimit('odds-api-props');
    
    return this.withRetry(async () => {
      // Note: The Odds API has limited prop support
      // You might need to use multiple providers or upgrade to their premium plan
      const response = await fetch(
        `${this.baseUrl}/sports/americanfootball_ncaaf/odds?` +
        `apiKey=${this.apiKey}&regions=us&markets=player_props&eventIds=${gameId}`,
        { headers: { 'Accept': 'application/json' } }
      );
      
      if (!response.ok) {
        throw new Error(`The Odds API props error: ${response.status}`);
      }
      
      const data = await response.json();
      return this.normalizeProps(data, gameId);
    });
  }

  async getOddsSnapshots(gameId: string): Promise<OddsSnapshot[]> {
    // The Odds API doesn't provide historical snapshots
    // You'd need to store these yourself or use a different provider
    return [];
  }

  subscribeGame(gameId: string, callback: (event: LiveEvent) => void): () => void {
    // The Odds API doesn't support WebSockets
    // Implement polling-based "subscription"
    const pollInterval = setInterval(async () => {
      try {
        const props = await this.getPropOffers(gameId);
        callback({
          type: 'odds_update',
          gameId,
          data: { props },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error polling props:', error);
      }
    }, this.config.updateIntervalMs || 30000);
    
    return () => clearInterval(pollInterval);
  }

  private normalizeGames(apiData: any[]): GameLite[] {
    return apiData.map(game => ({
      id: game.id,
      start: game.commence_time,
      state: this.mapGameState(game),
      home: this.normalizeTeam(game.home_team),
      away: this.normalizeTeam(game.away_team),
      homeScore: game.scores?.find((s: any) => s.name === game.home_team)?.score,
      awayScore: game.scores?.find((s: any) => s.name === game.away_team)?.score,
    }));
  }

  private normalizeProps(apiData: any[], gameId: string): PropOffer[] {
    const props: PropOffer[] = [];
    
    // Transform The Odds API prop format to your PropOffer format
    // This will depend on their exact API structure
    
    return props;
  }

  private normalizeTeam(teamName: string) {
    // You'd maintain a mapping of API team names to your team format
    return {
      id: teamName.toLowerCase().replace(/\s+/g, '-'),
      name: teamName,
      short: teamName,
      abbrev: teamName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 4)
    };
  }

  private mapGameState(game: any): 'pre' | 'in' | 'post' {
    // Map The Odds API game state to your format
    if (game.completed) return 'post';
    if (new Date(game.commence_time) > new Date()) return 'pre';
    return 'in';
  }
}

/**
 * Data Provider Factory
 * Chooses the appropriate provider based on configuration
 */
export class DataProviderFactory {
  static create(config: {
    provider: 'mock' | 'the-odds-api';
    apiKey?: string;
    options?: any;
  }): LiveDataProvider {
    switch (config.provider) {
      case 'mock':
        return new MockDataProvider(config.options);
      
      case 'the-odds-api':
        if (!config.apiKey) {
          throw new Error('API key required for The Odds API provider');
        }
        return new TheOddsAPIProvider(config.apiKey, config.options);
      
      default:
        throw new Error(`Unknown provider: ${config.provider}`);
    }
  }
}