import { NextRequest, NextResponse } from 'next/server';
import type { GameLite } from '@/types/cfb';

// All available games for demo
const ALL_GAMES: GameLite[] = [
  {
    id: 'gt-wake-forest-20250927',
    start: '2025-09-27T20:00:00.000Z',
    state: 'pre' as const,
    period: null,
    clock: null,
    home: { 
      id: 'gt', 
      name: 'Georgia Tech Yellow Jackets', 
      short: 'Georgia Tech', 
      abbrev: 'GT', 
      logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/59.png', 
      color: 'B3A369', 
      rank: 24 
    },
    away: { 
      id: 'wf', 
      name: 'Wake Forest Demon Deacons', 
      short: 'Wake Forest', 
      abbrev: 'WF', 
      logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/154.png', 
      color: '9E7E38', 
      rank: null 
    },
    venue: { name: 'Bobby Dodd Stadium', city: 'Atlanta', state: 'Georgia' },
    broadcast: { network: 'ACC Network' },
    awayScore: undefined,
    homeScore: undefined
  },
  {
    id: 'illinois-usc-20250927',
    start: '2025-09-27T22:00:00.000Z',
    state: 'pre' as const,
    period: undefined,
    clock: undefined,
    away: {
      id: '356',
      name: 'Illinois Fighting Illini',
      short: 'Illinois',
      abbrev: 'ILL', 
      logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/356.png',
      color: 'e84a27',
      rank: null
    },
    home: {
      id: '30',
      name: 'USC Trojans',
      short: 'USC',
      abbrev: 'USC',
      logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/30.png', 
      color: '990000',
      rank: null
    },
    awayScore: undefined,
    homeScore: undefined,
    venue: { name: 'Los Angeles Memorial Coliseum', city: 'Los Angeles', state: 'California' },
    broadcast: { network: 'FOX' }
  }
];

export async function GET(req: NextRequest) {
  const teamQ = req.nextUrl.searchParams.get('q');
  if (!teamQ) return NextResponse.json({ error: 'missing q' }, { status: 400 });
  
  try {
    // Simple fuzzy search across all available games
    const query = teamQ.toLowerCase();
    const matchingGames = ALL_GAMES.filter(game => {
      return [
        game.home.name, game.home.short, game.home.abbrev,
        game.away.name, game.away.short, game.away.abbrev
      ].some(field => field.toLowerCase().includes(query));
    });
    
    return NextResponse.json(matchingGames, { status: 200 });
  } catch (e: any) {
    console.error('Failed to search games:', e);
    return NextResponse.json([], { status: 200 });
  }
}