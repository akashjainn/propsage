import fs from 'fs';
import path from 'path';

export interface RawCfbdGame {
  id: number;
  season: number;
  week: number;
  start_date: string; // ISO
  start_time_tbd?: boolean;
  home_team: string;
  away_team: string;
  home_points?: number | null;
  away_points?: number | null;
  venue?: string;
  neutral_site?: boolean;
  conference_game?: boolean;
  tv?: string | null;
}

export interface NormalizedGame {
  id: string;
  rawId: number;
  date: string;               // YYYY-MM-DD
  kickoffISO: string;         // ISO in original tz
  kickoffET: string;          // formatted ET time or 'TBD'
  status: 'SCHEDULED' | 'LIVE' | 'FINAL' | 'TBD';
  liveClock?: string;         // e.g. 'Q2 08:42' or 'In Progress'
  home: { team: string; score: number | null; };
  away: { team: string; score: number | null; };
  venue?: string;
  network?: string | null;
  notes?: string;
}

const CACHE_DIR = path.join(__dirname, '../../data/schedule-cache');

function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
}

function cacheFile(date: string) { // date = YYYY-MM-DD
  ensureCacheDir();
  return path.join(CACHE_DIR, `schedule-${date}.json`);
}

export async function readCachedSchedule(date: string): Promise<NormalizedGame[] | null> {
  try {
    const file = cacheFile(date);
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    }
  } catch (e) {
    console.warn('Schedule cache read failed', e);
  }
  return null;
}

function writeCache(date: string, games: NormalizedGame[]) {
  try {
    fs.writeFileSync(cacheFile(date), JSON.stringify(games, null, 2));
  } catch (e) {
    console.warn('Schedule cache write failed', e);
  }
}

function toEasternTime(iso: string | null | undefined): string {
  if (!iso) return 'TBD';
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' });
  } catch {
    return 'TBD';
  }
}

function deriveStatus(g: RawCfbdGame, now: number): { status: NormalizedGame['status']; liveClock?: string } {
  const kickoff = g.start_date ? new Date(g.start_date).getTime() : null;
  const hasScores = g.home_points != null || g.away_points != null;
  if (g.start_time_tbd) return { status: 'TBD' };
  if (kickoff && now < kickoff) return { status: 'SCHEDULED' };
  // Heuristic: if scores exist but game is earlier the same day and >3.5h elapsed → FINAL
  if (kickoff && hasScores) {
    const elapsed = now - kickoff;
    if (elapsed > 3.5 * 60 * 60 * 1000) return { status: 'FINAL' };
    return { status: 'LIVE', liveClock: 'In Progress' };
  }
  if (kickoff && now - kickoff > 4 * 60 * 60 * 1000) return { status: 'FINAL' };
  return { status: 'LIVE', liveClock: 'In Progress' };
}

function normalize(raw: RawCfbdGame[]): NormalizedGame[] {
  const now = Date.now();
  return raw.map(g => {
    const { status, liveClock } = deriveStatus(g, now);
    const date = g.start_date ? new Date(g.start_date).toISOString().slice(0,10) : new Date().toISOString().slice(0,10);
    return {
      id: `${date}_${g.away_team.replace(/[^A-Za-z0-9]/g,'')}_${g.home_team.replace(/[^A-Za-z0-9]/g,'')}`.toLowerCase(),
      rawId: g.id,
      date,
      kickoffISO: g.start_date || '',
      kickoffET: toEasternTime(g.start_date),
      status,
      liveClock,
      home: { team: g.home_team, score: g.home_points ?? null },
      away: { team: g.away_team, score: g.away_points ?? null },
      venue: g.venue,
      network: g.tv || null,
      notes: g.neutral_site ? 'Neutral Site' : undefined
    } as NormalizedGame;
  });
}

async function fetchCfbdGames(date: string): Promise<RawCfbdGame[] | null> {
  const apiKey = process.env.CFBD_API_KEY;
  if (!apiKey) return null;
  // Derive year/week using date (simplified: year only). Provide date-based filter if available.
  const year = new Date(date).getFullYear();
  // Use explicit week if user sets CFBD_WEEK else rely on date filter (some CFBD accounts require week param)
  const week = process.env.CFBD_WEEK;
  const base = 'https://api.collegefootballdata.com/games';
  const params = week ? `year=${year}&week=${week}&seasonType=regular&division=fbs` : `year=${year}&seasonType=regular&division=fbs`;
  const url = `${base}?${params}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 500); // 500ms budget for demo reliability
  try {
    const res = await fetch(url, { 
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!res.ok) {
      console.warn('CFBD request failed', res.status, res.statusText);
      return null;
    }
    const data = await res.json();
    if (!Array.isArray(data)) return null;
    // Filter precisely by date (local conversion)
    return data.filter((g: RawCfbdGame) => g.start_date && g.start_date.startsWith(date));
  } catch (e) {
    clearTimeout(timeout);
    console.warn('CFBD fetch error', (e as Error).message);
    return null;
  }
}

export async function getScheduleForDate(date: string): Promise<{ games: NormalizedGame[]; source: 'network' | 'cache' | 'empty' }>{
  // 1. Try network (fast)
  const network = await fetchCfbdGames(date);
  if (network && network.length) {
    const normalized = normalize(network);
    writeCache(date, normalized);
    return { games: normalized, source: 'network' };
  }
  // 2. Fallback cache
  const cached = await readCachedSchedule(date);
  if (cached) return { games: cached, source: 'cache' };
  // 3. Empty
  return { games: [], source: 'empty' };
}
