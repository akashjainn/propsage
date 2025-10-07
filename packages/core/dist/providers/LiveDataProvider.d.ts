import type { LiveDataProvider, GameQuery, GameLite, PropOffer, OddsSnapshot, LiveEvent } from '../types';
/**
 * Abstract base class for all live data providers
 * Implements common functionality like caching, rate limiting, and error handling
 */
export declare abstract class BaseLiveDataProvider implements LiveDataProvider {
    protected config: {
        cacheTimeoutMs?: number;
        rateLimitPerMinute?: number;
        maxRetries?: number;
        updateIntervalMs?: number;
    };
    protected cache: Map<string, {
        data: any;
        expiry: number;
    }>;
    protected rateLimiter: Map<string, number>;
    constructor(config?: {
        cacheTimeoutMs?: number;
        rateLimitPerMinute?: number;
        maxRetries?: number;
        updateIntervalMs?: number;
    });
    abstract getGames(params: GameQuery): Promise<GameLite[]>;
    abstract getPropOffers(gameId: string): Promise<PropOffer[]>;
    abstract getOddsSnapshots(gameId: string): Promise<OddsSnapshot[]>;
    abstract subscribeGame(gameId: string, callback: (event: LiveEvent) => void): () => void;
    /**
     * Cache wrapper with TTL
     */
    protected withCache<T>(key: string, fetcher: () => Promise<T>, ttlMs?: number): Promise<T>;
    /**
     * Rate limiter check
     */
    protected checkRateLimit(endpoint: string): Promise<void>;
    /**
     * Retry wrapper with exponential backoff
     */
    protected withRetry<T>(operation: () => Promise<T>, maxRetries?: number): Promise<T>;
    /**
     * Clean up expired cache entries
     */
    protected cleanupCache(): void;
}
/**
 * Mock Data Provider - Your current implementation
 * Used for development and testing
 */
export declare class MockDataProvider extends BaseLiveDataProvider {
    private mockGames;
    getGames(params: GameQuery): Promise<GameLite[]>;
    getPropOffers(gameId: string): Promise<PropOffer[]>;
    getOddsSnapshots(gameId: string): Promise<OddsSnapshot[]>;
    subscribeGame(gameId: string, callback: (event: LiveEvent) => void): () => void;
}
/**
 * The Odds API Provider - Real implementation
 * Connects to The Odds API for live sports betting data
 */
export declare class TheOddsAPIProvider extends BaseLiveDataProvider {
    private apiKey;
    private baseUrl;
    constructor(apiKey: string, config?: {});
    getGames(params: GameQuery): Promise<GameLite[]>;
    getPropOffers(gameId: string): Promise<PropOffer[]>;
    getOddsSnapshots(gameId: string): Promise<OddsSnapshot[]>;
    subscribeGame(gameId: string, callback: (event: LiveEvent) => void): () => void;
    private normalizeGames;
    private normalizeProps;
    private normalizeTeam;
    private mapGameState;
}
/**
 * Data Provider Factory
 * Chooses the appropriate provider based on configuration
 */
export declare class DataProviderFactory {
    static create(config: {
        provider: 'mock' | 'the-odds-api';
        apiKey?: string;
        options?: any;
    }): LiveDataProvider;
}
