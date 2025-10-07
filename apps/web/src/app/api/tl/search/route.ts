import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const TL_BASE = process.env.TWELVELABS_BASE_URL || 'https://api.twelvelabs.io/v1.2';
// Support multiple env var names for convenience
const TL_KEY = process.env.TWELVELABS_API_KEY || process.env.TL_API_KEY || process.env.TWELVE_LABS_API_KEY;

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

const schema = z.object({
  indexId: z.string(),
  query: z.string().min(2),
  filters: z.object({ game: z.string().optional(), team: z.string().optional() }).optional(),
  topK: z.number().min(1).max(20).default(6)
});

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { indexId, query, filters, topK } = schema.parse(await req.json());
    if (!TL_KEY) {
      return NextResponse.json({ error: 'Missing Twelve Labs API key (set TWELVE_LABS_API_KEY)' }, { status: 400 });
    }
    const r = await tlFetch('/search', {
      method: 'POST',
      body: JSON.stringify({ 
        index_id: indexId, 
        query, 
        search_options: ['visual', 'conversation', 'text_in_video'],
        sort_option: 'score',
        page_limit: topK,
        ...(filters && Object.keys(filters).length > 0 ? { filter: filters } : {})
      })
    });
    const results = (r?.data || []).map((s: any) => ({
      videoId: s.video_id,
      start: s.start ?? 0,
      end: s.end ?? ((s.start ?? 0) + 12),
      score: s.score,
      thumbnailUrl: s.thumbnail_url,
      title: s.metadata?.filename || `Clip ${s.start}s-${s.end}s`,
      url: s.hls?.video_url || s.mp4?.video_url || '',
      type: s.hls?.video_url ? 'hls' : 'mp4'
    }));
    return NextResponse.json({ results });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
