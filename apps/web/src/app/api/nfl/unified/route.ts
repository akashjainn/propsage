import { NextRequest, NextResponse } from 'next/server'
import { apiBase } from '@/lib/source'
import { fromSportsDataIOGame } from '@/lib/normalize-nfl'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date') || new Date().toISOString().slice(0,10)

  const base = apiBase()
  const sdUrl = `${base}/nfl/sd/scoresByDate?date=${date}`
  const demoUrl = `${base}/nfl/games?date=${date}&demo=1`

  let scores: any[] = []
  let oddsByGame: Record<number, any[]> = {}
  let error: any = null
  let fallbackReason: string | undefined = undefined

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
        const by: Record<number, any[]> = {}
        for (const g of odata.games || []) {
          const gid = g.GameId ?? g.GameID
          if (!gid) continue
          if (Array.isArray(g.PregameOdds)) by[gid] = g.PregameOdds
          else if (Array.isArray(g.Odds)) by[gid] = g.Odds
        }
        oddsByGame = by
      }
    } else {
      fallbackReason = `SDIO scoresRes not ok: ${scoresRes.status}`
      error = await scoresRes.text().catch(() => null)
    }
  } catch (e) {
    fallbackReason = `SDIO fetch error: ${(e as Error).message}`
    error = e
  }

  // Fallback to demo
  if (!scores.length) {
    const demoRes = await fetch(demoUrl, { signal: AbortSignal.timeout(6000) }).catch(() => null as any)
    if (demoRes?.ok) {
      const d = await demoRes.json()
      return NextResponse.json({ date, games: d.games || [], source: 'demo', fallbackReason, error })
    }
    return NextResponse.json({ date, games: [], source: 'none', fallbackReason, error })
  }

  // Normalize SDIO payload
  const games = scores.map((g: any) => fromSportsDataIOGame(g, oddsByGame))
  return NextResponse.json({ date, games, source: 'sportsdataio', fallbackReason, error })
}
