"use client"
import React, { useEffect, useState } from 'react'
import { apiUrl } from '@/lib/api'

interface VideoClip { id: string; title: string; url: string; relevanceScore?: number; duration?: number }

export function VideoTab({ playerId, enabled }: { playerId: string | null; enabled: boolean }) {
  const [clips, setClips] = useState<VideoClip[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!playerId || !enabled) return
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
  const r = await fetch(apiUrl(`/video/${playerId}`))
        if (!r.ok) throw new Error('fail')
        const data = await r.json()
        if (!cancelled) setClips(data)
      } catch { if (!cancelled) setClips([]) }
      finally { if (!cancelled) setLoading(false) }
    }
    load()
    return () => { cancelled = true }
  }, [playerId, enabled])

  if (!enabled) return <div className="text-xs text-gray-500">Video disabled.</div>

  return (
    <div className="space-y-3">
      {loading && <div className="text-xs text-gray-400 animate-pulse">Loading clips...</div>}
      {!loading && !clips.length && <div className="text-xs text-gray-500">No clips.</div>}
      <div className="grid gap-3 md:grid-cols-3">
        {clips.map(c => (
          <div key={c.id} className="relative group rounded overflow-hidden bg-gray-800/60 p-3 border border-gray-700/60">
            <div className="text-white text-sm font-medium line-clamp-2 mb-2">{c.title}</div>
            <div className="aspect-video rounded bg-gray-900 flex items-center justify-center text-gray-600 text-xs">Clip</div>
            <div className="flex justify-between mt-2 text-[10px] text-gray-400">
              <span>{(c.relevanceScore || 0).toFixed(2)}</span>
              <span>{c.duration ? c.duration+'s' : ''}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
