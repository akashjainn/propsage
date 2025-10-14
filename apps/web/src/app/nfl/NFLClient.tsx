"use client";
import React from 'react';
import GamesRail from '@/components/GamesRail';
import PropCard from '@/components/PropCard';
import { SectionHeader } from '@/ui';

interface NFLClientProps { games: any[] }

export default function NFLClient({ games }: NFLClientProps) {
  const [selectedGameId, setSelectedGameId] = React.useState<string>(games[0]?.id ?? '');
  const [loading, setLoading] = React.useState(false);
  const [propsList, setPropsList] = React.useState<any[]>([]);

  // Load props for selected game
  React.useEffect(() => {
    if (!selectedGameId) return;
    setLoading(true);
    setPropsList([]);
    fetch(`/api/nfl/unified/props/${encodeURIComponent(selectedGameId)}`, { cache: 'no-store' })
      .then(r => r.ok ? r.json() : Promise.reject(new Error(String(r.status))))
      .then(data => setPropsList(data.props || []))
      .catch(() => setPropsList([]))
      .finally(() => setLoading(false));
  }, [selectedGameId]);

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
                id: p.id || `${p.gameId}:${p.playerId}:${p.market}:${p.book}`,
                playerName: p.player || p.playerName,
                team: p.team,
                stat: p.market,
                marketLine: p.line ?? p.marketLine,
                fairLine: p.fairLine ?? null,
                book: p.book,
              }}
            />
          ))}
        </div>
      </section>
    </>
  );
}
