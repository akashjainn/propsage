import React from 'react';
import Link from 'next/link';
import { AppShell, SectionHeader } from '@/ui';
import { loadNFLGames, loadNFLProps, filterPropsForWeek } from './demo-data';
import NFLClient from './NFLClient';

export const dynamic = 'force-dynamic';

export default function NFLPage() {
  const week = 5;
  const demo = true;

  // Load data directly from demo files to avoid API dependency issues
  const allGames = loadNFLGames();
  const allProps = loadNFLProps();
  const weekProps = filterPropsForWeek(allProps, allGames);

  // Transform games to GameLite for GamesRail
  const gamesForRail = allGames.map((g) => ({
    id: g.id,
    start: g.date,
    state: 'pre' as const,
    home: { id: g.home.id, name: g.home.name, short: g.home.name, abbrev: g.home.abbreviation },
    away: { id: g.away.id, name: g.away.name, short: g.away.name, abbrev: g.away.abbreviation },
    venue: { name: g.venue },
  }));
  const byTeamEntries = Array.from(
    weekProps.reduce((m: Map<string, any[]>, p: any) => {
      const arr = m.get(p.team) || [];
      arr.push(p);
      m.set(p.team, arr);
      return m;
    }, new Map<string, any[]>()).entries()
  );

  return (
    <AppShell>
      <section className="mb-8">
        <SectionHeader
          title={`NFL Week ${week}`}
          subtitle="Props and games presented in the same visual style as the homepage"
          action={<Link href={`/nfl/msf?week=${week}`} className="text-sm text-white/80 hover:text-white">Live view →</Link>}
        />
        <NFLClient games={gamesForRail as any} byTeamEntries={byTeamEntries} week={week} />
      </section>
    </AppShell>
  );
}
