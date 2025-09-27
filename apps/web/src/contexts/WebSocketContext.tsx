'use client'

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'

interface WebSocketMessage {
  type: 'analysis_update' | 'edge_update' | 'connection_status'
  data: any
}

interface WebSocketState {
  isConnected: boolean
  lastMessage: WebSocketMessage | null
  connectionAttempts: number
}

const WebSocketContext = createContext<{
  state: WebSocketState
  sendMessage: (message: any) => void
  subscribe: (callback: (message: WebSocketMessage) => void) => () => void
} | null>(null)

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    lastMessage: null,
    connectionAttempts: 0,
  })

  const sendMessage = useCallback((message: any) => {
    console.log('WebSocket message (demo mode):', message)
  }, [])

  const subscribe = useCallback((callback: (message: WebSocketMessage) => void) => {
    return () => {} // No-op for demo
  }, [])

  return (
    <WebSocketContext.Provider value={{ state, sendMessage, subscribe }}>
      {children}
    </WebSocketContext.Provider>
  )
}

export function useWebSocket() {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider')
  }
  return context
}
