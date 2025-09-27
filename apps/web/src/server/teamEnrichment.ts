import type { GameLite, TeamLite } from '@/types/cfb';
import { resolveTeam } from './teamResolver';

const TEAM_CACHE = new Map<string, Partial<TeamLite>>();

async function enrichTeam(t: TeamLite): Promise<TeamLite> {
  if (t.logo && t.color) return t;
  const key = (t.abbrev || t.short || t.name || '').toUpperCase();
  if (TEAM_CACHE.has(key)) {
    return { ...t, ...TEAM_CACHE.get(key)! } as TeamLite;
  }
  try {
    const resolved = await resolveTeam(t.abbrev || t.short || t.name);
    if (resolved) {
      const patch: Partial<TeamLite> = {
        logo: t.logo || resolved.logo,
        color: t.color || resolved.color,
      };
      TEAM_CACHE.set(key, patch);
      return { ...t, ...patch } as TeamLite;
    }
  } catch { /* swallow */ }
  return t;
}

export async function enrichGame(g: GameLite): Promise<GameLite> {
  const [home, away] = await Promise.all([enrichTeam(g.home), enrichTeam(g.away)]);
  return { ...g, home, away };
}

export async function enrichGames(games: GameLite[]): Promise<GameLite[]> {
  return Promise.all(games.map(enrichGame));
}
