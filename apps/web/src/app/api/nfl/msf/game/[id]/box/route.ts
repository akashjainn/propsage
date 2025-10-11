import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const url = new URL(`/nfl/msf/game/${encodeURIComponent(params.id)}/box`, API_BASE)
    const r = await fetch(url.toString(), { cache: 'no-store' })
    if (!r.ok) return NextResponse.json({ error: `Upstream ${r.status}` }, { status: r.status })
    return NextResponse.json(await r.json())
  } catch (e:any) {
    return NextResponse.json({ error: e.message || 'failed' }, { status: 500 })
  }
}
