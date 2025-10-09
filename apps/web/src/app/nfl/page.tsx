import React from 'react'

async function fetchJson<T>(path: string): Promise<T> {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
  const res = await fetch(`${base}${path}`, { next: { revalidate: 60 } })
  if (!res.ok) throw new Error(`Failed: ${res.status}`)
  return res.json()
}

export default async function NFLPage() {
  const week = 5
  const demo = true
  const [games, props] = await Promise.all([
    fetchJson<any>(`/nfl/games?week=${week}&demo=${demo ? '1' : '0'}`),
    fetchJson<any>(`/nfl/props?week=${week}&demo=${demo ? '1' : '0'}`)
  ])

  const byTeam = new Map<string, any[]>()
  for (const p of props.props || []) {
    const arr = byTeam.get(p.team) || []
    arr.push(p)
    byTeam.set(p.team, arr)
  }

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">NFL Week {week}</h1>
      <section>
        <h2 className="text-xl font-semibold mb-2">Games</h2>
        <ul className="space-y-2">
          {(games.games || []).map((g: any) => (
            <li key={g.id} className="border rounded p-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{g.away.abbreviation} @ {g.home.abbreviation}</div>
                <div className="text-sm text-gray-500">{new Date(g.date).toLocaleString()}</div>
              </div>
              <div className="text-sm text-gray-600">{g.venue}</div>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-2">Props (filtered to Week 5 teams)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from(byTeam.entries()).map(([team, list]) => (
            <div key={team} className="border rounded p-3">
              <div className="font-semibold mb-2">{team}</div>
              <ul className="space-y-1">
                {list.map((p: any) => (
                  <li key={p.propId} className="text-sm flex justify-between">
                    <span>{p.playerName} - {p.stat} ({p.book})</span>
                    <span>{p.marketLine}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
