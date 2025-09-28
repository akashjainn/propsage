import { NextResponse } from 'next/server';
import { fetchEspnScoreboard, mapEspnEventToGame } from '@/server/providers/espnScoreboard';
import { enrichGames } from '@/server/teamEnrichment';

const FALLBACK_GAMES = [
  {
    id: "gt-wake-forest-20250927",
    start: new Date().toISOString(),
    state: "pre" as const,
    period: null,
    clock: null,
    away: {
      id: "59",
      name: "Georgia Tech Yellow Jackets", 
      short: "Georgia Tech",
      abbrev: "GT",
      logo: "https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/59.png",
      color: "b3a369",
      rank: null
    },
    home: {
      id: "154",
      name: "Wake Forest Demon Deacons",
      short: "Wake Forest", 
      abbrev: "WAKE",
      logo: "https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/154.png",
      color: "9e7e38",
      rank: null
    },
    awayScore: null,
    homeScore: null,
    venue: { name: "Bobby Dodd Stadium", city: "Atlanta" },
    broadcast: { network: "ACC Network" }
  },
  {
    id: "illinois-usc-20250927",
    start: new Date().toISOString(),
    state: "pre" as const,
    period: null,
    clock: null,
    away: {
      id: "356",
      name: "Illinois Fighting Illini",
      short: "Illinois",
      abbrev: "ILL", 
      logo: "https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/356.png",
      color: "e84a27",
      rank: null
    },
    home: {
      id: "30",
      name: "USC Trojans",
      short: "USC",
      abbrev: "USC",
      logo: "https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/30.png", 
      color: "990000",
      rank: null
    },
    awayScore: null,
    homeScore: null,
    venue: { name: "Los Angeles Memorial Coliseum", city: "Los Angeles" },
    broadcast: { network: "FOX" }
  }
];

export async function GET() {
  try {
    const iso = new Date().toISOString();
    const data = await fetchEspnScoreboard(iso);
    const events = Array.isArray(data?.events) ? data.events : [];
    
    if (events.length === 0) {
      // Return fallback data if no ESPN data
      return NextResponse.json(FALLBACK_GAMES, { status: 200 });
    }
    
    const dedup = new Map<string, any>();
    for (const e of events) {
      if (!e?.id) continue;
      if (!dedup.has(e.id)) dedup.set(e.id, e);
    }
    const gamesRaw = Array.from(dedup.values()).map(mapEspnEventToGame);
    const games = await enrichGames(gamesRaw);
    return NextResponse.json(games.length > 0 ? games : FALLBACK_GAMES, { status: 200 });
  } catch (e: any) {
    console.error('Failed to fetch games today:', e);
    // Return fallback data on error
    return NextResponse.json(FALLBACK_GAMES, { status: 200 });
  }
}