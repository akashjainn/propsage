import { NextRequest, NextResponse } from 'next/server';

// TwelveLabs search proxy to avoid exposing API key to client.
// Env vars expected: TWELVELABS_API_KEY, TWELVELABS_INDEX_ID
// Minimal query body: { query?: string; player?: string; limit?: number }

interface TLSearchRequestBody {
  query?: string;
  player?: string;
  gameId?: string;
  propType?: string;
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

// Map prop types to better search queries
const PROP_QUERY_MAP: Record<string, string> = {
  'Passing Yards': 'passing touchdown throw',
  'Passing Touchdowns': 'passing touchdown',
  'Rushing Yards': 'rushing run carry',
  'Rushing Touchdowns': 'rushing touchdown run',
  'Receiving Yards': 'catch reception receiving',
  'Receiving Touchdowns': 'receiving touchdown catch',
  'Interceptions': 'interception turnover'
};

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as TLSearchRequestBody;
  const { query, player, gameId, propType, limit = 6 } = body;

  const indexId = process.env.TWELVELABS_INDEX_ID;
  const apiKey = process.env.TL_API_KEY || process.env.TWELVELABS_API_KEY;
  
  // Fallback mock clips for Illinois players when TwelveLabs isn't configured
  if (!indexId || !apiKey) {
    const mockClips = [];
    
    if (gameId === 'illinois-usc-20250927') {
      if (player?.toLowerCase().includes('altmyer') || query?.toLowerCase().includes('altmyer')) {
        mockClips.push(
          { id: 'altmyer_pass_1', start: 0, end: 15, confidence: 0.92, src: 'data:video/mp4;base64,AAAAHGZ0eXBtcDQyAAACAGlzb21pc28yYXZjMW1wNDE=', keywords: ['altmyer', 'passing', 'touchdown'] },
          { id: 'altmyer_pass_2', start: 0, end: 12, confidence: 0.88, src: 'data:video/mp4;base64,AAAAHGZ0eXBtcDQyAAACAGlzb21pc28yYXZjMW1wNDE=', keywords: ['altmyer', 'passing', 'yards'] },
          { id: 'altmyer_pass_3', start: 5, end: 18, confidence: 0.91, src: 'data:video/mp4;base64,AAAAHGZ0eXBtcDQyAAACAGlzb21pc28yYXZjMW1wNDE=', keywords: ['altmyer', 'passing', 'completion'] }
        );
      } else if (player?.toLowerCase().includes('feagin') || query?.toLowerCase().includes('feagin')) {
        mockClips.push(
          { id: 'feagin_rush_1', start: 0, end: 10, confidence: 0.85, src: '/api/video/mock/feagin_rush_1', keywords: ['feagin', 'rushing', 'yards'] },
          { id: 'feagin_catch_1', start: 0, end: 8, confidence: 0.82, src: '/api/video/mock/feagin_catch_1', keywords: ['feagin', 'receiving', 'catch'] }
        );
      } else if (player?.toLowerCase().includes('bowick') || query?.toLowerCase().includes('bowick')) {
        mockClips.push(
          { id: 'bowick_catch_1', start: 0, end: 8, confidence: 0.87, src: '/api/video/mock/bowick_catch_1', keywords: ['bowick', 'receiving', 'catch'] },
          { id: 'bowick_route_1', start: 2, end: 12, confidence: 0.84, src: '/api/video/mock/bowick_route_1', keywords: ['bowick', 'receiving', 'route'] }
        );
      }
    } else if (gameId === 'gt-wake-forest-20250927') {
      if (player?.toLowerCase().includes('king') || query?.toLowerCase().includes('king')) {
        mockClips.push(
          { id: 'king_pass_1', start: 0, end: 14, confidence: 0.93, src: '/api/video/mock/king_pass_1', keywords: ['king', 'passing', 'touchdown'] },
          { id: 'king_rush_1', start: 0, end: 11, confidence: 0.89, src: '/api/video/mock/king_rush_1', keywords: ['king', 'rushing', 'yards'] }
        );
      }
    }
    
    return NextResponse.json({ clips: mockClips });
  }

  // Build enhanced query
  let query_text = query;
  if (!query_text && player && propType) {
    const propQuery = PROP_QUERY_MAP[propType] || propType.toLowerCase();
    query_text = `${player} ${propQuery}`;
  } else if (!query_text) {
    query_text = player;
  }

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
      src: r.video_url ? `/api/video/clip/${r.clip_id}` : '', // Use proxy for CORS support
      keywords: r.keywords || [],
    }));

    return NextResponse.json({ clips });
  } catch (err: any) {
    console.error('TwelveLabs search error', err);
    return NextResponse.json({ error: 'Unhandled error performing search' }, { status: 500 });
  }
}
