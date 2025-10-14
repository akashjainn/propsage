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
    <AppShell>
      <SectionHeader
        title={`${player?.fullName || 'Player'} ${player?.position ? `(${player.position})` : ''} · ${player?.teamAbbr ?? ''}`}
        subtitle={<span className="text-white/70 text-sm">NFL / Player</span> as any}
        action={<Link href={`/nfl?week=${week}`} className="text-sm text-white/80 hover:text-white">Back to Week {week}</Link>}
      />

      <section>
        <SectionHeader title="Props" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {props.map((p: any) => (
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

      <section className="mt-8">
        <SectionHeader title="Evidence Clips" />
        {clips.length === 0 && <div className="text-sm text-white/60">No clips available.</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clips.map((c: any) => (
            <a key={c.id} href={c.url} target="_blank" className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm hover:bg-white/10 transition-colors">
              <div className="font-medium text-white">{c.title || 'Clip'}</div>
              <div className="text-xs text-white/60">{c.duration ? `${Math.round(c.duration)}s` : ''} {c.tags?.length ? `· ${c.tags.join(', ')}` : ''}</div>
            </a>
          ))}
        </div>
      </section>
    </AppShell>
  )
}
