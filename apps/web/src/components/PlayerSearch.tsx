"use client"
import React, { useEffect, useState } from 'react'
import { apiUrl } from '@/lib/api'

interface PlayerProp { playerId: string; market: string; line: number; source: string; ts: string }

interface PlayerSearchProps { onSelect: (p: PlayerProp) => void }

export function PlayerSearch({ onSelect }: PlayerSearchProps) {
  const [players, setPlayers] = useState<PlayerProp[]>([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const r = await fetch(apiUrl('/lines'))
        if (!r.ok) throw new Error('fail')
        const data = await r.json()
        // Handle both array response and object with lines property
        const linesData = Array.isArray(data) ? data : (data.lines || [])
        if (!cancelled) setPlayers(Array.isArray(linesData) ? linesData : [])
      } catch (error) {
        console.error('Failed to load players:', error)
        if (!cancelled) setPlayers([])
      }
      finally { if (!cancelled) setLoading(false) }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Ensure players is always an array before filtering
  const safePlayersList = Array.isArray(players) ? players : []
  const filtered = safePlayersList.filter(p => !q || p.playerId?.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="glass p-4 rounded-xl space-y-2">
      <div className="flex items-center gap-2">
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search player id..." className="flex-1 bg-gray-800/60 border border-gray-700 rounded px-3 py-2 text-sm" />
        {loading && <span className="text-xs text-gray-400 animate-pulse">Loading...</span>}
      </div>
      <div className="max-h-56 overflow-auto divide-y divide-gray-800">
        {filtered.slice(0,30).map(p => (
          <button key={p.playerId+ p.market} onClick={()=>onSelect(p)} className="w-full text-left px-2 py-1 hover:bg-gray-800/70 text-sm">
            <span className="font-medium text-white mr-2">{p.playerId}</span>
            <span className="text-gray-400">{p.market} {p.line}</span>
          </button>
        ))}
        {!filtered.length && !loading && <div className="text-xs text-gray-500 p-2">No matches</div>}
      </div>
    </div>
  )
}
