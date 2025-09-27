"use client"
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SearchBar } from '@/components/SearchBar'
import { LineCompareCard } from '@/components/LineCompareCard'
import { MarketsTable, MarketRow } from '@/components/MarketsTable'
import { VideoPanel, Clip } from '@/components/VideoPanel'
import { API_BASE } from '@/lib/api'
import { useVideoClips } from '@/lib/useVideoClips'
import { useCfbPlayerSearch } from '@/lib/useCfbPlayerSearch'
import { useCfbProps } from '@/lib/useCfbProps'
import { useNflPlayerSearch } from '@/lib/useNflPlayerSearch'
import { useNflProps } from '@/lib/useNflProps'
import { usePlayerSearch } from '@/lib/usePlayerSearch'
import { useNbaProps } from '@/lib/useNbaProps'
import { statToShortLabel, formatEdge, getConference, formatPlayerClass } from '@/lib/cfb'

interface MarketsResponse { player:{ id:string; name:string }; markets:MarketRow[]; best?: any }

function Stat({label,value}:{label:string;value:string}) {
  return (
    <div>
      <div className="text-xs text-[var(--fg-dim)]">{label}</div>
      <div className="text-3xl font-semibold tabular-nums lining-nums">{value}</div>
    </div>
  )
}

function ClipCard({title,time,snippet}:{title:string;time:string;snippet:string}) {
  return (
    <div className="rounded-xl bg-[var(--card)] ring-1 ring-white/10 p-4">
      <div className="flex items-center gap-2 text-sm text-[var(--fg-dim)]">
        <span>🎥</span>
        <span>{time}</span>
        <span>•</span>
        <span className="font-medium">{title}</span>
      </div>
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
  const [selectedSport, setSelectedSport] = useState<'NBA'|'NFL'|'CFB'|'MLB'>('CFB')
  
  const { loading: loadingClips, clips, search: searchVideos } = useVideoClips()
  
  // Use different search hooks based on selected sport
  const cfbSearch = useCfbPlayerSearch()
  const nflSearch = useNflPlayerSearch()
  const nbaSearch = usePlayerSearch()
  
  // Get the active search based on selected sport
  const activeSearch = selectedSport === 'CFB' ? cfbSearch : 
                      selectedSport === 'NFL' ? nflSearch : 
                      selectedSport === 'NBA' ? nbaSearch : cfbSearch
  
  const { q: playerQuery, setQ: setPlayerQuery, loading: loadingPlayers, results: playerResults } = activeSearch
  
  // Use different props hooks based on selected sport
  const cfbProps = useCfbProps(selectedPlayerId)
  const nflProps = useNflProps(selectedPlayerId)
  const nbaProps = useNbaProps(selectedPlayerId)
  
  // Get the active props based on selected sport
  const activeProps = selectedSport === 'CFB' ? cfbProps : 
                     selectedSport === 'NFL' ? nflProps : 
                     selectedSport === 'NBA' ? nbaProps : cfbProps
  
  const { loading: loadingProps, data: propsData } = activeProps

  function handleSearch(sport: string, q: string){
    if(!q) return
    setSelectedSport(sport as 'NBA'|'NFL'|'CFB'|'MLB')
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
          <div>
            <h1 className="text-xl font-semibold">PropSage</h1>
            <p className="text-sm text-[var(--fg-dim)]">AI-powered prop betting analysis</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/player/demo')}
            className="px-4 py-2 rounded-lg bg-[var(--surface)]/50 border border-white/10 text-sm hover:bg-white/5 transition"
          >
            Demo Player
          </button>
        </div>
      </header>

      {/* Search Section */}
      <section className="mx-auto max-w-6xl px-6 pt-10">
        <div className="rounded-2xl bg-[var(--surface)]/80 backdrop-blur-xl ring-1 ring-[var(--stroke)] p-3 shadow-[0_10px_50px_rgba(0,0,0,.35)]">
          <div className="flex flex-wrap items-center gap-3">
            <SearchBar onSearch={handleSearch} />
          </div>
          <p className="px-1 pt-2 text-sm text-[var(--fg-dim)]">
            Search a {selectedSport === 'CFB' ? 'college football' : selectedSport === 'NFL' ? 'NFL' : selectedSport === 'NBA' ? 'NBA' : selectedSport === 'MLB' ? 'MLB' : 'college football'} player to view <span className="text-[var(--mint)]">market vs fair line</span> edges and
            watch <span className="text-[var(--amber)]">video moments</span>.
          </p>
        </div>
      </section>

      {/* Search Results */}
      {showResults && (
        <section className="mx-auto max-w-6xl px-6 pt-6">
          <div className="rounded-2xl bg-[var(--surface)]/80 backdrop-blur-xl ring-1 ring-[var(--stroke)] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {selectedSport} Players
                {searchQuery && <span className="text-[var(--fg-dim)]"> for "{searchQuery}"</span>}
              </h2>
              
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
                      {player.team && <span style={{color: player.teamColor}}>{player.team}</span>}
                      {player.position && player.team && <span> • </span>}
                      {player.position && <span>{player.position}</span>}
                      {player.class && <span> • {formatPlayerClass(player.class)}</span>}
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
                  <div className="text-[var(--fg-dim)]">
                    <span style={{color: propsData.player.teamColor}}>{propsData.player.team}</span>
                    {propsData.player.position && <span> • {propsData.player.position}</span>}
                    {propsData.player.team && <span> • {getConference(propsData.player.team)}</span>}
                  </div>
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
                        {statToShortLabel(bestProp.stat)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-end gap-6">
                      <div>
                        <div className="text-xs text-[var(--fg-dim)]">Market Line</div>
                        <div className="text-2xl font-semibold">{bestProp.marketLine}</div>
                      </div>
                      <div>
                        <div className="text-xs text-[var(--fg-dim)]">Fair Line</div>
                        <div className="text-2xl font-semibold">{bestProp.fairLine}</div>
                      </div>
                      <div>
                        <div className="text-xs text-[var(--fg-dim)]">Edge</div>
                        <div className={`text-2xl font-semibold ${formatEdge(bestProp.edgePct).color}`}>
                          {formatEdge(bestProp.edgePct).text}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Markets table */}
              <MarketsTable 
                markets={propsData.props} 
                onSelectProp={(prop) => setSelectedPropId(prop.propId)}
                selectedPropId={selectedPropId}
              />
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-[var(--fg-dim)] text-lg mb-2">No player selected</div>
              <div className="text-sm text-[var(--fg-dim)]">Search for a player to view their prop betting analysis</div>
            </div>
          )}
        </section>

        {/* Right: Video panel */}
        <section className="space-y-6">
          <VideoPanel 
            onQuery={searchVideos}
            clips={clips}
            loading={loadingClips}
          />
        </section>
      </main>
    </div>
  )
}
