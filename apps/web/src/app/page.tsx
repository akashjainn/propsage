"use client"
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SearchBar } from '@/components/SearchBar'
import { LineCompareCard } from '@/components/LineCompareCard'
import { MarketsTable, MarketRow } from '@/components/MarketsTable'
import { VideoPanel, Clip } from '@/components/VideoPanel'
import { API_BASE } from '@/lib/api'

interface MarketsResponse { player:{ id:string; name:string }; markets:MarketRow[]; best?: any }

function Stat({label,value}:{label:string;value:string}) {
  return (
    <div>
      <div className="text-xs text-[var(--fg-dim)]">{label}</div>
      <div className="text-3xl font-semibold tabular-nums lining-nums">{value}</div>
    </div>
  );
}

function ClipCard({title,time,snippet}:{title:string;time:string;snippet:string}) {
  return (
    <div className="rounded-xl bg-black/20 ring-1 ring-white/10 p-3">
      <div className="text-[var(--fg)] font-medium">{title}</div>
      <div className="text-xs text-[var(--fg-dim)]">{time}</div>
      <p className="mt-2 text-sm text-[var(--fg)]/90">{snippet}</p>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter()
  const [player, setPlayer] = useState<{id:string; name:string}|null>(null)
  const [markets, setMarkets] = useState<MarketRow[]>([])
  const [best, setBest] = useState<any>(null)
  const [clips, setClips] = useState<Clip[]>([])
  const [loadingClips, setLoadingClips] = useState(false)

  function handleSearch(_sport:string, q:string){
    if(!q) return
    fetch(`${API_BASE}/players?q=${encodeURIComponent(q)}`)
      .then(r=>r.json())
      .then(d=>{
        if (d.players?.length) {
          const pl = d.players[0];
          router.push(`/player/${pl.id}?market=points`)
        }
      })
  }

  // If home page after navigation might have state - do nothing else

  useEffect(()=>{
    // Nothing to load until search
  },[])

  return (
    <div className="relative min-h-screen body-bg text-[var(--fg)]">
      <div className="bg-grid" />

      {/* Header */}
      <header className="mx-auto max-w-6xl px-6 pt-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-[var(--iris)]/80 ring-2 ring-[var(--ring)]/40 shadow-[0_0_30px_rgba(108,92,231,.45)]" />
          <h1 className="text-2xl font-semibold tracking-tight">PropSage</h1>
        </div>
        <span className="text-sm text-[var(--fg-dim)]">Market • Video Intelligence</span>
      </header>

      {/* Hero Search */}
      <section className="mx-auto max-w-6xl px-6 pt-10">
        <div className="rounded-2xl bg-[var(--surface)]/80 backdrop-blur-xl ring-1 ring-[var(--stroke)] p-3 shadow-[0_10px_50px_rgba(0,0,0,.35)]">
          <div className="flex flex-wrap items-center gap-3">
            <SearchBar onSearch={handleSearch} />
          </div>
          <p className="px-1 pt-2 text-sm text-[var(--fg-dim)]">
            Search a player to view <span className="text-[var(--mint)]">market vs fair line</span> edges and
            watch <span className="text-[var(--amber)]">video moments</span>.
          </p>
        </div>
      </section>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left placeholder panel */}
        <section className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl bg-[var(--surface)]/80 ring-1 ring-[var(--stroke)] p-5">
            <div className="text-sm text-[var(--fg-dim)]">Best Market • DraftKings</div>
            <div className="mt-2 flex items-end gap-6">
              <Stat label="Market" value="27.5" />
              <Stat label="Fair" value="25.9" />
              <div className="ml-auto text-right">
                <div className="text-xs text-[var(--fg-dim)]">Edge</div>
                <div className="text-3xl font-semibold tabular-nums lining-nums text-[var(--mint)]">
                  +6.2%
                </div>
              </div>
            </div>
            <div className="mt-4 h-20 rounded-md bg-black/20 ring-1 ring-white/5" />
          </div>

          <div className="rounded-2xl bg-[var(--surface)]/80 ring-1 ring-[var(--stroke)]">
            <div className="grid grid-cols-4 gap-3 px-5 py-3 text-xs text-[var(--fg-dim)]">
              <div>Book</div><div>Market</div><div>Fair</div><div className="text-right">Edge</div>
            </div>
            <div className="divide-y divide-white/5">
              {[
                {book:'DK', m:'27.5', f:'25.9', e:'+6.2%'},
                {book:'FD', m:'26.5', f:'25.9', e:'+2.3%'},
              ].map((r,i)=>(
                <div key={i} className="grid grid-cols-4 items-center px-5 py-3 hover:bg-white/5">
                  <div className="text-[var(--fg)]">{r.book}</div>
                  <div className="tabular-nums">{r.m}</div>
                  <div className="tabular-nums text-[var(--fg-dim)]">{r.f}</div>
                  <div className="text-right tabular-nums text-[var(--mint)]">{r.e}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Right: video panel */}
        <aside className="space-y-6">
          <div className="rounded-2xl bg-[var(--surface)]/80 ring-1 ring-[var(--stroke)] p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Video Intelligence</h3>
              <span className="text-xs px-2 py-1 rounded-full bg-[var(--mint)]/15 text-[var(--mint)] ring-1 ring-[var(--mint)]/30">Live</span>
            </div>
            <div className="mt-3 flex gap-2">
              <input
                placeholder='e.g., "injury scare", "clutch threes"'
                className="w-full rounded-lg bg-[var(--card)] text-[var(--fg)]
                           placeholder-[var(--muted)] border border-white/10 px-3 py-2
                           focus:ring-2 focus:ring-[var(--iris)]"
              />
              <button className="rounded-lg px-3 bg-[var(--iris)]/90 hover:bg-[var(--iris)] transition">Go</button>
            </div>

            <div className="mt-4 space-y-3">
              <ClipCard title="Injury • Anthony Edwards" time="2:00–2:15"
                        snippet="Limping after collision; walks off under own power." />
            </div>
          </div>
        </aside>
      </main>
    </div>
  )
}
