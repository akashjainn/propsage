import React from 'react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function j<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Failed: ${res.status}`)
  return res.json()
}

export default async function NFLMSFWeekPage({ searchParams }: { searchParams: Record<string, string> }) {
  const week = Number(searchParams.week || '5')
  const data = await j<any>(`/api/nfl/msf/week/${week}/games`)

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">NFL (MSF) Week {week}</h1>
      <ul className="space-y-2">
        {(data.games || []).map((g: any) => (
          <li key={g.id} className="border rounded">
            <Link href={`/nfl/msf/game/${encodeURIComponent(g.id)}?week=${week}`} className="p-3 flex items-center justify-between hover:bg-gray-50 block">
              <div>
                <div className="font-medium">{g.away?.abbr} @ {g.home?.abbr}</div>
                <div className="text-sm text-gray-500">{g.startTime ? new Date(g.startTime).toLocaleString() : ''} {g.venue ? `· ${g.venue}` : ''}</div>
              </div>
              <div className="text-sm text-gray-600">{g.status} {g.quarter ? `Q${g.quarter}` : ''} {g.clock || ''} {g.score ? `· ${g.score.away}-${g.score.home}` : ''}</div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
