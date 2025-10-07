/**
 * React Hook for Real-time Data Integration
 * Provides a seamless interface between your UI and the live data providers
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { FEATURES, isFeatureEnabled } from '@/lib/features';
import type { 
  LiveDataProvider, 
  PropOffer, 
  GameLite, 
  LiveEvent 
} from '@propsage/core';

// Import providers when real-time is enabled
let MockDataProvider: any = null;
let DataProviderFactory: any = null;

if (typeof window !== 'undefined' && isFeatureEnabled('realtime')) {
  import('@propsage/core').then(module => {
    MockDataProvider = module.MockDataProvider;
    DataProviderFactory = module.DataProviderFactory;
  });
}

interface UseRealtimeDataConfig {
  gameId?: string | null;
  autoSubscribe?: boolean;
  provider?: 'mock' | 'the-odds-api';
  apiKey?: string;
}

interface UseRealtimeDataResult {
  // Connection Status
  connected: boolean;
  provider: LiveDataProvider | null;
  latency: number;
  lastUpdate: Date | null;
  
  // Data
  games: GameLite[];
  props: PropOffer[];
  
  // Loading States
  gamesLoading: boolean;
  propsLoading: boolean;
  
  // Errors
  error: string | null;
  
  // Actions
  refreshGames: () => Promise<void>;
  refreshProps: (gameId: string) => Promise<void>;
  subscribe: (gameId: string) => () => void;
  unsubscribe: () => void;
}

export function useRealtimeData(config: UseRealtimeDataConfig = {}): UseRealtimeDataResult {
  const {
    gameId,
    autoSubscribe = true,
    provider = 'mock',
    apiKey
  } = config;

  // State
  const [connected, setConnected] = useState(false);
  const [latency, setLatency] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [games, setGames] = useState<GameLite[]>([]);
  const [props, setProps] = useState<PropOffer[]>([]);
  const [gamesLoading, setGamesLoading] = useState(false);
  const [propsLoading, setPropsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const providerRef = useRef<LiveDataProvider | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Initialize provider
  useEffect(() => {
    if (!isFeatureEnabled('realtime') || !DataProviderFactory) {
      return;
    }

    try {
      providerRef.current = DataProviderFactory.create({
        provider,
        apiKey,
        options: {
          cacheTimeoutMs: FEATURES.updateIntervalMs / 2,
          rateLimitPerMinute: 120,
          updateIntervalMs: FEATURES.updateIntervalMs
        }
      });
      setConnected(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize provider');
      setConnected(false);
    }
  }, [provider, apiKey]);

  // Refresh games
  const refreshGames = useCallback(async () => {
    if (!providerRef.current || gamesLoading) return;

    setGamesLoading(true);
    const startTime = Date.now();

    try {
      const newGames = await providerRef.current.getGames({
        status: 'all',
        leagues: FEATURES.supportedLeagues,
        limit: FEATURES.maxConcurrentGames
      });
      
      setGames(newGames);
      setLatency(Date.now() - startTime);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch games');
    } finally {
      setGamesLoading(false);
    }
  }, [gamesLoading]);

  // Refresh props for a specific game
  const refreshProps = useCallback(async (targetGameId: string) => {
    if (!providerRef.current || propsLoading) return;

    setPropsLoading(true);
    const startTime = Date.now();

    try {
      const newProps = await providerRef.current.getPropOffers(targetGameId);
      setProps(newProps);
      setLatency(Date.now() - startTime);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch props');
    } finally {
      setPropsLoading(false);
    }
  }, [propsLoading]);

  // Subscribe to real-time updates for a game
  const subscribe = useCallback((targetGameId: string) => {
    if (!providerRef.current || !isFeatureEnabled('websocket')) {
      return () => {};
    }

    // Unsubscribe from previous subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    const unsubscribe = providerRef.current.subscribeGame(
      targetGameId,
      (event: LiveEvent) => {
        console.log('Real-time event:', event);
        
        switch (event.type) {
          case 'odds_update':
            if (event.data.props) {
              setProps(event.data.props);
            } else if (event.data.propId) {
              // Update specific prop
              setProps(prev => prev.map(p => 
                p.id === event.data.propId 
                  ? { ...p, line: event.data.newLine, overPrice: event.data.newOverPrice }
                  : p
              ));
            }
            setLastUpdate(new Date());
            break;
            
          case 'game_state':
            // Update game state
            setGames(prev => prev.map(g => 
              g.id === targetGameId 
                ? { ...g, ...event.data }
                : g
            ));
            setLastUpdate(new Date());
            break;
            
          case 'prop_line_move':
            // Handle line movement notifications
            console.log('Line movement detected:', event.data);
            setLastUpdate(new Date());
            break;
        }
      }
    );

    unsubscribeRef.current = unsubscribe;
    return unsubscribe;
  }, []);

  // Unsubscribe from current subscription
  const unsubscribe = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
  }, []);

  // Auto-fetch games on mount
  useEffect(() => {
    if (connected && providerRef.current) {
      refreshGames();
    }
  }, [connected, refreshGames]);

  // Auto-fetch props when gameId changes
  useEffect(() => {
    if (connected && providerRef.current && gameId) {
      refreshProps(gameId);
    }
  }, [connected, gameId, refreshProps]);

  // Auto-subscribe to game updates
  useEffect(() => {
    if (autoSubscribe && gameId && connected) {
      const unsub = subscribe(gameId);
      return unsub;
    }
  }, [autoSubscribe, gameId, connected, subscribe]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribe();
    };
  }, [unsubscribe]);

  return {
    // Connection Status
    connected,
    provider: providerRef.current,
    latency,
    lastUpdate,
    
    // Data
    games,
    props,
    
    // Loading States
    gamesLoading,
    propsLoading,
    
    // Errors
    error,
    
    // Actions
    refreshGames,
    refreshProps,
    subscribe,
    unsubscribe
  };
}

/**
 * Simple hook for games data (backward compatibility)
 */
export function useRealtimeGames() {
  const { games, gamesLoading, error, refreshGames } = useRealtimeData({
    autoSubscribe: false
  });

  return {
    games,
    loading: gamesLoading,
    error,
    refresh: refreshGames
  };
}

/**
 * Simple hook for props data  
 */
export function useRealtimeProps(gameId: string | null) {
  const { props, propsLoading, error, refreshProps, lastUpdate } = useRealtimeData({
    gameId,
    autoSubscribe: true
  });

  return {
    props,
    loading: propsLoading,
    error,
    refresh: gameId ? () => refreshProps(gameId) : () => Promise.resolve(),
    lastUpdate
  };
}