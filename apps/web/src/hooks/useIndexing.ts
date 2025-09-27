'use client';
import useSWR from 'swr';
import type { IndexJob } from '@/types/indexing';

const fetcher = (u: string) => fetch(u).then(r => r.json());

export function useIndexJobs(playerId?: string) {
  const { data, isLoading, mutate } = useSWR<IndexJob[]>(`/api/index/jobs${playerId ? `?playerId=${playerId}` : ''}`, fetcher, { refreshInterval: 2000 });
  return { jobs: data ?? [], isLoading, refresh: mutate };
}

export async function enqueueIndex(playerId: string, url?: string) {
  await fetch('/api/index/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerId, source: url ? 'youtube' : 'manual', url })
  });
}
