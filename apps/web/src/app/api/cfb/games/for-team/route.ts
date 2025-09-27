import { NextRequest, NextResponse } from 'next/server';
import { fetchEspnScoreboard, mapEspnEventToGame } from '@/server/providers/espnScoreboard';
import { resolveTeam } from '@/server/teamResolver';
import { enrichGames } from '@/server/teamEnrichment';
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
    const enriched = await enrichGames(games);
    const lowered = (s?: string) => (s || '').toLowerCase();
    const q = teamQ.trim().toLowerCase();
    // Fuzzy include match across home/away identifiers
    const mine = enriched.filter(g => [g.home.name, g.home.short, g.home.abbrev, g.away.name, g.away.short, g.away.abbrev]
      .filter(Boolean)
      .map(lowered)
      .some(s => s.includes(q))
    );
    if (mine.length === 0) {
      // fallback: try resolver-driven abbreviation inclusion if resolver can map
      const t = await resolveTeam(teamQ);
      if (t) {
        const ta = t.abbrev?.toLowerCase();
        const mine2 = enriched.filter(g => [g.home.abbrev, g.away.abbrev].map(lowered).some(s => ta && s === ta));
        if (mine2.length) {
          const sortByState = (s: GameState) => ({ 'in': 0, 'pre': 1, 'post': 2 }[s] ?? 9);
          mine2.sort((a, b) => sortByState(a.state) - sortByState(b.state) || a.start.localeCompare(b.start));
          return NextResponse.json({ games: mine2, debug: 'resolver-abbrev-fallback' });
        }
      }
      return NextResponse.json({ games: [], debug: 'no match for query' });
    }
    const sortByState = (s: GameState) => ({ 'in': 0, 'pre': 1, 'post': 2 }[s] ?? 9);
    mine.sort((a, b) => sortByState(a.state) - sortByState(b.state) || a.start.localeCompare(b.start));
    return NextResponse.json({ games: mine });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'failed', games: [] }, { status: 500 });
  }
}