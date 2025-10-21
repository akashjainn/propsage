import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

// Map UI market labels to backend evidence prop types
const MARKET_TO_PROP: Record<string, string> = {
  'Passing Yards': 'passing_yards',
  'Passing TDs': 'passing_touchdowns',
  'Passing Attempts': 'passing_attempts',
  'Rushing Yards': 'rushing_yards',
  'Rushing Attempts': 'rushing_attempts',
  'Rushing TDs': 'rushing_touchdowns',
  'Receptions': 'receptions',
  'Receiving Yards': 'receiving_yards',
  'Receiving TDs': 'receiving_touchdowns',
}

function normalizePlayerName(name: string) {
  return name.normalize('NFD').replace(/\.[\s]?/g, '').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

export async function GET(req: NextRequest) {
  try {
    // 1) Get Week 5 props from local proxy (this already falls back to fixtures)
    const url = new URL('/api/nfl/props', req.nextUrl.origin)
    // forward search params (week/season/demo), default to week 5
    req.nextUrl.searchParams.forEach((v, k) => url.searchParams.set(k, v))
    if (!url.searchParams.has('week')) url.searchParams.set('week', '5')
    if (!url.searchParams.has('demo')) url.searchParams.set('demo', '1')

    const propsRes = await fetch(url.toString(), { cache: 'no-store', signal: AbortSignal.timeout(8000) })
    if (!propsRes.ok) {
      return NextResponse.json({ clips: [], note: 'props-fetch-failed' })
    }
    const propsJson = await propsRes.json()
    const props: Array<{ playerName: string; market: string; line?: number; team?: string }> = propsJson.props || propsJson.data || []

    // 2) Build unique player+market set
    const uniqueKeys = new Map<string, { playerName: string; market: string; line?: number; team?: string }>()
    for (const p of props) {
      if (!p?.playerName || !p?.market) continue
      const key = `${normalizePlayerName(p.playerName)}|${p.market}`
      if (!uniqueKeys.has(key)) uniqueKeys.set(key, p)
    }

    // 3) For each unique combo, query backend evidence for top clip
    const clips: any[] = []
    const tasks = Array.from(uniqueKeys.values()).map(async (p) => {
      const propType = MARKET_TO_PROP[p.market] || ''
      if (!propType) return
      try {
        const evidenceUrl = new URL(`/nfl/evidence/props/${encodeURIComponent(propType)}`, API_BASE)
        evidenceUrl.searchParams.set('player', p.playerName)
        evidenceUrl.searchParams.set('limit', '1')
        evidenceUrl.searchParams.set('minScore', '0.65')
        const r = await fetch(evidenceUrl.toString(), { signal: AbortSignal.timeout(8000) })
        if (!r.ok) return
        const data = await r.json()
        const top = (data.evidence || [])[0]
        if (!top) return
        clips.push({
          id: top.id,
          source: 'TwelveLabs',
          playerName: p.playerName,
          market: p.market,
          line: p.line,
          thumbnailUrl: top.context?.thumbnail || undefined,
          playbackUrl: undefined, // Optional: implement TL clip proxy for playback
          createdAt: new Date().toISOString(),
        })
      } catch {}
    })

    await Promise.allSettled(tasks)

    return NextResponse.json({ clips, total: clips.length, week: Number(url.searchParams.get('week') || '5') })
  } catch (e: any) {
    console.error('[for-props] error:', e?.message)
    return NextResponse.json({ clips: [], error: e?.message || 'failed' }, { status: 500 })
  }
}
