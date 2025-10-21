import { NextRequest, NextResponse } from 'next/server'
import { apiBase } from '@/lib/source'
import { fromSportsDataIOProp } from '@/lib/normalize-nfl'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { gameId: string } }) {
  const base = apiBase()
  const gameIdRaw = params.gameId
  const gameIdNum = parseInt(gameIdRaw, 10)

  // Try SDIO first
  try {
    if (Number.isFinite(gameIdNum)) {
      const r = await fetch(`${base}/nfl/sd/propsByGame/${gameIdNum}`, { signal: AbortSignal.timeout(8000) })
      if (r.ok) {
        const data = await r.json()
        const props = (data.props || []).map((p: any) => fromSportsDataIOProp(p, gameIdNum))
        return NextResponse.json({ gameId: gameIdRaw, props, source: 'sportsdataio' })
      }
    }
  } catch {}

  // Fallback: try demo props route and filter client-side if available
  try {
    const [propsRes, gamesRes] = await Promise.all([
      fetch(`${base}/nfl/props?week=5&demo=1`, { signal: AbortSignal.timeout(6000) }),
      fetch(`${base}/nfl/games?week=5&demo=1`, { signal: AbortSignal.timeout(6000) })
    ])

    if (propsRes.ok) {
      const data = await propsRes.json()
      let list: any[] = data.props || []

      // If we know the game, filter props by its teams (abbreviation)
      if (gamesRes.ok) {
        const gdata = await gamesRes.json()
        const game = (gdata.games || []).find((g: any) => String(g.id) === String(gameIdRaw))
        const home = game?.home?.abbreviation || game?.home?.alias || game?.homeTeam
        const away = game?.away?.abbreviation || game?.away?.alias || game?.awayTeam
        if (home && away) {
          const set = new Set([String(home).toUpperCase(), String(away).toUpperCase()])
          list = list.filter(p => set.has(String(p.team || '').toUpperCase()))
        }
      }

      return NextResponse.json({ gameId: gameIdRaw, props: list, source: 'demo' })
    }
  } catch {}

  return NextResponse.json({ gameId: gameIdRaw, props: [], source: 'none' })
}
