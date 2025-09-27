'use client'

import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react'
import { webConfig } from '@/lib/config'

export interface PropAnalysis {
  id: string
  playerId: string
  playerName: string
  market: string
  marketLine: number
  fairLine: number
  edge: number
  confidence: number
  evidenceSnippets: EvidenceSnippet[]
  videoClips: VideoClip[]
  createdAt: Date
  updatedAt: Date
}

export interface EvidenceSnippet {
  id: string
  text: string
  source: string
  url: string
  weight: number
  timestamp: Date
}

export interface VideoClip {
  id: string
  title: string
  url: string
  thumbnailUrl: string
  relevanceScore: number
  duration: number
}

interface PropAnalysisState {
  analyses: PropAnalysis[]
  currentAnalysis: PropAnalysis | null
  isLoading: boolean
  error: string | null
}

type PropAnalysisAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_ANALYSIS'; payload: PropAnalysis }
  | { type: 'UPDATE_ANALYSIS'; payload: PropAnalysis }
  | { type: 'SET_CURRENT_ANALYSIS'; payload: PropAnalysis | null }

const initialState: PropAnalysisState = {
  analyses: [],
  currentAnalysis: null,
  isLoading: false,
  error: null,
}

function propAnalysisReducer(state: PropAnalysisState, action: PropAnalysisAction): PropAnalysisState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false }
    case 'ADD_ANALYSIS':
      return {
        ...state,
        analyses: [action.payload, ...state.analyses.slice(0, 9)],
        currentAnalysis: action.payload,
        isLoading: false,
        error: null,
      }
    case 'UPDATE_ANALYSIS':
      return {
        ...state,
        analyses: state.analyses.map(a => a.id === action.payload.id ? action.payload : a),
        currentAnalysis: state.currentAnalysis?.id === action.payload.id ? action.payload : state.currentAnalysis,
      }
    case 'SET_CURRENT_ANALYSIS':
      return { ...state, currentAnalysis: action.payload }
    default:
      return state
  }
}

const PropAnalysisContext = createContext<{
  state: PropAnalysisState
  dispatch: React.Dispatch<PropAnalysisAction>
  searchProp: (query: string) => Promise<void>
} | null>(null)

export function PropAnalysisProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(propAnalysisReducer, initialState)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    // Connect to backend websocket if available - only in demo mode
    if (!webConfig.demoMode) return

    const url = webConfig.apiWsUrl
    try {
      const ws = new WebSocket(url)
      wsRef.current = ws
      
      ws.onopen = () => {
        console.log('WebSocket connected successfully')
      }
      
      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data)
          if (msg.type === 'edge_update') {
            // Update existing analysis if player/market matches
            const keyId = `${msg.playerId}_${msg.result.marketLine}_${msg.result.simulations}` // ephemeral
            if (state.currentAnalysis && state.currentAnalysis.playerId === msg.playerId) {
              dispatch({
                type: 'UPDATE_ANALYSIS',
                payload: {
                  ...state.currentAnalysis,
                  fairLine: msg.result.fairLine,
                  edge: +(msg.result.edge * 100).toFixed(2),
                  confidence: 0.8,
                  updatedAt: new Date(),
                },
              })
            }
          }
        } catch (error) {
          console.warn('WebSocket message parsing error:', error)
        }
      }
      
      ws.onerror = (error) => {
        console.warn('WebSocket connection error (non-critical):', error)
        if (ws.readyState === WebSocket.OPEN) {
          ws.close()
        }
      }
      
      ws.onclose = () => {
        console.log('WebSocket connection closed')
      }
      
      return () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close()
        }
      }
    } catch (error) {
      console.warn('WebSocket initialization failed (non-critical):', error)
    }
  }, [state.currentAnalysis])

  const searchProp = async (query: string) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })

    try {
      // Parse simple query pattern: "Anthony Edwards Points 25.5"
      const parts = query.split(/\s+/)
      // naive extraction
      const marketLine = parseFloat(parts.find(p => p.match(/\d+(\.\d+)?/)) || '25.5')
      const market = parts.find(p => ['Points','PTS','Ast','Assists','Rebounds','REB'].includes(p)) || 'PTS'
      const playerName = parts.slice(0,2).join(' ') || 'Player'
      const playerId = playerName.toUpperCase().split(' ').map(s => s[0]).join('').slice(0,3)
  const apiUrl = webConfig.apiUrl
      const resp = await fetch(`${apiUrl}/price`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: playerId, market: 'PTS', marketLine })
      })
      let fairLine = marketLine
      let edgePct = 0
      if (resp.ok) {
        const data = await resp.json()
        fairLine = data.fairLine
        edgePct = +(data.edge * 100).toFixed(2)
      }
      const analysis: PropAnalysis = {
        id: `ana-${Date.now()}`,
        playerId,
        playerName,
        market: market === 'PTS' ? 'Points' : market,
        marketLine,
        fairLine,
        edge: edgePct,
        confidence: 0.8,
        evidenceSnippets: [],
        videoClips: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      dispatch({ type: 'ADD_ANALYSIS', payload: analysis })
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Analysis failed. Using demo data.' })
    }
  }

  return (
    <PropAnalysisContext.Provider value={{ state, dispatch, searchProp }}>
      {children}
    </PropAnalysisContext.Provider>
  )
}

export function usePropAnalysis() {
  const context = useContext(PropAnalysisContext)
  if (!context) {
    throw new Error('usePropAnalysis must be used within a PropAnalysisProvider')
  }
  return context
}
