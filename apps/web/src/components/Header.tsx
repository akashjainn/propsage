'use client'

import React from 'react'
import { usePropAnalysis } from '@/contexts/PropAnalysisContext'
import { useWebSocket } from '@/contexts/WebSocketContext'
import { Logo } from './Logo'

export function Header() {
  const { state: wsState } = useWebSocket()
  const { state } = usePropAnalysis()

  return (
    <header className="border-b border-white/10 bg-[var(--surface)]/60 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-6 py-4">
        <div className="flex items-center justify-between">
          <Logo size="md" />
          
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
