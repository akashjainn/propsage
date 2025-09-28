import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

// Load mock data directly
function loadMockData() {
  try {
    const mockPath = path.join(process.cwd(), '../../api/data/twelvelabs.mock.json');
    if (fs.existsSync(mockPath)) {
      return JSON.parse(fs.readFileSync(mockPath, 'utf8'));
    }
  } catch (error) {
    console.warn('Could not load mock data:', error);
  }
  return { players: {} };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const player = searchParams.get('player') || '';
  const stat = searchParams.get('stat') || '';
  const limit = parseInt(searchParams.get('limit') || '6');

  console.log(`[Direct Clips API] Looking for: player="${player}", stat="${stat}"`);

  try {
    const mockData = loadMockData();
    const clips: any[] = [];

    // Convert player name to ID format
    const playerId = player ? `cfb_${player.toLowerCase().replace(/\s+/g, '_')}` : '';

    // Find clips for the player
    if (playerId && mockData.players[playerId]) {
      const playerVideos = mockData.players[playerId].videos || [];
      
      for (const video of playerVideos) {
        // Filter by stat/tags if provided
        if (stat) {
          const statLower = stat.toLowerCase();
          const hasMatchingTag = video.tags?.some((tag: string) => 
            tag.includes(statLower) || statLower.includes(tag) ||
            (statLower.includes('passing') && tag.includes('pass')) ||
            (statLower.includes('rushing') && tag.includes('rush')) ||
            (statLower.includes('receiving') && tag.includes('receiv'))
          );
          if (!hasMatchingTag) continue;
        }

        // Convert to expected format
        clips.push({
          id: `twelvelabs_${video.id}`,
          platform: 'twelvelabs',
          externalId: video.id,
          title: video.title,
          description: video.clips?.[0]?.description || video.title,
          url: video.url,
          thumbnailUrl: video.thumbnail,
          author: `${mockData.players[playerId].team} Highlights`,
          duration: video.duration,
          publishedAt: video.metadata?.date || new Date().toISOString(),
          viewCount: Math.floor(Math.random() * 100000) + 10000,
          relevanceScore: video.confidence,
          tags: video.tags || ['highlights'],
          gameContext: {
            opponent: video.metadata?.opponent,
            date: video.metadata?.date,
            week: video.metadata?.week,
            season: 2025
          },
          startTime: video.clips?.[0]?.start_time || 0,
          endTime: video.clips?.[0]?.end_time || video.duration
        });
      }
    }

    // If no player-specific clips found, try to find any clips that match the stat
    if (clips.length === 0 && stat) {
      for (const [pid, playerData] of Object.entries(mockData.players as any)) {
        for (const video of (playerData as any).videos || []) {
          const statLower = stat.toLowerCase();
          const hasMatchingTag = video.tags?.some((tag: string) => 
            tag.includes(statLower) || statLower.includes(tag)
          );
          if (hasMatchingTag) {
            clips.push({
              id: `twelvelabs_${video.id}`,
              platform: 'twelvelabs',
              externalId: video.id,
              title: video.title,
              description: video.clips?.[0]?.description || video.title,
              url: video.url,
              thumbnailUrl: video.thumbnail,
              author: `${(playerData as any).team} Highlights`,
              duration: video.duration,
              publishedAt: video.metadata?.date || new Date().toISOString(),
              viewCount: Math.floor(Math.random() * 100000) + 10000,
              relevanceScore: video.confidence,
              tags: video.tags || ['highlights'],
              gameContext: {
                opponent: video.metadata?.opponent,
                date: video.metadata?.date,
                week: video.metadata?.week,
                season: 2025
              },
              startTime: video.clips?.[0]?.start_time || 0,
              endTime: video.clips?.[0]?.end_time || video.duration
            });
          }
        }
      }
    }

    // Sort by relevance and limit results
    clips.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
    const results = clips.slice(0, limit);

    console.log(`[Direct Clips API] Found ${results.length} clips`);
    
    return NextResponse.json({
      clips: results,
      total: results.length,
      cached: false,
      providers: ['twelvelabs'],
      indexStatus: 'ready',
      poweredBy: 'TwelveLabs Video Intelligence (Direct)'
    });

  } catch (error) {
    console.error('[Direct Clips API] Error:', error);
    return NextResponse.json({ 
      clips: [],
      error: 'Failed to fetch clips',
      total: 0
    });
  }
}