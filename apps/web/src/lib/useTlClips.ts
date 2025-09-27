import { useState, useCallback } from 'react';

export interface TLClipRef {
  id: string;
  start: number;
  end: number;
  confidence: number;
  src: string; // may be empty if not returned
  keywords: string[];
}

export function useTlClips() {
  const [clips, setClips] = useState<TLClipRef[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string, gameId?: string, propType?: string, player?: string) => {
    if (!query.trim()) { setClips([]); return; }
    setLoading(true); setError(null);
    try {
      const resp = await fetch('/api/clips/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, gameId, propType, player, limit: 9 })
      });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'Search failed');
      }
      const data = await resp.json();
      setClips(data.clips || []);
    } catch (e:any) {
      setError(e.message);
      setClips([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { clips, loading, error, search };
}
