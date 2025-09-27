"use client"
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SearchBar } from '@/components/SearchBar'
import { LineCompareCard } from '@/components/LineCompareCard'
import { MarketsTable, MarketRow } from '@/components/MarketsTable'
import { VideoPanel, Clip } from '@/components/VideoPanel'
import { API_BASE } from '@/lib/api'

interface MarketsResponse { player:{ id:string; name:string }; markets:MarketRow[]; best?: any }

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
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        <h1 className="text-2xl font-semibold tracking-tight">PropSage</h1>
        <SearchBar onSearch={handleSearch} />
        <div className="text-sm text-slate-400">Search a player to view market vs fair line edges and video intelligence.</div>
      </div>
    </div>
  )
}
