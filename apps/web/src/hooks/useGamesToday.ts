"use client";

import { useEffect, useState, useCallback } from 'react';
import type { GameLite } from '@/types/cfb';
import { ENDPOINTS } from '@/lib/api';

interface UseGamesTodayOptions {
  pollIntervalMs?: number;
  immediate?: boolean;
}

interface UseGamesTodayResult {
  games: GameLite[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// Normalizes any acceptable response shape into GameLite[]
function normalizeGames(data: any): GameLite[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as GameLite[];
  if (Array.isArray(data.games)) return data.games as GameLite[];
  return [];
}

export function useGamesToday(options: UseGamesTodayOptions = {}): UseGamesTodayResult {
  const { pollIntervalMs = 60_000, immediate = true } = options;
  const [games, setGames] = useState<GameLite[]>([]);
  const [loading, setLoading] = useState<boolean>(immediate);
  const [error, setError] = useState<string | null>(null);

  const fetchGames = useCallback(async () => {
    // Don't refetch if already loading
    if (loading) return;
    
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(ENDPOINTS.gamesToday, { 
        cache: 'force-cache', // Use cache when available
        next: { revalidate: 60 } // Revalidate every 60s
      });
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const json = await res.json();
      const normalized = normalizeGames(json);
      
      // Only update if data actually changed
      setGames(prev => {
        if (JSON.stringify(prev) === JSON.stringify(normalized)) {
          return prev; // Prevent unnecessary re-renders
        }
        return normalized;
      });
    } catch (e: any) {
      console.error('useGamesToday: failed to fetch games', e);
      setError(e?.message || 'Failed to load games');
    } finally {
      setLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    if (immediate) fetchGames();
    if (pollIntervalMs > 0) {
      const id = setInterval(fetchGames, pollIntervalMs);
      return () => clearInterval(id);
    }
  }, [fetchGames, pollIntervalMs, immediate]);

  return { games, loading, error, refresh: fetchGames };
}

export default useGamesToday;