"use client"
import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { SearchBar } from '@/components/SearchBar'
import { LineCompareCard } from '@/components/LineCompareCard'
import { MarketsTable, MarketRow } from '@/components/MarketsTable'
import { VideoPanel, Clip } from '@/components/VideoPanel'
import { API_BASE } from '@/lib/api'

interface MarketsResponse { player:{ id:string; name:string }; markets:MarketRow[]; best?: any }

export default function PlayerPage(){
  const params = useParams<{id:string}>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [markets, setMarkets] = useState<MarketRow[]>([])
  const [best, setBest] = useState<any>(null)
  const [clips, setClips] = useState<Clip[]>([])
  const [loadingClips, setLoadingClips] = useState(false)
  const [playerName, setPlayerName] = useState('')

  const loadMarkets = useCallback(()=>{
    // First try to get player details
    fetch(`${API_BASE}/players/${params.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(player => {
        if (player) {
          setPlayerName(player.name)
          fetchClips(player.name)
        } else {
          // Fallback: try to get from ID
          const cleanName = params.id.replace(/-/g, ' ').replace(/nba_\d+/, '').trim()
          setPlayerName(cleanName || 'Player')
        }
      })
      .catch(() => {
        // Final fallback
        const cleanName = params.id.replace(/-/g, ' ').replace(/nba_\d+/, '').trim()
        setPlayerName(cleanName || 'Player')
      })
    
    // Try to load markets (might be empty for new API)
    fetch(`${API_BASE}/players/${params.id}/markets`).then(r=>r.json()).then((d:MarketsResponse)=>{
      setMarkets(d.markets||[]); setBest(d.best)
    }).catch(() => {
      console.log('No market data available for this player yet')
    })
  },[params.id])

  function fetchClips(q:string){
    setLoadingClips(true)
    fetch(`${API_BASE}/video/search?q=${encodeURIComponent(q)}`)
      .then(r=>r.json())
      .then(d=> setClips(d.clips||[]))
      .finally(()=>setLoadingClips(false))
  }

  useEffect(()=>{ loadMarkets() },[loadMarkets])

  function handleSearch(_sport:string,q:string){
    if(!q) return
    fetch(`${API_BASE}/players?q=${encodeURIComponent(q)}`).then(r=>r.json()).then(d=>{
      if (d.players?.length) router.push(`/player/${d.players[0].id}?market=points`)
    })
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">{playerName || 'Player'}</h1>
          <SearchBar onSearch={handleSearch} />
        </div>
        {best && (
          <LineCompareCard marketName={best.market} bookName={best.book} marketLine={best.marketLine||0} fairLine={best.fairLine} edgePct={best.edgePct} />
        )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <MarketsTable rows={markets} />
          </div>
          <div className="min-h-[400px]">
            <VideoPanel onQuery={(qq)=>fetchClips(`${params.id.replace('-',' ')} ${qq}`)} clips={clips} loading={loadingClips} />
          </div>
        </div>
      </div>
    </div>
  )
}
