'use client'

import React, { createContext, useContext, useReducer } from 'react'

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

  const searchProp = async (query: string) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })

    try {
      // Demo data fallback for hackathon
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate API call
      
      const demoAnalysis: PropAnalysis = {
        id: `demo-${Date.now()}`,
        playerId: 'ANT',
        playerName: 'Anthony Edwards',
        market: 'Points',
        marketLine: 25.5,
        fairLine: 27.2,
        edge: 6.7,
        confidence: 0.82,
        evidenceSnippets: [
          {
            id: '1',
            text: 'Coach Finch confirms Edwards will have expanded role tonight vs Phoenix defense',
            source: 'ESPN',
            url: 'https://espn.com/nba/story',
            weight: 0.8,
            timestamp: new Date(),
          },
          {
            id: '2',
            text: 'Edwards averages 31.2 points vs teams allowing 115+ PPG this season',
            source: 'Basketball Reference',
            url: 'https://basketball-reference.com',
            weight: 0.7,
            timestamp: new Date(),
          },
        ],
        videoClips: [
          {
            id: '1',
            title: 'Edwards drives vs similar defensive scheme',
            url: 'https://example.com/clip1',
            thumbnailUrl: 'https://example.com/thumb1',
            relevanceScore: 0.85,
            duration: 12,
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      dispatch({ type: 'ADD_ANALYSIS', payload: demoAnalysis })
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
