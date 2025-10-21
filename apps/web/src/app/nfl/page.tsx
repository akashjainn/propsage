import React from 'react';
import Link from 'next/link';
import { AppShell, SectionHeader } from '@/ui';
import NFLClient from './NFLClient';
import { fetchNFLProps, fetchClipsForWeek, fetchGamesForWeek } from "@/lib/nfl";
import { getNFLContext } from "@/lib/nflConfig";
import { DataBoundary } from "@/components/DataBoundary";
import { matchClipsToProps } from "@/lib/clipPropMatch";
import NFLPropCard from "@/components/NFLPropCard";
import { logger } from "@/utils/logger";

export const dynamic = 'force-dynamic';
export const revalidate = 60; // ISR for 1 minute

export default async function NFLPage() {
  const { season, week } = getNFLContext();
  const usingFixtures = (process.env.NEXT_PUBLIC_USE_LOCAL_WEEK5 ?? "").toLowerCase() === "true";
  
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
  
  // Fetch Week-5-aware games (fixtures-first)
  const gamesResult = await fetchGamesForWeek();
  const gamesArr = gamesResult.data ?? [];
  const gamesForRail = gamesArr.map((g: any) => ({
    id: String(g.id),
    start: g.kickoff,
    state: g.status === 'InProgress' ? 'in' : (g.status === 'Final' ? 'post' : 'pre'),
    home: { id: g.homeTeam, name: g.homeTeam, short: g.homeTeam, abbrev: g.homeTeam },
    away: { id: g.awayTeam, name: g.awayTeam, short: g.awayTeam, abbrev: g.awayTeam },
    venue: undefined,
  }));

  return (
    <AppShell>
      <section className="mb-8">
        <SectionHeader
          title={`NFL — Week ${week}`}
          subtitle={`Season: ${season} · Week: ${week}`}
          action={<Link href={`/nfl/msf?week=${week}`} className="text-sm text-white/80 hover:text-white">MSF live →</Link>}
        />
        <NFLClient games={gamesForRail as any} />
        {usingFixtures && (
          <div className="mb-4 rounded-md border border-blue-300 bg-blue-50 p-3 text-sm">
            Using local Week 5 fixtures for props/clips/games.
          </div>
        )}
      </section>

      {/* Props are now rendered via NFLClient with live/demo hooks; removing static fallback section to avoid duplication */}
    </AppShell>
  );
}
