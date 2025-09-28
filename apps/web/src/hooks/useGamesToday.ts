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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGames = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(ENDPOINTS.gamesToday, { cache: 'no-store' });
      const json = await res.json();
      const normalized = normalizeGames(json);
      setGames(normalized);
    } catch (e: any) {
      console.error('useGamesToday: failed to fetch games', e);
      setError(e?.message || 'Failed to load games');
    } finally {
      setLoading(false);
    }
  }, []);

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