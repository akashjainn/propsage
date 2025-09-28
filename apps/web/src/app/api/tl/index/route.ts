import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// NOTE: Replace TL API base / endpoints as needed per account version.
const TL_BASE = process.env.TL_BASE_URL || 'https://api.twelvelabs.io';
const TL_KEY = process.env.TWELVE_LABS_API_KEY;

if (!TL_KEY) {
  console.warn('[TL] TWELVE_LABS_API_KEY not set – index route will fail.');
}

const bodySchema = z.object({
  indexName: z.string().default('college-football-12'),
  clips: z.array(z.object({
    url: z.string().url(),
    game: z.string(),
    teams: z.tuple([z.string(), z.string()]),
    meta: z.object({ quarter: z.string().optional(), clock: z.string().optional(), downDistance: z.string().optional() }).optional()
  }))
});

async function tlFetch(path: string, init: RequestInit = {}) {
  const res = await fetch(`${TL_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': TL_KEY || '',
      ...(init.headers || {})
    },
    cache: 'no-store'
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`TL_ERR_${res.status}_${path}: ${text.slice(0,200)}`);
  }
  return res.json();
}

async function ensureIndex(name: string) {
  const data = await tlFetch('/v3/indexes?limit=100');
  const existing = data?.data?.find((i: any) => i.name === name);
  if (existing) return existing.id;
  const created = await tlFetch('/v3/indexes', { method: 'POST', body: JSON.stringify({ name }) });
  return created.id;
}

async function registerClip(indexId: string, url: string, metadata: any) {
  const task = await tlFetch('/v3/tasks', { method: 'POST', body: JSON.stringify({ type: 'index', index_id: indexId, video_url: url, metadata }) });
  return task.id;
}

async function pollTask(taskId: string, timeoutMs = 300_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const t = await tlFetch(`/v3/tasks/${taskId}`);
    if (t.status === 'completed') return t.result;
    if (t.status === 'failed') throw new Error(`TL_TASK_FAILED: ${t.error}`);
    await new Promise(r => setTimeout(r, 3000));
  }
  throw new Error('TL_TASK_TIMEOUT');
}

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = bodySchema.parse(await req.json());
    const indexId = await ensureIndex(body.indexName);
    const results: any[] = [];
    for (const clip of body.clips) {
      const taskId = await registerClip(indexId, clip.url, { game: clip.game, teams: clip.teams, ...clip.meta });
      const result = await pollTask(taskId);
      results.push({ indexId, videoId: result.video_id, ...clip });
      // TODO: persist to DB
    }
    return NextResponse.json({ indexId, results });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
