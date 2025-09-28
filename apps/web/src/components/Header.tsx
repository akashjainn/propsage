'use client'

import React from 'react'
import Image from 'next/image'
import { usePropAnalysis } from '@/contexts/PropAnalysisContext'
import { useWebSocket } from '@/contexts/WebSocketContext'

export function Header() {
  const { state: wsState } = useWebSocket()
  const { state } = usePropAnalysis()

  return (
    <header className="border-b border-white/10 bg-[var(--surface)]/60 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-[var(--iris)]/80 ring-2 ring-[var(--ring)]/40 shadow-[0_0_30px_rgba(108,92,231,.45)] flex items-center justify-center overflow-hidden">
              <Image
                src="/icon.png"
                alt="PropSage"
                width={24}
                height={24}
                className="w-6 h-6 object-contain"
                priority
              />
            </div>
            <span className="text-xl font-semibold tracking-tight text-[var(--fg)]">PropSage</span>
          </div>
          
          <div className="hidden md:flex items-center gap-3 text-sm text-[var(--fg-dim)]">
            <span>Enterprise Sports Intelligence</span>
            <span className="px-2 py-1 rounded-full bg-[var(--mint)]/15 text-[var(--mint)] ring-1 ring-[var(--mint)]/30 text-xs">
              Live
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[var(--mint)] animate-pulse" />
              <span className="text-xs text-[var(--fg-dim)]">Demo Mode</span>
            </div>
            <div className="text-xs text-[var(--fg-dim)]">
              Analyses: {state.analyses.length}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
