"use client";
import React from 'react';
import GamesRail from '@/components/GamesRail';
import PropCard from '@/components/PropCard';
import { SectionHeader } from '@/ui';
import { useNflProps } from '@/hooks/useNFL';

interface NFLClientProps { games: any[] }

export default function NFLClient({ games }: NFLClientProps) {
  const [selectedGameId, setSelectedGameId] = React.useState<string>(games[0]?.id ?? '');
  const demo = (process.env.NEXT_PUBLIC_DEMO_MODE ?? 'false').toLowerCase() === 'true';
  const { data: propsData, isLoading: loading } = useNflProps(selectedGameId || undefined, demo);
  const propsList = propsData?.props || [];

  return (
    <>
      <GamesRail
        games={games as any}
        selectedGameId={selectedGameId}
        onGameSelect={setSelectedGameId}
      />

      <section className="space-y-4 mt-8">
        <SectionHeader title="Props" subtitle={loading ? 'Loading…' : propsList.length ? undefined : 'No props available'} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {propsList.map((p: any) => (
            <PropCard
              key={p.id || `${p.gameId}:${p.playerId}:${p.market}:${p.book}`}
              item={{
                id: p.id || `${p.gameId || p.nflGameId}:${p.playerId || ''}:${(p.market && (p.market.key || p.market)) || ''}:${(p.book && (p.book.name || p.book)) || ''}`,
                playerName: (p.player && p.player.name) || p.playerName || p.player || 'Unknown',
                team: (p.player && p.player.teamAbbr) || p.team,
                stat: (p.market && (p.market.name || p.market.key)) || p.market,
                marketLine: p.line ?? p.marketLine,
                fairLine: p.fairLine ?? null,
                book: (p.book && (p.book.name || p.book)) || undefined,
              }}
            />
          ))}
        </div>
      </section>
    </>
  );
}
