import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export async function GET(req: NextRequest) {
  // Proxy to API /nfl/sd endpoints depending on path and query
  try {
    const u = new URL(req.url)
    const subpath = u.pathname.replace(/^.*\/api\/nfl\/sd/, '') || '/health'
    const url = new URL(`/nfl/sd${subpath}`, API_BASE)
    u.searchParams.forEach((v, k) => url.searchParams.set(k, v))
    const r = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) })
    const body = await r.text()
    return new NextResponse(body, { status: r.status, headers: { 'content-type': r.headers.get('content-type') || 'application/json' } })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 })
  }
}
