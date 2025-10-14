"use client";
import React from 'react';
import GamesRail from '@/components/GamesRail';
import PropCard from '@/components/PropCard';
import { SectionHeader } from '@/ui';

interface NFLClientProps {
  games: any[];
  byTeamEntries: [string, any[]][];
  week: number;
}

export default function NFLClient({ games, byTeamEntries, week }: NFLClientProps) {
  const [selectedGameId, setSelectedGameId] = React.useState<string>(games[0]?.id ?? '');

  return (
    <>
      <GamesRail
        games={games as any}
        selectedGameId={selectedGameId}
        onGameSelect={setSelectedGameId}
      />

      <section className="space-y-4 mt-8">
        <SectionHeader title="Props" subtitle="Filtered to teams playing this week" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {byTeamEntries.map(([team, list]) => (
            <div key={team} className="space-y-3">
              <div className="text-sm font-semibold text-white/80">{team}</div>
              {(list as any[]).map((p) => (
                <PropCard
                  key={p.propId}
                  item={{
                    id: p.propId,
                    playerName: p.playerName,
                    team: p.team,
                    stat: p.stat,
                    marketLine: p.marketLine,
                    fairLine: p.fairLine ?? null,
                    book: p.book,
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
