import React from 'react'
import Link from 'next/link'
import { AppShell, SectionHeader } from '@/ui'
import PropCard from '@/components/PropCard'

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
    <AppShell>
      <SectionHeader
        title={`${awayAbbr} @ ${homeAbbr}`}
        subtitle={`${new Date(game.date).toLocaleString()} · ${game.venue}`}
        action={<Link href={`/nfl?week=${week}`} className="text-sm text-white/80 hover:text-white">Back to Week {week}</Link>}
      />

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-2">{homeAbbr} Roster</h3>
          <ul className="space-y-1">
            {homePlayers.map((p: any) => (
              <li key={p.id} className="text-sm">
                <Link href={`/nfl/players/${encodeURIComponent(p.id)}?week=${week}&demo=${demo ? '1' : '0'}`} className="text-white/80 hover:text-white">
                  {p.fullName} {p.position ? `(${p.position})` : ''}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-2">{awayAbbr} Roster</h3>
          <ul className="space-y-1">
            {awayPlayers.map((p: any) => (
              <li key={p.id} className="text-sm">
                <Link href={`/nfl/players/${encodeURIComponent(p.id)}?week=${week}&demo=${demo ? '1' : '0'}`} className="text-white/80 hover:text-white">
                  {p.fullName} {p.position ? `(${p.position})` : ''}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-8">
        <SectionHeader title="Props" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {relevantProps.map((p: any) => (
            <PropCard
              key={p.propId}
              item={{
                id: p.propId,
                playerName: p.playerName,
                team: p.team,
                stat: p.stat,
                marketLine: p.marketLine,
                fairLine: p.fairLine ?? null,
                book: p.book,
              }}
            />
          ))}
        </div>
      </section>
    </AppShell>
  )
}
