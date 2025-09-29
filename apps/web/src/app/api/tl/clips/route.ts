import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) || 'http://localhost:4000';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const game = searchParams.get('game') || '';
  const player = searchParams.get('player') || '';
  const market = searchParams.get('market') || '';

  console.log(`[TL Clips API] Looking for: game="${game}", player="${player}", market="${market}" (API_BASE_URL=${API_BASE_URL})`);

  try {
    const playerId = player ? `cfb_${player.toLowerCase().replace(/\s+/g, '_')}` : undefined;
    const searchQuery = [player, market].filter(Boolean).join(' ');
    const tags = market ? [market.toLowerCase().replace(/\s+/g, '_')] : undefined;

    let apiUrl = `${API_BASE_URL}/cfb/clips?limit=6`;
    if (player) apiUrl += `&player=${encodeURIComponent(player)}`;
    if (market) apiUrl += `&stat=${encodeURIComponent(market)}`;
    if (game) apiUrl += `&gameType=${encodeURIComponent(game)}`;

    console.log(`[TL Clips API] Calling: ${apiUrl}`);

    const response = await fetch(apiUrl, { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(10000) });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    // Guard: ensure JSON not HTML
    const text = await response.text();
    if (text.trim().startsWith('<')) {
      throw new Error('Received HTML instead of JSON (possible misconfigured API URL)');
    }
    let data: any;
    try { data = JSON.parse(text); } catch (e) { throw new Error('Invalid JSON from backend'); }

    const results = (data.clips || []).map((clip: any) => formatClip(clip, player, market));
    console.log(`[TL Clips API] Found ${results.length} clips from backend`);
    return NextResponse.json({ results });
  } catch (error) {
    console.error('[TL Clips API] Backend error:', error);
    return await fallbackDirect(req, player, market);
  }
}

async function fallbackDirect(req: Request, player: string, market: string) {
  try {
    console.log('[TL Clips API] Falling back to direct /api/clips');
    const fallbackUrl = new URL('/api/clips', req.url);
    if (player) fallbackUrl.searchParams.set('player', player);
    if (market) fallbackUrl.searchParams.set('stat', market);
    fallbackUrl.searchParams.set('limit', '6');

    const fallbackResponse = await fetch(fallbackUrl.toString(), { headers: { 'Accept': 'application/json' } });
    const fallbackText = await fallbackResponse.text();
    if (fallbackText.trim().startsWith('<')) throw new Error('Fallback returned HTML');
    const fallbackData = JSON.parse(fallbackText);
    const results = (fallbackData.clips || []).map((clip: any) => formatClip(clip, player, market));
    console.log(`[TL Clips API] Fallback found ${results.length} clips`);
    return NextResponse.json({ results, fallback: true, source: 'direct' });
  } catch (fallbackError) {
    console.error('[TL Clips API] Fallback failed:', fallbackError);
    return NextResponse.json({ results: [], error: String(fallbackError), fallback: true }, { status: 502 });
  }
}

function formatClip(clip: any, player: string, market: string) {
  return {
    game: clip.gameContext?.opponent ? `${clip.gameContext?.team || 'Team'} vs ${clip.gameContext.opponent}` : clip.gameContext?.team || 'College Football',
    player: clip.title?.includes('vs') ? clip.title.split(' vs')[0] : player || 'Player',
    market: market || 'Highlights',
    url: clip.url,
    start: clip.startTime || 0,
    end: clip.endTime || clip.duration || 30,
    title: clip.title,
    description: clip.description,
    thumbnailUrl: clip.thumbnailUrl,
    confidence: clip.relevanceScore || 0.8
  };
}
