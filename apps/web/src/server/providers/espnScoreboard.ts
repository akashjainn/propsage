import type { GameLite, TeamLite, GameState } from '@/types/cfb';

const BASE = 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard';

// Simple TTL cache to soften burst traffic (not a perfect LRU but adequate here)
interface CacheEntry { at: number; data: any; }
const cache = new Map<string, CacheEntry>();
const TTL_MS = 15 * 1000; // 15s

function getCache(key: string) {
  const e = cache.get(key);
  if (!e) return null;
  if (Date.now() - e.at > TTL_MS) { cache.delete(key); return null; }
  return e.data;
}

function setCache(key: string, data: any) {
  // basic size cap
  if (cache.size > 128) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(key, { at: Date.now(), data });
}

export async function fetchEspnScoreboard(dateISO: string) {
  const yyyymmdd = dateISO.replaceAll('-', '').slice(0, 8);
  const url = `${BASE}?dates=${yyyymmdd}&groups=80&limit=300`;
  const hit = getCache(url);
  if (hit) return hit;
  const r = await fetch(url, { next: { revalidate: 15 } });
  if (!r.ok) throw new Error(`ESPN ${r.status}`);
  const json = await r.json();
  setCache(url, json);
  return json as any;
}

export function mapEspnEventToGame(e: any): GameLite {
  const comp = e?.competitions?.[0];
  const competitors = comp?.competitors ?? [];
  const [c0, c1] = competitors;
  const mkTeam = (c: any): TeamLite => {
    const t = c?.team ?? {};
    const logos = t.logos || [];
    
    // Enhanced name normalization
    let displayName = t.displayName || t.name || '';
    let shortName = t.shortDisplayName || t.shortName || '';
    let abbreviation = t.abbreviation || t.abbrev || '';
    
    // Handle common ESPN inconsistencies
    if (!shortName && displayName) {
      // Extract short name from display name
      const shortMappings: Record<string, string> = {
        'Georgia Bulldogs': 'Georgia',
        'Alabama Crimson Tide': 'Alabama',
        'Georgia Tech Yellow Jackets': 'Georgia Tech',
        'Wake Forest Demon Deacons': 'Wake Forest',
        'Illinois Fighting Illini': 'Illinois',
        'USC Trojans': 'USC'
      };
      shortName = shortMappings[displayName] || displayName.split(' ')[0];
    }
    
    // Handle abbreviation mapping
    if (!abbreviation && (displayName || shortName)) {
      const abbrevMappings: Record<string, string> = {
        'Georgia': 'UGA',
        'Alabama': 'ALA', 
        'Georgia Tech': 'GT',
        'Wake Forest': 'WF',
        'Illinois': 'ILL',
        'USC': 'USC'
      };
      abbreviation = abbrevMappings[shortName] || abbrevMappings[displayName] || shortName?.substring(0, 3).toUpperCase() || '';
    }
    
    return {
      id: String(t.id ?? ''),
      name: displayName || shortName || abbreviation || 'Unknown Team',
      short: shortName || displayName || abbreviation || 'Team',
      abbrev: abbreviation || shortName?.substring(0, 3).toUpperCase() || '',
      logo: t.logo || logos?.[0]?.href || null,
      color: (t.color || t.alternateColor || '')?.replace('#','') || null,
      rank: c?.curatedRank?.current ?? null,
    };
  };
  const homeC = c0?.homeAway === 'home' ? c0 : (c1?.homeAway === 'home' ? c1 : c0);
  const awayC = c0?.homeAway === 'away' ? c0 : (c1?.homeAway === 'away' ? c1 : c1);
  const state = (e?.status?.type?.state ?? 'pre') as GameState;
  return {
    id: String(e.id),
    start: e?.date,
    state,
    home: mkTeam(homeC),
    away: mkTeam(awayC),
    venue: { name: comp?.venue?.fullName, city: comp?.venue?.address?.city, state: comp?.venue?.address?.state },
    broadcast: { network: comp?.broadcasts?.[0]?.names?.[0] },
    period: comp?.status?.period,
    clock: comp?.status?.displayClock,
    homeScore: Number(homeC?.score ?? 0),
    awayScore: Number(awayC?.score ?? 0),
  };
}