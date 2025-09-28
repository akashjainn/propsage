import { NextResponse } from 'next/server';

// Keep fallback deterministic across calls (avoid regenerating new Date each request for stability)
const NOW = new Date().toISOString();
const FALLBACK_GAMES = [
  {
    id: "uga-alabama-20250927",
    start: NOW,
    state: "pre" as const,
    period: null,
    clock: null,
    away: {
      id: "61",
      name: "Georgia Bulldogs",
      short: "Georgia", 
      abbrev: "UGA",
      logo: "https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/61.png",
      color: "ba0c2f",
      rank: 5
    },
    home: {
      id: "333",
      name: "Alabama Crimson Tide",
      short: "Alabama",
      abbrev: "BAMA", 
      logo: "https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/333.png",
      color: "9e1b32",
      rank: 2
    },
    awayScore: null,
    homeScore: null,
    venue: { name: "Bryant-Denny Stadium", city: "Tuscaloosa" },
    broadcast: { network: "ABC" }
  },
  {
    id: "gt-wake-forest-20250927",
    start: NOW,
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
    start: NOW,
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
    // In production we'd fetch an upstream source then normalize to { games: GameLite[] }
    return NextResponse.json({ games: FALLBACK_GAMES }, { status: 200 });
  } catch (e: any) {
    console.error('Failed to fetch games today:', e);
    return NextResponse.json({ games: FALLBACK_GAMES }, { status: 200 });
  }
}