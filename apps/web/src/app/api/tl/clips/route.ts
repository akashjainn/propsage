import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const game = searchParams.get('game') || '';
  const player = searchParams.get('player') || '';
  const market = searchParams.get('market') || '';

  console.log(`[TL Clips API] Looking for: game="${game}", player="${player}", market="${market}"`);

  try {
    // Convert player name to playerId format
    const playerId = player ? `cfb_${player.toLowerCase().replace(/\s+/g, '_')}` : undefined;
    
    // Build search query combining player and market
    const searchQuery = [player, market].filter(Boolean).join(' ');
    
    // Convert market to tags
    const tags = market ? [market.toLowerCase().replace(/\s+/g, '_')] : undefined;
    
    // Call the backend CFB clips API
    let apiUrl = `${API_BASE_URL}/cfb/clips?limit=6`;
    if (player) apiUrl += `&player=${encodeURIComponent(player)}`;
    if (market) apiUrl += `&stat=${encodeURIComponent(market)}`;
    if (game) apiUrl += `&gameType=${encodeURIComponent(game)}`;
    
    console.log(`[TL Clips API] Calling: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
      },
      // Add timeout
      signal: AbortSignal.timeout(10000)
    });
    
    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform the clips to match the expected format
    const results = (data.clips || []).map((clip: any) => ({
      game: clip.gameContext?.opponent ? 
        `${clip.gameContext?.team || 'Team'} vs ${clip.gameContext.opponent}` : 
        clip.gameContext?.team || 'College Football',
      player: clip.title?.includes('vs') ? 
        clip.title.split(' vs')[0] : 
        player || 'Player',
      market: market || 'Highlights',
      url: clip.url,
      start: clip.startTime || 0,
      end: clip.endTime || clip.duration || 30,
      title: clip.title,
      description: clip.description,
      thumbnailUrl: clip.thumbnailUrl,
      confidence: clip.relevanceScore || 0.8
    }));
    
    console.log(`[TL Clips API] Found ${results.length} clips from backend`);
    return NextResponse.json({ results });
    
  } catch (error) {
    console.error('[TL Clips API] Backend error:', error);
    
    // Fallback to direct API
    try {
      console.log('[TL Clips API] Falling back to direct API');
      const fallbackUrl = new URL('/api/clips', req.url);
      if (player) fallbackUrl.searchParams.set('player', player);
      if (market) fallbackUrl.searchParams.set('stat', market);
      fallbackUrl.searchParams.set('limit', '6');
      
      const fallbackResponse = await fetch(fallbackUrl.toString());
      const fallbackData = await fallbackResponse.json();
      
      // Transform the clips to match expected format
      const results = (fallbackData.clips || []).map((clip: any) => ({
        game: clip.gameContext?.opponent ? 
          `${clip.gameContext?.team || 'Team'} vs ${clip.gameContext.opponent}` : 
          clip.gameContext?.team || 'College Football',
        player: clip.title?.includes('vs') ? 
          clip.title.split(' vs')[0] : 
          player || 'Player',
        market: market || 'Highlights',
        url: clip.url,
        start: clip.startTime || 0,
        end: clip.endTime || clip.duration || 30,
        title: clip.title,
        description: clip.description,
        thumbnailUrl: clip.thumbnailUrl,
        confidence: clip.relevanceScore || 0.8
      }));
      
      console.log(`[TL Clips API] Fallback found ${results.length} clips`);
      return NextResponse.json({ 
        results,
        fallback: true,
        source: 'direct'
      });
      
    } catch (fallbackError) {
      console.error('[TL Clips API] Fallback failed:', fallbackError);
      return NextResponse.json({ 
        results: [],
        error: 'All clip sources failed',
        fallback: true 
      });
    }
  }
}
