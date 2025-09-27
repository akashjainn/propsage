import React, { useState, useEffect } from 'react'
import { webConfig } from '../../lib/config'

interface VideoSignal {
  entity_type: 'player' | 'team' | 'game' | 'weather'
  entity_id: string
  event_id: string
  timestamp: string
  signal_type: 'injury' | 'minutes_restriction' | 'role_change' | 'weather' | 'coach_comment'
  value: number
  confidence: number
  evidence: {
    video_id: string
    start_time: number
    end_time: number
    description: string
    source: string
  }[]
}

interface VideoIntelResponse {
  signals: VideoSignal[]
  meta: {
    source: 'live' | 'demo'
    count: number
    lastUpdate: string
    twelveLabsUsage?: {
      requests_used: number
      estimated_cost: number
    }
  }
}

export function VideoIntelligencePanel() {
  const [videoSignals, setVideoSignals] = useState<VideoSignal[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<VideoSignal[]>([])
  const [meta, setMeta] = useState<VideoIntelResponse['meta'] | null>(null)

  useEffect(() => {
    loadVideoIntelligence()
  }, [])

  const loadVideoIntelligence = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${webConfig.apiUrl}/video-intel`)
      const data: VideoIntelResponse = await response.json()
      
      setVideoSignals(data.signals)
      setMeta(data.meta)
    } catch (error) {
      console.error('Failed to load video intelligence:', error)
    } finally {
      setLoading(false)
    }
  }

  const searchVideoIntelligence = async (query: string) => {
    if (!query.trim()) return

    try {
      const response = await fetch(`${webConfig.apiUrl}/video-intel/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, league: 'NBA-2025' })
      })
      const data = await response.json()
      setSearchResults(data.signals || [])
    } catch (error) {
      console.error('Failed to search video intelligence:', error)
    }
  }

  const getSignalIcon = (signalType: string) => {
    switch (signalType) {
      case 'injury': return '🏥'
      case 'minutes_restriction': return '⏱️'
      case 'weather': return '🌧️'
      case 'coach_comment': return '🎤'
      case 'role_change': return '🔄'
      default: return '📹'
    }
  }

  const getSignalColor = (signalType: string, value: number) => {
    switch (signalType) {
      case 'injury':
        return value > 0.7 ? 'text-red-600' : value > 0.4 ? 'text-yellow-600' : 'text-green-600'
      case 'minutes_restriction':
        return value > 0.6 ? 'text-orange-600' : 'text-blue-600'
      case 'weather':
        return value > 0.5 ? 'text-gray-600' : 'text-blue-400'
      default:
        return 'text-purple-600'
    }
  }

  const formatSignalType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const formatEntityId = (entityId: string) => {
    return entityId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            🎬 Video Intelligence
            {meta?.source === 'live' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Live
              </span>
            )}
            {meta?.source === 'demo' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Demo
              </span>
            )}
          </h2>
          <button
            onClick={loadVideoIntelligence}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>

        {/* Search Interface */}
        <div className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search video moments (e.g., 'Mahomes ankle injury', 'Coach comments on minutes')"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && searchVideoIntelligence(searchQuery)}
            />
            <button
              onClick={() => searchVideoIntelligence(searchQuery)}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Search
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Try: "injury concern", "minutes restriction", "weather conditions", "coach comments"
          </div>
        </div>

        {/* Usage Stats */}
        {meta && (
          <div className="text-sm text-gray-600 mb-4">
            <span>{meta.count} signals</span>
            {meta.twelveLabsUsage && (
              <span className="ml-4">
                • API Calls: {meta.twelveLabsUsage.requests_used}
                • Est. Cost: ${meta.twelveLabsUsage.estimated_cost.toFixed(3)}
              </span>
            )}
            <span className="ml-4">• Last Update: {new Date(meta.lastUpdate).toLocaleTimeString()}</span>
          </div>
        )}
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="p-6 border-b border-gray-200 bg-purple-50">
          <h3 className="font-semibold text-gray-900 mb-3">Search Results ({searchResults.length})</h3>
          <div className="space-y-3">
            {searchResults.map((signal, index) => (
              <VideoSignalCard key={index} signal={signal} />
            ))}
          </div>
        </div>
      )}

      {/* All Video Signals */}
      <div className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Latest Video Intelligence</h3>
        {videoSignals.length > 0 ? (
          <div className="space-y-4">
            {videoSignals.map((signal, index) => (
              <VideoSignalCard key={index} signal={signal} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No video intelligence signals available</p>
            <p className="text-sm mt-2">Try searching for specific players or events</p>
          </div>
        )}
      </div>
    </div>
  )
}

function VideoSignalCard({ signal }: { signal: VideoSignal }) {
  const getSignalIcon = (signalType: string) => {
    switch (signalType) {
      case 'injury': return '🏥'
      case 'minutes_restriction': return '⏱️'
      case 'weather': return '🌧️'
      case 'coach_comment': return '🎤'
      case 'role_change': return '🔄'
      default: return '📹'
    }
  }

  const getSignalColor = (signalType: string, value: number) => {
    switch (signalType) {
      case 'injury':
        return value > 0.7 ? 'text-red-600' : value > 0.4 ? 'text-yellow-600' : 'text-green-600'
      case 'minutes_restriction':
        return value > 0.6 ? 'text-orange-600' : 'text-blue-600'
      case 'weather':
        return value > 0.5 ? 'text-gray-600' : 'text-blue-400'
      default:
        return 'text-purple-600'
    }
  }

  const formatSignalType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const formatEntityId = (entityId: string) => {
    return entityId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{getSignalIcon(signal.signal_type)}</span>
            <span className={`font-semibold ${getSignalColor(signal.signal_type, signal.value)}`}>
              {formatSignalType(signal.signal_type)}
            </span>
            <span className="text-gray-600">•</span>
            <span className="font-medium text-gray-900">
              {formatEntityId(signal.entity_id)}
            </span>
          </div>
          
          <div className="text-sm text-gray-600 mb-3">
            Impact: {(signal.value * 100).toFixed(0)}% • 
            Confidence: {(signal.confidence * 100).toFixed(0)}%
          </div>

          {signal.evidence.map((evidence, idx) => (
            <div key={idx} className="bg-gray-100 rounded p-3 text-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-gray-700">Evidence:</span>
                <span className="text-xs text-gray-500">
                  {Math.floor(evidence.start_time / 60)}:{(evidence.start_time % 60).toString().padStart(2, '0')} - 
                  {Math.floor(evidence.end_time / 60)}:{(evidence.end_time % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <p className="text-gray-700">{evidence.description}</p>
            </div>
          ))}
        </div>
        
        <div className="text-xs text-gray-500 ml-4">
          {new Date(signal.timestamp).toLocaleString()}
        </div>
      </div>
    </div>
  )
}