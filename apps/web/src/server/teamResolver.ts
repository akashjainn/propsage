// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error - fuse.js types may not be installed; using runtime import
import Fuse from 'fuse.js';
import type { TeamLite } from '@/types/cfb';
import { fetchCfbdFbsTeams } from './providers/cfbd';

let TEAM_INDEX: { byAbbrev: Map<string, TeamLite>; fuse?: Fuse<TeamLite> } | null = null;

export async function buildTeamIndex(): Promise<typeof TEAM_INDEX> {
  const cfbdTeams = await fetchCfbdFbsTeams();
  const teams: TeamLite[] = cfbdTeams.map((t: any) => ({
    id: String(t.id ?? t.school),
    name: t.school + (t.mascot ? ` ${t.mascot}` : ''),
    short: t.school,
    abbrev: t.abbreviation,
    logo: t.logos?.[0],
    color: (t.color ?? '').replace('#', ''),
  }));
  const byAbbrev = new Map(teams.map(t => [t.abbrev?.toUpperCase(), t]));
  const fuse = new Fuse(teams, { keys: ['name', 'short', 'abbrev'], threshold: 0.3 });
  TEAM_INDEX = { byAbbrev, fuse };
  return TEAM_INDEX;
}

export async function resolveTeam(q: string): Promise<TeamLite | null> {
  const idx = TEAM_INDEX ?? await buildTeamIndex();
  if (!idx) return null;
  const exact = idx.byAbbrev.get(q.toUpperCase());
  if (exact) return exact;
  const fuse = idx.fuse;
  if (!fuse) return null;
  const m = fuse.search(q)[0]?.item;
  return m ?? null;
}