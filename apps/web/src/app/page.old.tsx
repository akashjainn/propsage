"use client"
import { Header } from '@/components/Header'
import { PlayerSearch } from '@/components/PlayerSearch'
import { PlayerCard } from '@/components/PlayerCard'
import { EvidenceTab } from '@/components/EvidenceTab'
import { VideoTab } from '@/components/VideoTab'
import React, { useState } from 'react'
import { webConfig } from '@/lib/config'

export default function HomePage() {
  const [selected, setSelected] = useState<any | null>(null)
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      <div className="relative">
        <Header />
        <main className="container mx-auto px-4 py-8 space-y-8">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-1 space-y-4">
              <PlayerSearch onSelect={p=>setSelected(p)} />
            </div>
            <div className="md:col-span-2 space-y-6">
              <PlayerCard selection={selected} />
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 mb-2">Evidence</h3>
                  <EvidenceTab playerId={selected?.playerId || null} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 mb-2">Video</h3>
                  <VideoTab playerId={selected?.playerId || null} enabled={webConfig.demoMode && (process.env.NEXT_PUBLIC_VIDEO_ENABLED!== 'false')} />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
