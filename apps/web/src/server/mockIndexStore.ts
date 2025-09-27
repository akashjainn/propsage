import { IndexJob } from '@/types/indexing';

const jobs = new Map<string, IndexJob>();

const bump = (id: string, status: IndexJob['status']) => {
  const j = jobs.get(id); if (!j) return;
  j.status = status; j.updatedAt = new Date().toISOString();
};

export const createJob = (j: Omit<IndexJob,'id'|'createdAt'|'updatedAt'|'status'>) => {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const job: IndexJob = { id, status:'queued', createdAt:now, updatedAt:now, ...j };
  jobs.set(id, job);
  // mock lifecycle progression
  setTimeout(()=>bump(id,'indexing'), 800);
  setTimeout(()=>bump(id,'analyzing'), 1800);
  setTimeout(()=>{ bump(id,'ready'); const jj = jobs.get(id); if (jj) jj.clipCount = 12; }, 3200);
  return job;
};

export const getJob = (id: string) => jobs.get(id);
export const listJobs = (playerId?: string) => Array.from(jobs.values()).filter(j => !playerId || j.playerId === playerId);
