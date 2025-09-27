"use client"
import React, { useState, useRef, useEffect } from 'react'

export interface SearchBarProps {
  onSearch: (sport: string, q: string) => void
  loading?: boolean
  placeholder?: string
  className?: string
}

const SPORT_OPTIONS = [
  { value: 'CFB', label: 'CFB', icon: '🏈' },
  { value: 'NFL', label: 'NFL', icon: '🏈' },
  { value: 'NBA', label: 'NBA', icon: '🏀' },
  { value: 'MLB', label: 'MLB', icon: '⚾' }
] as const

const SEARCH_SUGGESTIONS = {
  CFB: ['Caleb Williams', 'Jayden Daniels', 'Bo Nix', 'Marvin Harrison Jr.'],
  NFL: ['Josh Allen', 'Lamar Jackson', 'Tyreek Hill', 'Travis Kelce'],
  NBA: ['LeBron James', 'Stephen Curry', 'Luka Doncic', 'Giannis Antetokounmpo'],
  MLB: ['Ronald Acuña Jr.', 'Mookie Betts', 'Aaron Judge', 'Shohei Ohtani']
}

export function SearchBar({ 
  onSearch, 
  loading = false, 
  placeholder,
  className = ""
}: SearchBarProps) {
  const [sport, setSport] = useState<'NBA'|'NFL'|'CFB'|'MLB'>('CFB')
  const [query, setQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  const currentSuggestions = SEARCH_SUGGESTIONS[sport] || []
  const filteredSuggestions = currentSuggestions.filter(suggestion =>
    suggestion.toLowerCase().includes(query.toLowerCase())
  )

  const getPlaceholder = () => {
    if (placeholder) return placeholder
    switch (sport) {
      case 'CFB': return 'Search a college football player…'
      case 'NFL': return 'Search an NFL player…'
      case 'NBA': return 'Search an NBA player…'
      case 'MLB': return 'Search an MLB player…'
      default: return 'Search a player…'
    }
  }

  const handleSearch = (searchQuery: string = query) => {
    if (!searchQuery.trim() || loading) return
    onSearch(sport, searchQuery.trim())
    setQuery('')
    setShowSuggestions(false)
    setSelectedSuggestion(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || filteredSuggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleSearch()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedSuggestion(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedSuggestion(prev => 
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (selectedSuggestion >= 0) {
          setQuery(filteredSuggestions[selectedSuggestion])
          handleSearch(filteredSuggestions[selectedSuggestion])
        } else {
          handleSearch()
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedSuggestion(-1)
        inputRef.current?.blur()
        break
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    handleSearch(suggestion)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    setShowSuggestions(value.length > 0)
    setSelectedSuggestion(-1)
  }

  const handleSportChange = (newSport: 'NBA'|'NFL'|'CFB'|'MLB') => {
    setSport(newSport)
    setQuery('')
    setShowSuggestions(false)
    setSelectedSuggestion(-1)
    // Focus input after sport change
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
        setSelectedSuggestion(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={`flex flex-wrap gap-3 w-full ${className}`}>
      {/* Sport Selector */}
      <div className="relative inline-flex items-center">
        <select
          value={sport}
          onChange={e => handleSportChange(e.target.value as any)}
          disabled={loading}
          className="appearance-none rounded-full bg-[var(--card)] text-[var(--fg)]
                           border border-white/10 pl-4 pr-12 py-2 text-sm focus:outline-none
                           focus:ring-2 focus:ring-[var(--iris)] disabled:opacity-50
                           transition-all duration-200"
        >
          {SPORT_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.icon} {option.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute -right-4 top-1/2 -translate-y-1/2
                               text-[var(--fg-dim)] text-sm">▾</span>
      </div>

      {/* Search Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSearch()
        }}
        className="flex-1 min-w-[280px] flex gap-3 relative"
      >
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(query.length > 0)}
            placeholder={getPlaceholder()}
            disabled={loading}
            className="w-full rounded-xl bg-[var(--card)] text-[var(--fg)]
                             placeholder-[var(--muted)] border border-white/10 px-4 py-3 text-sm
                             focus:outline-none focus:ring-2 focus:ring-[var(--iris)]
                             disabled:opacity-50 transition-all duration-200"
          />
          
          {/* Search Suggestions Dropdown */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute top-full left-0 right-0 mt-1 bg-[var(--card)] border border-white/10
                         rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto"
            >
              {filteredSuggestions.map((suggestion, index) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`w-full px-4 py-2 text-left text-sm text-[var(--fg)] hover:bg-white/5
                             transition-colors duration-150 ${
                               index === selectedSuggestion ? 'bg-[var(--iris)]/20' : ''
                             } ${index === 0 ? 'rounded-t-xl' : ''} ${
                               index === filteredSuggestions.length - 1 ? 'rounded-b-xl' : ''
                             }`}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={!query.trim() || loading}
          className="rounded-xl px-5 py-3 font-medium text-sm
                           bg-gradient-to-tr from-[var(--iris)] to-[#8b76ff]
                           shadow-[0_10px_30px_rgba(108,92,231,.45)]
                           hover:brightness-110 transition-all duration-200
                           disabled:opacity-50 disabled:cursor-not-allowed
                           flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <span>🔍</span>
              Search
            </>
          )}
        </button>
      </form>
    </div>
  )
}
