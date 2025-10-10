import React from 'react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function j<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Failed: ${res.status}`)
  return res.json()
}

export default async function NFLPlayerPage({ params, searchParams }: { params: { playerId: string }, searchParams: Record<string, string> }) {
  const week = Number(searchParams.week || '5')
  const demo = searchParams.demo !== '0'
  const playerId = params.playerId

  const [playersRes, propsRes, evidenceRes] = await Promise.all([
    j<any>(`/api/nfl/players?week=${week}&demo=${demo ? '1' : '0'}`),
    j<any>(`/api/nfl/props?week=${week}&demo=${demo ? '1' : '0'}&playerId=${encodeURIComponent(playerId)}`),
    j<any>(`/api/nfl/evidence/player/${encodeURIComponent(playerId)}?week=${week}&demo=${demo ? '1' : '0'}`).catch(() => ({ clips: [] }))
  ])

  const player = (playersRes.players || []).find((p: any) => String(p.id) === String(playerId))
  const props = propsRes.props || []
  const clips = evidenceRes.clips || []

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-8">
      <div>
        <div className="text-sm text-gray-500"><Link href="/nfl">NFL</Link> / Player</div>
        <h1 className="text-2xl font-semibold">{player?.fullName || 'Player'} {player?.position ? `(${player.position})` : ''} · {player?.teamAbbr}</h1>
      </div>

      <section>
        <h2 className="font-semibold mb-2">Props</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {props.map((p: any) => (
            <div key={p.propId} className="border rounded p-3 text-sm flex justify-between">
              <span>{p.team} · {p.playerName} · {p.stat} ({p.book})</span>
              <span>{p.marketLine}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-semibold mb-2">Evidence Clips</h2>
        {clips.length === 0 && <div className="text-sm text-gray-500">No clips available.</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clips.map((c: any) => (
            <a key={c.id} href={c.url} target="_blank" className="border rounded p-3 text-sm hover:bg-gray-50">
              <div className="font-medium">{c.title || 'Clip'}</div>
              <div className="text-xs text-gray-500">{c.duration ? `${Math.round(c.duration)}s` : ''} {c.tags?.length ? `· ${c.tags.join(', ')}` : ''}</div>
            </a>
          ))}
        </div>
      </section>
    </div>
  )
}
