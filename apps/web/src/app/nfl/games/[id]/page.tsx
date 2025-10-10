import React from 'react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function j<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Failed: ${res.status}`)
  return res.json()
}

export default async function NFLGamePage({ params, searchParams }: { params: { id: string }, searchParams: Record<string, string> }) {
  const week = Number(searchParams.week || '5')
  const demo = searchParams.demo !== '0'
  const id = params.id

  const [{ game }, playersRes, propsRes] = await Promise.all([
    j<any>(`/api/nfl/games/${encodeURIComponent(id)}?week=${week}&demo=${demo ? '1' : '0'}`),
    j<any>(`/api/nfl/players?week=${week}&demo=${demo ? '1' : '0'}`),
    j<any>(`/api/nfl/props?week=${week}&demo=${demo ? '1' : '0'}`)
  ])

  const homeAbbr = game?.home?.abbreviation
  const awayAbbr = game?.away?.abbreviation
  const homePlayers = (playersRes.players || []).filter((p: any) => p.teamAbbr === homeAbbr)
  const awayPlayers = (playersRes.players || []).filter((p: any) => p.teamAbbr === awayAbbr)
  const relevantProps = (propsRes.props || []).filter((p: any) => p.team === homeAbbr || p.team === awayAbbr)

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">{awayAbbr} @ {homeAbbr}</h1>
        <div className="text-sm text-gray-500">{new Date(game.date).toLocaleString()} · {game.venue}</div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="font-semibold mb-2">{homeAbbr} Roster</h2>
          <ul className="space-y-1">
            {homePlayers.map((p: any) => (
              <li key={p.id} className="text-sm">
                <Link href={`/nfl/players/${encodeURIComponent(p.id)}?week=${week}&demo=${demo ? '1' : '0'}`} className="hover:underline">
                  {p.fullName} {p.position ? `(${p.position})` : ''}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-semibold mb-2">{awayAbbr} Roster</h2>
          <ul className="space-y-1">
            {awayPlayers.map((p: any) => (
              <li key={p.id} className="text-sm">
                <Link href={`/nfl/players/${encodeURIComponent(p.id)}?week=${week}&demo=${demo ? '1' : '0'}`} className="hover:underline">
                  {p.fullName} {p.position ? `(${p.position})` : ''}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <h2 className="font-semibold mb-2">Props</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {relevantProps.map((p: any) => (
            <div key={p.propId} className="border rounded p-3 text-sm flex justify-between">
              <span>{p.team} · {p.playerName} · {p.stat} ({p.book})</span>
              <span>{p.marketLine}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
