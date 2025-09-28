'use client';
import useSWR from 'swr';
import type { PropInsights } from '@/types/insights';

const fetcher = (u: string) => fetch(u).then(r => r.json() as Promise<PropInsights>);
export function useInsights(propId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<PropInsights>(propId ? `/api/insights/prop/${propId}` : null, fetcher, { refreshInterval: 60000 });
  return { insights: data, error, isLoading, refresh: mutate };
}
