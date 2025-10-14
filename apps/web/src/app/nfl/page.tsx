import React from 'react';
import Link from 'next/link';
import { AppShell, SectionHeader } from '@/ui';
import NFLClient from './NFLClient';
import { todayNY } from '@/lib/source';

export const dynamic = 'force-dynamic';

export default async function NFLPage() {
  const week = 5;
  const date = todayNY();
  // Fetch unified games (SportsDataIO if live, else demo fallback)
  const res = await fetch(`${process.env.NEXT_PUBLIC_WEB_BASE_URL ?? ''}/api/nfl/unified?date=${date}`, { cache: 'no-store' }).catch(() => null);
  const unified = res && res.ok ? await res.json() : { games: [], source: 'none' };
  const gamesForRail = (unified.games || []).map((g: any) => ({
    id: String(g.id),
    start: g.date,
    state: g.status === 'InProgress' ? 'in' : (g.status === 'Final' ? 'post' : 'pre'),
    home: { id: g.homeTeam, name: g.homeTeam, short: g.homeTeam, abbrev: g.homeTeam },
    away: { id: g.awayTeam, name: g.awayTeam, short: g.awayTeam, abbrev: g.awayTeam },
    venue: undefined,
  }));

  return (
    <AppShell>
      <section className="mb-8">
        <SectionHeader
          title={`NFL — ${date}`}
          subtitle="Live schedules, games, and props via SportsDataIO (falls back to demo if unavailable)"
          action={<Link href={`/nfl/msf?week=${week}`} className="text-sm text-white/80 hover:text-white">MSF live →</Link>}
        />
        <NFLClient games={gamesForRail as any} />
      </section>
    </AppShell>
  );
}
