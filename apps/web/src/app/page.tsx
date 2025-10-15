
import React from 'react';
import { fetchGamesForWeek } from '@/lib/nfl';
import { getNFLContext } from '@/lib/nflConfig';

export default async function HomePage() {
  const { season, week } = getNFLContext();
  const { data: games } = await fetchGamesForWeek();
  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <section className="mt-8">
        <h2 className="text-xl font-semibold">Week {week} Games ({season})</h2>
        {!games?.length ? (
          <div className="mt-3 text-gray-500">No games available for Week {week} (fixtures may be minimal).</div>
        ) : (
          <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {games.map(g => (
              <li key={g.id} className="rounded-lg border bg-white p-4">
                <div className="font-medium">{g.awayTeam} @ {g.homeTeam}</div>
                <div className="text-sm text-gray-500">{new Date(g.kickoff).toLocaleString()}</div>
                {"homeScore" in g && "awayScore" in g ? (
                  <div className="mt-1 text-sm">Final: {g.awayScore}–{g.homeScore}</div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}