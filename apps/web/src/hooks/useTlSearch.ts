"use client";
import { useEffect, useState } from 'react';

interface UseTlSearchArgs {
  indexId: string;
  query: string;
  filters?: { game?: string; team?: string };
  debounceMs?: number;
}

export function useTlSearch({ indexId, query, filters, debounceMs = 300 }: UseTlSearchArgs) {
  const [state, setState] = useState<{ loading: boolean; results: any[]; error: any }>(() => ({ loading: false, results: [], error: null }));

  useEffect(() => {
    if (!query?.trim()) { setState(s => ({ ...s, results: [] })); return; }
    const t = setTimeout(async () => {
      setState({ loading: true, results: [], error: null });
      try {
        const r = await fetch('/api/tl/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ indexId, query, filters })
        }).then(r => r.json());
        setState({ loading: false, results: r.results || [], error: null });
      } catch (e: any) {
        setState({ loading: false, results: [], error: e });
      }
    }, debounceMs);
    return () => clearTimeout(t);
  }, [indexId, query, JSON.stringify(filters), debounceMs]);

  return state;
}
