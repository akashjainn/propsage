import { NextRequest, NextResponse } from 'next/server';
import { fetchEspnScoreboard, mapEspnEventToGame } from '@/server/providers/espnScoreboard';
import { resolveTeam } from '@/server/teamResolver';
import type { GameLite, GameState } from '@/types/cfb';

export async function GET(req: NextRequest) {
  const teamQ = req.nextUrl.searchParams.get('q');
  if (!teamQ) return NextResponse.json({ error: 'missing q' }, { status: 400 });
  try {
    const today = new Date().toISOString();
    const board = await fetchEspnScoreboard(today);
    const events = Array.isArray(board?.events) ? board.events : [];
    const seen = new Map<string, any>();
    for (const e of events) { if (e?.id && !seen.has(e.id)) seen.set(e.id, e); }
    const games: GameLite[] = Array.from(seen.values()).map(mapEspnEventToGame);
    const t = await resolveTeam(teamQ);
    if (!t) return NextResponse.json({ games: [] });
    const lowered = (s?: string) => (s || '').toLowerCase();
    const mine = games.filter(g => [g.home.abbrev, g.home.name, g.home.short, g.away.abbrev, g.away.name, g.away.short]
      .map(lowered).some(s => s.includes(t.abbrev.toLowerCase()) || s.includes(t.short.toLowerCase())));
    const sortByState = (s: GameState) => ({ 'in': 0, 'pre': 1, 'post': 2 }[s] ?? 9);
    mine.sort((a, b) => sortByState(a.state) - sortByState(b.state) || a.start.localeCompare(b.start));
    return NextResponse.json({ games: mine });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'failed', games: [] }, { status: 500 });
  }
}