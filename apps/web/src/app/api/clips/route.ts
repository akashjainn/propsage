import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { TWELVE_LABS_MOCK } from '@/data/twelvelabs.mock';

export const dynamic = 'force-dynamic';

// Load mock data directly
function loadMockData() {
  try {
    // Try multiple possible paths
    const possiblePaths = [
      path.join(process.cwd(), '../../api/data/twelvelabs.mock.json'),
      path.join(process.cwd(), '../api/data/twelvelabs.mock.json'),
      path.join(process.cwd(), '../../../api/data/twelvelabs.mock.json'),
      path.join(process.cwd(), 'apps/api/data/twelvelabs.mock.json'),
      '/var/task/apps/api/data/twelvelabs.mock.json',
      '/var/task/app/api/data/twelvelabs.mock.json'
    ];
    for (const mockPath of possiblePaths) {
      if (fs.existsSync(mockPath)) {
        console.log(`[Direct Clips API] Loading mock data from: ${mockPath}`);
        return JSON.parse(fs.readFileSync(mockPath, 'utf8'));
      }
    }
    console.warn('[Direct Clips API] Mock data file not found in filesystem paths, using embedded dataset');
  } catch (error) {
    console.warn('[Direct Clips API] Could not load mock data from FS:', error);
  }
  return TWELVE_LABS_MOCK; // embedded fallback
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const player = searchParams.get('player') || '';
  const stat = searchParams.get('stat') || '';
  const limit = parseInt(searchParams.get('limit') || '6');

  console.log(`[Direct Clips API] Looking for: player="${player}", stat="${stat}"`);

  try {
    const mockData = loadMockData();
    console.log(`[Direct Clips API] Mock data players:`, Object.keys(mockData.players || {}));

    const clips: any[] = [];
    const playerId = player ? `cfb_${player.toLowerCase().replace(/\s+/g, '_')}` : '';
    console.log(`[Direct Clips API] Derived playerId: "${playerId}"`);

    // Deterministic mapping first
    const propKey = playerId && stat ? `${playerId}:${stat.toLowerCase()}` : '';
    const mappedIds: string[] | undefined = (TWELVE_LABS_MOCK as any).propClipMap?.[propKey];
    console.log(`[Direct Clips API] PropKey: "${propKey}", MappedIds:`, mappedIds);

    if (mappedIds && mappedIds.length && mockData.players?.[playerId]) {
      const vids = mockData.players[playerId].videos || [];
      for (const desiredId of mappedIds) {
        const match = vids.find((v: any) => v.id === desiredId);
        if (match) {
          console.log(`[Direct Clips API] Found deterministic match: ${desiredId}`);
          clips.push(formatClip(match, mockData.players[playerId].team));
        }
      }
    }

    if (playerId && mockData.players && mockData.players[playerId] && clips.length === 0) {
      const playerVideos = mockData.players[playerId].videos || [];
      for (const video of playerVideos) {
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
        clips.push(formatClip(video, mockData.players[playerId].team));
      }
    }

    // Only do generic fallback if player is not in our dataset (prevents cross-team contamination)
    if (clips.length === 0 && stat && !mockData.players?.[playerId]) {
      console.log(`[Direct Clips API] Player not in dataset, doing generic search for stat: ${stat}`);
      outer: for (const [pid, playerData] of Object.entries(mockData.players || {})) {
        for (const video of (playerData as any).videos || []) {
          const statLower = stat.toLowerCase();
          const hasMatchingTag = video.tags?.some((tag: string) => tag.includes(statLower) || statLower.includes(tag));
          if (hasMatchingTag) {
            clips.push(formatClip(video, (playerData as any).team));
            if (clips.length >= limit) break outer;
          }
        }
      }
    } else if (clips.length === 0 && mockData.players?.[playerId]) {
      console.log(`[Direct Clips API] Player ${playerId} exists but no clips found for stat: ${stat}`);
    }

    clips.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
    const results = clips.slice(0, limit);

    console.log(`[Direct Clips API] Returning ${results.length} clips`);
    return NextResponse.json({
      clips: results,
      total: results.length,
      cached: false,
      providers: ['twelvelabs'],
      indexStatus: 'ready',
      poweredBy: 'TwelveLabs Video Intelligence (Embedded Mock)'
    });
  } catch (error) {
    console.error('[Direct Clips API] Error:', error);
    return NextResponse.json({ clips: [], error: 'Failed to fetch clips', total: 0 }, { status: 500 });
  }
}

function formatClip(video: any, team: string) {
  return {
    id: `twelvelabs_${video.id}`,
    platform: 'twelvelabs',
    externalId: video.id,
    title: video.title,
    description: video.clips?.[0]?.description || video.title,
    url: video.url,
    thumbnailUrl: video.thumbnail,
    author: `${team} Highlights`,
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
  };
}