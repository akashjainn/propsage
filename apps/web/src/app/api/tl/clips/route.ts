import { NextResponse } from 'next/server';
import { TWELVE_LABS_MOCK } from '@/data/twelvelabs.mock';
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
    if (results.length > 0) return NextResponse.json({ results, fallback: true, source: 'direct' });
    // If still empty, attempt embedded dataset directly
    const embedded = embeddedFallback(player, market);
    console.log(`[TL Clips API] Embedded fallback produced ${embedded.length} clips`);
    return NextResponse.json({ results: embedded, fallback: true, source: 'embedded' });
  } catch (fallbackError) {
    console.error('[TL Clips API] Fallback failed:', fallbackError);
    const embedded = embeddedFallback(player, market);
    if (embedded.length) {
      return NextResponse.json({ results: embedded, fallback: true, source: 'embedded', error: String(fallbackError) });
    }
    // Last resort: return empty but do NOT surface 502 to client UI (avoid hard errors)
    return NextResponse.json({ results: [], error: String(fallbackError), fallback: true, source: 'none' });
  }
}

interface EmbeddedPlayerVideos { team: string; videos: any[] }
function embeddedFallback(player: string, market: string) {
  try {
    const results: any[] = [];
    const wantPlayerId = player ? `cfb_${player.toLowerCase().replace(/\s+/g, '_')}` : undefined;
    const stat = market.toLowerCase();
  const players = TWELVE_LABS_MOCK.players as Record<string, EmbeddedPlayerVideos> || {} as Record<string, EmbeddedPlayerVideos>;
    const pushVideo = (video: any, team: string) => {
      // Basic stat/tag heuristic
      if (stat) {
        const tags: string[] = video.tags || [];
        const normalized = (t: string) => t.replace(/ing$/,'');
        if (!tags.some(t => stat.includes(t) || t.includes(stat) || normalized(stat).includes(normalized(t)))) return;
      }
      results.push({
        game: video.metadata?.game || 'College Football',
        player: player || video.title.split(' ')[0],
        market: market || 'Highlights',
        url: video.url,
        start: video.clips?.[0]?.start_time || 0,
        end: video.clips?.[0]?.end_time || video.duration || 30,
        title: video.title,
        description: video.clips?.[0]?.description || video.title,
        thumbnailUrl: video.thumbnail,
        confidence: video.confidence || 0.8
      });
    };
    if (wantPlayerId && Object.prototype.hasOwnProperty.call(players, wantPlayerId)) {
      for (const v of (players[wantPlayerId].videos || [])) pushVideo(v, players[wantPlayerId].team);
    }
    if (results.length === 0) {
      for (const pid of Object.keys(players)) {
        const pv = players[pid];
        for (const v of (pv.videos || [])) pushVideo(v, pv.team);
      }
    }
    return results.slice(0,6);
  } catch (e) {
    console.warn('[TL Clips API] Embedded fallback error', e);
    return [];
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
