import React from 'react'

export const dynamic = 'force-dynamic'

async function j<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Failed: ${res.status}`)
  return res.json()
}

export default async function NFLMSFGamePage({ params, searchParams }: { params: { id: string }, searchParams: Record<string, string> }) {
  const id = params.id
  const week = Number(searchParams.week || '5')
  const [box, pbp] = await Promise.all([
    j<any>(`/api/nfl/msf/game/${encodeURIComponent(id)}/box`),
    j<any>(`/api/nfl/msf/game/${encodeURIComponent(id)}/pbp`),
  ])

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Game {id} (Week {week})</h1>

      <section>
        <h2 className="text-xl font-semibold mb-2">Box Score (Players)</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="px-2 py-1">Player</th>
                <th className="px-2 py-1">Team</th>
                <th className="px-2 py-1">Pos</th>
                <th className="px-2 py-1">PassYds</th>
                <th className="px-2 py-1">RushYds</th>
                <th className="px-2 py-1">RecYds</th>
                <th className="px-2 py-1">TD</th>
                <th className="px-2 py-1">INT</th>
              </tr>
            </thead>
            <tbody>
              {(box.players || []).slice(0, 200).map((p: any) => (
                <tr key={p.id} className="border-t">
                  <td className="px-2 py-1">{p.name}</td>
                  <td className="px-2 py-1">{p.team}</td>
                  <td className="px-2 py-1">{p.pos}</td>
                  <td className="px-2 py-1">{p.stats?.passYds ?? ''}</td>
                  <td className="px-2 py-1">{p.stats?.rushYds ?? ''}</td>
                  <td className="px-2 py-1">{p.stats?.recYds ?? ''}</td>
                  <td className="px-2 py-1">{p.stats?.td ?? ''}</td>
                  <td className="px-2 py-1">{p.stats?.ints ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Play-by-Play</h2>
        <ul className="space-y-1 text-sm">
          {(pbp.events || []).map((e: any) => (
            <li key={e.eid} className="border rounded p-2">
              <div className="text-gray-600">Q{e.quarter} {e.clock} · {e.down ? `${e.down}&${e.distance}` : ''}</div>
              <div>{e.desc}</div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
