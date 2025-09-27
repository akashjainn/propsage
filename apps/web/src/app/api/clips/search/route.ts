import { NextRequest, NextResponse } from 'next/server';

// TwelveLabs search proxy to avoid exposing API key to client.
// Env vars expected: TWELVELABS_API_KEY, TWELVELABS_INDEX_ID
// Minimal query body: { query?: string; player?: string; limit?: number }

interface TLSearchRequestBody {
  query?: string;
  player?: string;
  limit?: number;
}

interface TLClipResult {
  clip_id: string;
  start: number;
  end: number;
  confidence: number;
  video_url?: string;
  keywords?: string[];
  // Additional fields may be present; we keep only what we map.
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as TLSearchRequestBody;
  const { query, player, limit = 6 } = body;

  const indexId = process.env.TWELVELABS_INDEX_ID;
  const apiKey = process.env.TWELVELABS_API_KEY;
  if (!indexId || !apiKey) {
    return NextResponse.json({ error: 'Server missing TwelveLabs credentials' }, { status: 500 });
  }

  const query_text = query || player;
  if (!query_text) {
    return NextResponse.json({ clips: [] });
  }

  try {
    const resp = await fetch(`https://api.twelvelabs.io/v1.2/indexes/${indexId}/search`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query_text,
        page_limit: Math.min(limit, 12),
      }),
      // Revalidate quickly for ISR / caching layers
      cache: 'no-store',
    });

    if (!resp.ok) {
      const text = await resp.text();
      return NextResponse.json({ error: 'Search failed', detail: text }, { status: resp.status });
    }

    const data = await resp.json();
    const results: TLClipResult[] = data?.results || data?.data || [];

    const clips = results.map(r => ({
      id: r.clip_id,
      start: r.start,
      end: r.end,
      confidence: r.confidence ?? 0,
      src: r.video_url || '',
      keywords: r.keywords || [],
    }));

    return NextResponse.json({ clips });
  } catch (err: any) {
    console.error('TwelveLabs search error', err);
    return NextResponse.json({ error: 'Unhandled error performing search' }, { status: 500 });
  }
}
