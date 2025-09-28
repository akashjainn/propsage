import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

// Load mock data directly
function loadMockData() {
  try {
    // Try multiple possible paths
    const possiblePaths = [
      path.join(process.cwd(), '../../api/data/twelvelabs.mock.json'),
      path.join(process.cwd(), '../api/data/twelvelabs.mock.json'),
      path.join(process.cwd(), '../../../api/data/twelvelabs.mock.json'),
      'C:\\Users\\akash\\documents\\propsage\\apps\\api\\data\\twelvelabs.mock.json'
    ];
    
    for (const mockPath of possiblePaths) {
      if (fs.existsSync(mockPath)) {
        console.log(`[Direct Clips API] Loading mock data from: ${mockPath}`);
        return JSON.parse(fs.readFileSync(mockPath, 'utf8'));
      }
    }
    console.warn('[Direct Clips API] Mock data file not found in any expected location');
  } catch (error) {
    console.warn('[Direct Clips API] Could not load mock data:', error);
  }
  
  // Return fallback test data
  return {
    players: {
      'cfb_gunner_stockton': {
        name: 'Gunner Stockton',
        team: 'UGA',
        videos: [
          {
            id: 'vid_stockton_pass_highlights_001',
            title: 'Gunner Stockton passes to Colbie Young touchdown',
            url: '/clips/9-27 uga alabama Gunner Stockton passes to Colbie Young touchdown.mp4',
            thumbnail: '/clips/thumbnails/9-27 uga alabama Gunner Stockton passes to Colbie Young touchdown.jpg',
            duration: 30,
            confidence: 0.94,
            tags: ['passing', 'touchdown', 'deep_ball', 'clutch'],
            metadata: {
              game: 'UGA vs Alabama',
              date: '2025-09-27',
              quarter: 3,
              down_distance: '2nd & 8',
              field_position: 'UGA 35'
            },
            clips: [
              {
                start_time: 0,
                end_time: 30,
                description: 'Stockton drops back, scans field, delivers perfect strike to Young in stride for touchdown'
              }
            ]
          }
        ]
      },
      'cfb_haynes_king': {
        name: 'Haynes King',
        team: 'Georgia Tech',
        videos: [
          {
            id: 'vid_king_passing_touchdown_001',
            title: 'Haynes King passing touchdown from 3rd and 10',
            url: '/clips/9-27 georgia tech wake forest haynes king passing touchdown from 3rd and 10 to begin comeback.mp4',
            thumbnail: '/clips/thumbnails/9-27 georgia tech wake forest haynes king passing touchdown from 3rd and 10 to begin comeback.jpg',
            duration: 35,
            confidence: 0.92,
            tags: ['passing', 'touchdown', 'comeback', 'clutch'],
            metadata: {
              game: 'Georgia Tech vs Wake Forest',
              date: '2025-09-27',
              quarter: 3,
              down_distance: '3rd & 10',
              field_position: 'Wake Forest 25'
            },
            clips: [
              {
                start_time: 0,
                end_time: 35,
                description: 'Haynes King delivers crucial touchdown pass on 3rd and 10 to begin comeback'
              }
            ]
          }
        ]
      }
    }
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const player = searchParams.get('player') || '';
  const stat = searchParams.get('stat') || '';
  const limit = parseInt(searchParams.get('limit') || '6');

  console.log(`[Direct Clips API] Looking for: player="${player}", stat="${stat}"`);

  try {
    const mockData = loadMockData();
    console.log(`[Direct Clips API] Mock data keys:`, Object.keys(mockData));
    console.log(`[Direct Clips API] Players in mock data:`, Object.keys(mockData.players || {}));
    
    const clips: any[] = [];

    // Convert player name to ID format
    const playerId = player ? `cfb_${player.toLowerCase().replace(/\s+/g, '_')}` : '';
    console.log(`[Direct Clips API] Looking for playerId: "${playerId}"`);

    // Find clips for the player
    if (playerId && mockData.players && mockData.players[playerId]) {
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