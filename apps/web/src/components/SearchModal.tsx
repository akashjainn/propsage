'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Clock, TrendingUp, User, Video, X, Command } from 'lucide-react';
import { useFastSWR } from '../hooks/usePerformance';

interface SearchResult {
  id: string;
  type: 'player' | 'prop' | 'clip' | 'game';
  title: string;
  subtitle: string;
  confidence?: number;
  metadata?: {
    edge?: number;
    position?: string;
    team?: string;
    game?: string;
    quarter?: number;
  };
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (result: SearchResult) => void;
}

// Mock search results with façade intelligence
const generateSearchResults = (query: string): SearchResult[] => {
  if (!query.trim()) return [];

  const lowerQuery = query.toLowerCase();
  
  // Simulate intelligent search with confidence scoring
  const results: SearchResult[] = [];

  // Player matches
  if (lowerQuery.includes('gunner') || lowerQuery.includes('stockton')) {
    results.push({
      id: 'player-gunner',
      type: 'player',
      title: 'Gunner Stockton',
      subtitle: 'Georgia Bulldogs QB',
      confidence: 0.94,
      metadata: { position: 'QB', team: 'UGA' }
    });
  }

  // Prop matches
  if (lowerQuery.includes('passing') || lowerQuery.includes('yards')) {
    results.push({
      id: 'prop-passing-yards',
      type: 'prop',
      title: 'Passing Yards',
      subtitle: 'Gunner Stockton • 242.5 yards',
      confidence: 0.89,
      metadata: { edge: -3.2, game: 'UGA vs Alabama' }
    });
  }

  if (lowerQuery.includes('rushing')) {
    results.push({
      id: 'prop-rushing-yards',
      type: 'prop',
      title: 'Rushing Yards',
      subtitle: 'Gunner Stockton • 22.5 yards',
      confidence: 0.87,
      metadata: { edge: 2.1, game: 'UGA vs Alabama' }
    });
  }

  if (lowerQuery.includes('touchdown') || lowerQuery.includes('td')) {
    results.push({
      id: 'prop-passing-tds',
      type: 'prop',
      title: 'Passing Touchdowns',
      subtitle: 'Gunner Stockton • 2.5 TDs',
      confidence: 0.91,
      metadata: { edge: 1.8, game: 'UGA vs Alabama' }
    });
  }

  // Clip matches
  if (lowerQuery.includes('video') || lowerQuery.includes('clip') || lowerQuery.includes('highlight')) {
    results.push(
      {
        id: 'clip-sideline-strike',
        type: 'clip',
        title: 'Sideline Strike vs Auburn',
        subtitle: '28-yard completion • Q3 12:45',
        confidence: 0.86,
        metadata: { quarter: 3, game: 'UGA vs Auburn' }
      },
      {
        id: 'clip-pocket-presence',
        type: 'clip',
        title: 'Pocket Presence Under Pressure',
        subtitle: '15-yard touchdown • Q2 8:30',
        confidence: 0.88,
        metadata: { quarter: 2, game: 'UGA vs Tennessee' }
      }
    );
  }

  // Game matches
  if (lowerQuery.includes('alabama') || lowerQuery.includes('bama')) {
    results.push({
      id: 'game-uga-bama',
      type: 'game',
      title: 'UGA vs Alabama',
      subtitle: 'SEC Championship • Tonight 8:00 PM',
      confidence: 0.96,
      metadata: { game: 'SEC Championship' }
    });
  }

  // Generic intelligent suggestions
  if (results.length === 0) {
    // Fallback intelligent suggestions
    results.push(
      {
        id: 'suggestion-gunner',
        type: 'player',
        title: 'Gunner Stockton',
        subtitle: 'Popular search • Georgia QB',
        confidence: 0.75,
        metadata: { position: 'QB', team: 'UGA' }
      },
      {
        id: 'suggestion-passing',
        type: 'prop',
        title: 'Passing Props',
        subtitle: 'Most active market today',
        confidence: 0.72,
        metadata: { edge: 0, game: 'All Games' }
      }
    );
  }

  // Sort by confidence
  return results.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
};

export default function SearchModal({ isOpen, onClose, onSelect }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Simulate search delay for realism
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const searchDelay = setTimeout(() => {
      const searchResults = generateSearchResults(query);
      setResults(searchResults);
      setSelectedIndex(0);
      setIsSearching(false);
    }, 200 + Math.random() * 300); // 200-500ms delay

    return () => clearTimeout(searchDelay);
  }, [query]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex] && onSelect) {
            onSelect(results[selectedIndex]);
            onClose();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose, onSelect]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'player':
        return <User className="w-4 h-4" />;
      case 'prop':
        return <TrendingUp className="w-4 h-4" />;
      case 'clip':
        return <Video className="w-4 h-4" />;
      case 'game':
        return <Clock className="w-4 h-4" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  const getResultColor = (type: string) => {
    switch (type) {
      case 'player':
        return 'text-blue-500';
      case 'prop':
        return 'text-green-500';
      case 'clip':
        return 'text-purple-500';
      case 'game':
        return 'text-orange-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20">
      <div 
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden"
      >
        {/* Header */}
        <div className="border-b border-gray-100 p-4">
          <div className="flex items-center space-x-3">
            <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search players, props, clips..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 text-lg font-medium text-gray-900 placeholder-gray-400 bg-transparent border-none outline-none"
            />
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <div className="flex items-center space-x-1">
                <Command className="w-3 h-3" />
                <span>K</span>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {isSearching ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center space-x-3 text-gray-500">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span>Searching with AI...</span>
              </div>
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => {
                    if (onSelect) onSelect(result);
                    onClose();
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                    index === selectedIndex ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className={`flex-shrink-0 ${getResultColor(result.type)}`}>
                        {getResultIcon(result.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-gray-900 truncate">
                            {result.title}
                          </h3>
                          {result.confidence && (
                            <div className="flex-shrink-0">
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                {Math.round(result.confidence * 100)}%
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {result.subtitle}
                        </p>
                      </div>
                    </div>
                    
                    {result.metadata?.edge !== undefined && (
                      <div className="flex-shrink-0 ml-3">
                        <span className={`text-sm font-medium ${
                          result.metadata.edge > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {result.metadata.edge > 0 ? '+' : ''}{result.metadata.edge.toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : query.trim() ? (
            <div className="p-8 text-center text-gray-500">
              <Search className="w-8 h-8 mx-auto mb-3 text-gray-300" />
              <p>No results found for "{query}"</p>
              <p className="text-sm mt-1">Try searching for players, props, or clips</p>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <Search className="w-8 h-8 mx-auto mb-3 text-gray-300" />
              <p>Start typing to search...</p>
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {['Gunner Stockton', 'Passing Yards', 'Video Clips', 'UGA vs Alabama'].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setQuery(suggestion)}
                    className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 text-xs text-gray-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span>↑↓ Navigate</span>
              <span>↵ Select</span>
              <span>ESC Close</span>
            </div>
            <span>Powered by TwelveLabs AI</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Global search hook
export function useSearch() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false)
  };
}