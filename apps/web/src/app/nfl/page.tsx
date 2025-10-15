import React from 'react';
import Link from 'next/link';
import { AppShell, SectionHeader } from '@/ui';
import NFLClient from './NFLClient';
import { todayNY } from '@/lib/source';
import { fetchNFLProps, fetchClipsForWeek } from "@/lib/nfl";
import { getNFLContext } from "@/lib/nflConfig";
import { DataBoundary } from "@/components/DataBoundary";
import { matchClipsToProps } from "@/lib/clipPropMatch";
import NFLPropCard from "@/components/NFLPropCard";
import { logger } from "@/utils/logger";

export const dynamic = 'force-dynamic';
export const revalidate = 60; // ISR for 1 minute

export default async function NFLPage() {
  const { season, week } = getNFLContext();
  const date = todayNY();
  
  // Fetch props and clips in parallel
  const [propsResult, clipsResult] = await Promise.all([
    fetchNFLProps(),
    fetchClipsForWeek()
  ]);
  
  const { data: props, status: propStatus, error: propError } = propsResult;
  const { data: clips, status: clipStatus, error: clipError } = clipsResult;

  let matched: Array<{ prop: any; clip?: any }> = [];
  try {
    matched = matchClipsToProps(clips ?? [], props ?? []);
  } catch (e) {
    logger.error("clip-prop-match-failed", { e });
  }

  const unmatchedCount = (props?.length ?? 0) - matched.filter(m => m.clip).length;
  
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
          subtitle={`Season: ${season} · Week: ${week}`}
          action={<Link href={`/nfl/msf?week=${week}`} className="text-sm text-white/80 hover:text-white">MSF live →</Link>}
        />
        <NFLClient games={gamesForRail as any} />
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
  <h2 className="text-2xl font-semibold tracking-tight mb-1">NFL Props</h2>
  <p className="text-sm text-gray-500 mb-4">Season: <span className="font-medium">{season}</span> · Week: <span className="font-medium">{week}</span></p>
        <DataBoundary
          status={propStatus === "ok" ? "success" : propStatus}
          error={propError ?? clipError}
          empty={!(props && props.length)}
        >
          {unmatchedCount > 0 && process.env.NODE_ENV === 'development' ? (
            <div className="mb-4 rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm">
              {unmatchedCount} props couldn't be matched to clips (dev note).
            </div>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(matched.length ? matched : (props ?? []).map(p => ({ prop: p, clip: undefined }))).map((row) => (
              <NFLPropCard key={row.prop.id} prop={row.prop} clip={row.clip} />
            ))}
          </div>
        </DataBoundary>
      </section>
    </AppShell>
  );
}
