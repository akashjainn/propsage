'use client'

import React from 'react'
import { PropAnalysisProvider } from '@/contexts/PropAnalysisContext'
import { WebSocketProvider } from '@/contexts/WebSocketContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WebSocketProvider>
      <PropAnalysisProvider>
        {children}
      </PropAnalysisProvider>
    </WebSocketProvider>
  )
}
