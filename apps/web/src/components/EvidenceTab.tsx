"use client"
import React, { useEffect, useState } from 'react'
import { apiUrl } from '@/lib/api'

interface EvidenceSnippet { id: string; text: string; source: string; url: string; weight: number; timestamp?: string }

export function EvidenceTab({ playerId }: { playerId: string | null }) {
  const [snippets, setSnippets] = useState<EvidenceSnippet[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!playerId) return
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
  const r = await fetch(apiUrl(`/evidence/${playerId}`))
        if (!r.ok) throw new Error('fail')
        const data = await r.json()
        if (!cancelled) setSnippets(data)
      } catch { if (!cancelled) setSnippets([]) }
      finally { if (!cancelled) setLoading(false) }
    }
    load()
    return () => { cancelled = true }
  }, [playerId])

  return (
    <div className="space-y-3">
      {loading && <div className="text-xs text-gray-400 animate-pulse">Loading evidence...</div>}
      {!loading && !snippets.length && <div className="text-xs text-gray-500">No evidence.</div>}
      {snippets.map(s => (
        <div key={s.id} className="p-3 rounded bg-gray-800/60 border border-gray-700/60 text-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-medium text-white truncate max-w-[70%]">{s.source}</span>
            <span className="text-xs text-blue-300 bg-blue-600/20 px-2 py-0.5 rounded">{(s.weight*100).toFixed(0)}%</span>
          </div>
          <p className="text-gray-300 text-xs leading-snug line-clamp-4">{s.text}</p>
          {s.url && <a href={s.url} target="_blank" className="text-xs text-blue-400 hover:underline">Open Source ↗</a>}
        </div>
      ))}
    </div>
  )
}
