export type IndexJobStatus = 'queued' | 'indexing' | 'analyzing' | 'ready' | 'failed';

export interface IndexJob {
  id: string;
  playerId: string;
  gameId?: string; // e.g., 'illinois-usc-20250927'
  source: 'youtube' | 'x' | 'instagram' | 'manual';
  url?: string;
  createdAt: string;
  updatedAt: string;
  status: IndexJobStatus;
  clipCount?: number;
  error?: string;
}
