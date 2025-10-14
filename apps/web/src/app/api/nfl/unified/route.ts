import { NextRequest, NextResponse } from 'next/server'
import { apiBase } from '@/lib/source'
import { fromSportsDataIOGame } from '@/lib/normalize-nfl'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date') || new Date().toISOString().slice(0,10)

    const base = apiBase()
    // Use SDIO if available; otherwise fallback demo. Server decides availability.
    // We attempt SD first, then fallback to demo if not available
    const sdUrl = `${base}/nfl/sd/scoresByDate?date=${date}`
    const demoUrl = `${base}/nfl/games?date=${date}&demo=1` // existing demo-ish endpoint shape

    let scores: any[] = []
    let oddsByGame: Record<number, any[]> = {}

    // Try SportsDataIO scores/odds
    try {
      const [scoresRes, oddsRes] = await Promise.all([
        fetch(sdUrl, { signal: AbortSignal.timeout(6000) }),
        fetch(`${base}/nfl/sd/oddsByDate?date=${date}`, { signal: AbortSignal.timeout(6000) }).catch(() => ({ ok: false } as any)),
      ])
      if (scoresRes.ok) {
        const sdata = await scoresRes.json()
        scores = sdata.scores || []
        if (oddsRes && (oddsRes as any).ok) {
          const odata = await (oddsRes as any).json()
          // map odds by game id depending on SDIO payload shape
          const by: Record<number, any[]> = {}
          for (const g of odata.games || []) {
            const gid = g.GameId ?? g.GameID
            if (!gid) continue
            if (Array.isArray(g.PregameOdds)) by[gid] = g.PregameOdds
            else if (Array.isArray(g.Odds)) by[gid] = g.Odds
          }
          oddsByGame = by
        }
      }
    } catch {}

    // Fallback to demo
    if (!scores.length) {
      const demoRes = await fetch(demoUrl, { signal: AbortSignal.timeout(6000) }).catch(() => null as any)
      if (demoRes?.ok) {
        const d = await demoRes.json()
        // d.games in demo are already in a simplified shape; just forward
        return NextResponse.json({ date, games: d.games || [], source: 'demo' })
      }
      return NextResponse.json({ date, games: [], source: 'none' })
    }

    // Normalize SDIO payload
    const games = scores.map((g: any) => fromSportsDataIOGame(g, oddsByGame))
    return NextResponse.json({ date, games, source: 'sportsdataio' })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'unified failed' }, { status: 500 })
  }
}
