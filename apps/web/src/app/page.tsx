"use client"
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SearchBar } from '@/components/SearchBar'
import { LineCompareCard } from '@/components/LineCompareCard'
import { MarketsTable, MarketRow } from '@/components/MarketsTable'
import { VideoPanel, Clip } from '@/components/VideoPanel'
import { API_BASE } from '@/lib/api'
import { useVideoClips } from '@/lib/useVideoClips'
import { usePlayerSearch } from '@/lib/usePlayerSearch'
import { useNbaProps, PropData } from '@/lib/useNbaProps'

interface MarketsResponse { player:{ id:string; name:string }; markets:MarketRow[]; best?: any }

function Stat({label,value}:{label:string;value:string}) {
  return (
    <div>
      <div className="text-xs text-[var(--fg-dim)]">{label}</div>
      <div className="text-3xl font-semibold tabular-nums lining-nums">{value}</div>
    </div>
  );
}

function VideoSearchForm({onSearch, loading}:{onSearch:(q:string)=>void; loading:boolean}) {
  const [q, setQ] = React.useState('');
  return (
    <div className="mt-3 flex gap-2">
      <input
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder='e.g., "injury scare", "clutch threes"'
        className="w-full rounded-lg bg-[var(--card)] text-[var(--fg)]
                   placeholder-[var(--muted)] border border-white/10 px-3 py-2
                   focus:ring-2 focus:ring-[var(--iris)] focus:outline-none"
        onKeyDown={e => e.key === 'Enter' && !loading && onSearch(q)}
      />
      <button
        onClick={() => onSearch(q)}
        disabled={loading}
        className="rounded-lg px-3 py-2 bg-[var(--iris)]/90 hover:bg-[var(--iris)] transition disabled:opacity-50"
      >
        {loading ? 'Searching...' : 'Go'}
      </button>
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
  const [searchQuery, setSearchQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)
  const [selectedPropId, setSelectedPropId] = useState<string | null>(null)
  const { loading: loadingClips, clips, search: searchVideos } = useVideoClips()
  const { q: playerQuery, setQ: setPlayerQuery, loading: loadingPlayers, results: playerResults } = usePlayerSearch()
  const { loading: loadingProps, data: propsData } = useNbaProps(selectedPlayerId)

  function handleSearch(_sport:string, q:string){
    if(!q) return
    setPlayerQuery(q)
    setSearchQuery(q)
    setShowResults(true)
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

      {/* Search Results */}
      {showResults && (
        <section className="mx-auto max-w-6xl px-6">
          <div className="rounded-2xl bg-[var(--surface)]/80 ring-1 ring-[var(--stroke)] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Search Results for "{searchQuery}"</h2>
              <button 
                onClick={() => setShowResults(false)}
                className="text-[var(--fg-dim)] hover:text-[var(--fg)] text-sm"
              >
                Clear
              </button>
            </div>
            
            {loadingPlayers ? (
              <div className="text-[var(--fg-dim)] text-sm animate-pulse">Searching players...</div>
            ) : playerResults.length === 0 ? (
              <div className="text-[var(--fg-dim)] text-sm">No players found. Try a different search term.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {playerResults.map(player => (
                  <div 
                    key={player.id} 
                    className="rounded-xl bg-[var(--card)] ring-1 ring-white/10 p-4 hover:bg-white/5 cursor-pointer transition"
                    onClick={() => {
                      setSelectedPlayerId(player.id)
                      setShowResults(false)
                    }}
                  >
                    <div className="font-medium text-[var(--fg)]">{player.name}</div>
                    <div className="text-sm text-[var(--fg-dim)] mt-1">
                      {player.team && <span>{player.team}</span>}
                      {player.position && player.team && <span> • </span>}
                      {player.position && <span>{player.position}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Content */}
      <main className="mx-auto max-w-6xl px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Props panel */}
        <section className="lg:col-span-2 space-y-6">
          {selectedPlayerId && propsData ? (
            <>
              {/* Player header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">{propsData.player.name}</h2>
                  <div className="text-[var(--fg-dim)]">{propsData.player.team}</div>
                </div>
                <button
                  onClick={() => setSelectedPlayerId(null)}
                  className="text-[var(--fg-dim)] hover:text-[var(--fg)] text-sm"
                >
                  ← Back to search
                </button>
              </div>

              {/* Best edge card */}
              {propsData.props.length > 0 && (() => {
                const bestProp = propsData.props.reduce((best, prop) => 
                  Math.abs(prop.edgePct) > Math.abs(best.edgePct) ? prop : best
                );
                return (
                  <div className="rounded-2xl bg-[var(--surface)]/80 ring-1 ring-[var(--stroke)] p-5">
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-[var(--fg-dim)]">Best Edge • {bestProp.book}</div>
                      <span className="text-xs px-2 py-1 rounded-full bg-[var(--amber)]/15 text-[var(--amber)] ring-1 ring-[var(--amber)]/30">
                        {bestProp.stat}
                      </span>
                    </div>
                    <div className="mt-2 flex items-end gap-6">
                      <Stat label="Market" value={bestProp.marketLine.toString()} />
                      <Stat label="Fair" value={bestProp.fairLine.toString()} />
                      <div className="ml-auto text-right">
                        <div className="text-xs text-[var(--fg-dim)]">Edge</div>
                        <div className={`text-3xl font-semibold tabular-nums lining-nums ${
                          bestProp.edgePct > 0 ? 'text-[var(--mint)]' : 'text-[var(--rose)]'
                        }`}>
                          {bestProp.edgePct > 0 ? '+' : ''}{bestProp.edgePct}%
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 h-20 rounded-md bg-black/20 ring-1 ring-white/5 overflow-hidden">
                      <div className="h-full w-full animate-pulse bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                    </div>
                  </div>
                );
              })()}

              {/* Props table */}
              <div className="rounded-2xl bg-[var(--surface)]/80 ring-1 ring-[var(--stroke)]">
                <div className="grid grid-cols-5 gap-3 px-5 py-3 text-xs text-[var(--fg-dim)]">
                  <div>Stat</div><div>Book</div><div>Market</div><div>Fair</div><div className="text-right">Edge</div>
                </div>
                <div className="divide-y divide-white/5">
                  {loadingProps ? (
                    <div className="px-5 py-8 text-center text-[var(--fg-dim)] animate-pulse">
                      Loading props...
                    </div>
                  ) : propsData.props.length === 0 ? (
                    <div className="px-5 py-8 text-center text-[var(--fg-dim)]">
                      No props available for this player.
                    </div>
                  ) : (
                    propsData.props.map((prop) => (
                      <div 
                        key={prop.propId} 
                        className="grid grid-cols-5 items-center px-5 py-3 hover:bg-white/5 cursor-pointer transition"
                        onClick={() => setSelectedPropId(prop.propId)}
                      >
                        <div className="font-medium text-[var(--fg)]">{prop.stat}</div>
                        <div className="text-[var(--fg-dim)]">{prop.book}</div>
                        <div className="tabular-nums">{prop.marketLine}</div>
                        <div className="tabular-nums text-[var(--fg-dim)]">{prop.fairLine}</div>
                        <div className={`text-right tabular-nums ${
                          prop.edgePct > 0 ? 'text-[var(--mint)]' : 'text-[var(--rose)]'
                        }`}>
                          {prop.edgePct > 0 ? '+' : ''}{prop.edgePct}%
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            /* Placeholder content when no player selected */
            <div className="rounded-2xl bg-[var(--surface)]/80 ring-1 ring-[var(--stroke)] p-8 text-center">
              <div className="text-[var(--fg-dim)] mb-4">
                Search for a player above to see their prop lines vs our fair market analysis
              </div>
              <div className="text-sm text-[var(--fg-dim)]">
                • Compare market lines to fair value
              </div>
              <div className="text-sm text-[var(--fg-dim)]">
                • See edge percentages for each prop
              </div>
              <div className="text-sm text-[var(--fg-dim)]">
                • Click props to view relevant clips & analysis
              </div>
            </div>
          )}
        </section>

        {/* Right: video panel */}
        <aside className="space-y-6">
          <div className="rounded-2xl bg-[var(--surface)]/80 ring-1 ring-[var(--stroke)] p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Video Intelligence</h3>
              <span className="text-xs px-2 py-1 rounded-full bg-[var(--mint)]/15 text-[var(--mint)] ring-1 ring-[var(--mint)]/30">Live</span>
            </div>
            <VideoSearchForm onSearch={searchVideos} loading={loadingClips} />

            <div className="mt-4 space-y-3">
              {loadingClips ? (
                <div className="text-[var(--fg-dim)] text-sm animate-pulse">Searching videos...</div>
              ) : clips.length === 0 ? (
                <div className="text-[var(--fg-dim)] text-sm">No clips yet. Try searching for player moments above.</div>
              ) : (
                clips.map((clip, i) => (
                  <ClipCard
                    key={i}
                    title={clip.title}
                    time={`${Math.floor(clip.start/60)}:${String(Math.floor(clip.start%60)).padStart(2,'0')}–${Math.floor(clip.end/60)}:${String(Math.floor(clip.end%60)).padStart(2,'0')}`}
                    snippet={clip.snippet || 'Video clip found'}
                  />
                ))
              )}
            </div>
          </div>
        </aside>
      </main>
    </div>
  )
}
