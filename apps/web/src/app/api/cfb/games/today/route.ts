import { NextResponse } from 'next/server';

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
    // For now, return fallback data for demo purposes
    // In production, this would fetch from ESPN API
    return NextResponse.json(FALLBACK_GAMES, { status: 200 });
  } catch (e: any) {
    console.error('Failed to fetch games today:', e);
    return NextResponse.json(FALLBACK_GAMES, { status: 200 });
  }
}