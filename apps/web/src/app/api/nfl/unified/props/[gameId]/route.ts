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
    const r = await fetch(`${base}/nfl/props?week=5&demo=1`, { signal: AbortSignal.timeout(6000) })
    if (r.ok) {
      const data = await r.json()
      // demo format may not include gameId; return raw
      return NextResponse.json({ gameId: gameIdRaw, props: data.props || [], source: 'demo' })
    }
  } catch {}

  return NextResponse.json({ gameId: gameIdRaw, props: [], source: 'none' })
}
