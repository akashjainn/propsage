const CFBD = 'https://api.collegefootballdata.com';

interface CacheEntry { at: number; data: any; }
const cache = new Map<string, CacheEntry>();
const TTL_MS = 60 * 1000; // 60s for metadata

function getCache(key: string) {
  const e = cache.get(key);
  if (!e) return null;
  if (Date.now() - e.at > TTL_MS) { cache.delete(key); return null; }
  return e.data;
}
function setCache(key: string, data: any) {
  if (cache.size > 128) {
    const first = cache.keys().next().value;
    if (first) cache.delete(first);
  }
  cache.set(key, { at: Date.now(), data });
}

function authHeaders() {
  const key = process.env.CFBD_API_KEY;
  return key ? { headers: { Authorization: `Bearer ${key}` } } : {};
}

export async function fetchCfbdFbsTeams() {
  const url = `${CFBD}/teams/fbs`;
  const hit = getCache(url);
  if (hit) return hit;
  const r = await fetch(url, authHeaders());
  if (!r.ok) throw new Error(`CFBD ${r.status}`);
  const json = await r.json();
  setCache(url, json);
  return json as any[];
}

// Fetch player stats for a specific game
export async function fetchCfbdGamePlayerStats(gameId: number) {
  const url = `${CFBD}/games/players?gameId=${gameId}`;
  const hit = getCache(url);
  if (hit) return hit;
  const r = await fetch(url, authHeaders());
  if (!r.ok) throw new Error(`CFBD ${r.status}`);
  const json = await r.json();
  setCache(url, json);
  return json as any[];
}

// Fetch team stats for a specific game
export async function fetchCfbdGameTeamStats(gameId: number) {
  const url = `${CFBD}/games/teams?gameId=${gameId}`;
  const hit = getCache(url);
  if (hit) return hit;
  const r = await fetch(url, authHeaders());
  if (!r.ok) throw new Error(`CFBD ${r.status}`);
  const json = await r.json();
  setCache(url, json);
  return json as any[];
}

// Search for games by team and date range
export async function fetchCfbdGames(year: number, team?: string, week?: number) {
  let url = `${CFBD}/games?year=${year}`;
  if (team) url += `&team=${encodeURIComponent(team)}`;
  if (week) url += `&week=${week}`;
  
  const hit = getCache(url);
  if (hit) return hit;
  const r = await fetch(url, authHeaders());
  if (!r.ok) throw new Error(`CFBD ${r.status}`);
  const json = await r.json();
  setCache(url, json);
  return json as any[];
}