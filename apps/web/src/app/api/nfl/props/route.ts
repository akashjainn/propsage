import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export async function GET(req: NextRequest) {
  try {
    const url = new URL('/nfl/props', API_BASE)
    req.nextUrl.searchParams.forEach((v, k) => url.searchParams.set(k, v))
    if (!url.searchParams.has('week')) url.searchParams.set('week', '5')
    if (!url.searchParams.has('demo')) url.searchParams.set('demo', '1')
    const r = await fetch(url.toString())
    if (!r.ok) return NextResponse.json({ error: `Upstream ${r.status}` }, { status: r.status })
    const data = await r.json()
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 })
  }
}
