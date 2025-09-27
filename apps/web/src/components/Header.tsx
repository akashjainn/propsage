'use client'

import React from 'react'
import { usePropAnalysis } from '@/contexts/PropAnalysisContext'
import { useWebSocket } from '@/contexts/WebSocketContext'

export function Header() {
  const { state: wsState } = useWebSocket()
  const { state } = usePropAnalysis()

  return (
    <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">PS</span>
              </div>
              <span className="text-xl font-bold text-white">PropSage</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-2 text-sm text-gray-400">
              <span>Enterprise Sports Intelligence</span>
              <span className="px-2 py-1 bg-green-900/30 text-green-400 rounded text-xs">
                LIVE
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-gray-400">Demo Mode</span>
            </div>
            <div className="text-xs text-gray-400">
              Analyses: {state.analyses.length}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
