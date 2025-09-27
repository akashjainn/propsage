import { NextResponse } from 'next/server';
import { fetchEspnScoreboard, mapEspnEventToGame } from '@/server/providers/espnScoreboard';
import { enrichGames } from '@/server/teamEnrichment';

export async function GET() {
  try {
    const iso = new Date().toISOString();
    const data = await fetchEspnScoreboard(iso);
    const events = Array.isArray(data?.events) ? data.events : [];
    const dedup = new Map<string, any>();
    for (const e of events) {
      if (!e?.id) continue;
      if (!dedup.has(e.id)) dedup.set(e.id, e);
    }
  const gamesRaw = Array.from(dedup.values()).map(mapEspnEventToGame);
  const games = await enrichGames(gamesRaw);
  return NextResponse.json(games, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'failed' }, { status: 500 });
  }
}