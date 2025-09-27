'use client'

import React, { useState, useRef, useEffect } from 'react'
import { usePropAnalysis } from '@/contexts/PropAnalysisContext'

const EXAMPLE_QUERIES = [
  'Anthony Edwards Points 25.5 O/U',
  'Luka Doncic Assists 8.5 O/U', 
  'Jayson Tatum Rebounds 7.5 O/U',
  'Steph Curry 3-Pointers 4.5 O/U'
]

export function SearchInterface() {
  const [query, setQuery] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { searchProp, state } = usePropAnalysis()

  const handleSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return
    await searchProp(searchQuery.trim())
    setQuery('')
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="glass rounded-2xl p-8 glow">
        <div className="space-y-6">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search any player prop... (e.g., 'Anthony Edwards Points 25.5 O/U')"
              className="w-full px-6 py-4 pl-14 pr-20 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
              disabled={state.isLoading}
            />
            
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2" aria-hidden="true">
              🔍
            </div>
            
            <button
              onClick={() => handleSearch()}
              disabled={!query.trim() || state.isLoading}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {state.isLoading ? '⏳' : '✨'} Analyze
            </button>
          </div>

          {state.isLoading && (
            <div className="text-center space-y-2 text-green-400 text-sm" aria-live="polite">
              <div className="animate-pulse">🧮 Searching lines...</div>
              <div className="animate-pulse">🧠 Gathering evidence...</div>
              <div className="animate-pulse">🎥 Finding clips...</div>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-sm text-gray-400 font-medium">Try these examples:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {EXAMPLE_QUERIES.map((example, index) => (
                <button
                  key={index}
                  onClick={() => handleSearch(example)}
                  disabled={state.isLoading}
                  className="text-left p-3 rounded-lg bg-gray-800/30 hover:bg-gray-700/50 border border-gray-700/50 hover:border-green-500/50 text-gray-300 hover:text-white transition-all duration-200 disabled:opacity-50"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          {state.error && (
            <div className="p-4 rounded-lg bg-red-900/20 border border-red-500/30 text-red-300">
              <p className="font-medium">Analysis Error</p>
              <p className="text-sm opacity-90">{state.error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
