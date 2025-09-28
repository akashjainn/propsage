'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock, TrendingUp, User, Video, X, Command } from 'lucide-react';
import { GlassOverlay, Spotlight } from './ui/motion';
import { easeOut, springGentle, staggerChildren, staggerItem } from '@/lib/motion';
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

    // Haynes King matches (LIVE GAME)
    if (lowerQuery.includes('haynes') || lowerQuery.includes('king')) {
      results.push({
        id: 'player-haynes',
        type: 'player',
        title: 'Haynes King',
        subtitle: 'Georgia Tech QB • LIVE',
        confidence: 0.96,
        metadata: { position: 'QB', team: 'GT' }
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

  // More flexible matching for common terms
  if (lowerQuery.includes('qb') || lowerQuery.includes('quarterback')) {
    results.push({
      id: 'player-gunner',
      type: 'player',
      title: 'Gunner Stockton',
      subtitle: 'Georgia Bulldogs QB',
      confidence: 0.90,
      metadata: { position: 'QB', team: 'UGA' }
    });
  }
  
  if (lowerQuery.includes('georgia') || lowerQuery.includes('uga') || lowerQuery.includes('bulldogs')) {
    results.push({
      id: 'team-georgia',
      type: 'game',
      title: 'Georgia Bulldogs',
      subtitle: 'Current games and players',
      confidence: 0.88,
      metadata: { team: 'UGA' }
    });
  }
  
  if (lowerQuery.includes('tech') || lowerQuery.includes('gt') || lowerQuery.includes('yellow jackets')) {
    results.push({
      id: 'team-gt',
      type: 'game', 
      title: 'Georgia Tech',
      subtitle: 'Yellow Jackets • Live Game',
      confidence: 0.92,
      metadata: { team: 'GT' }
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

  // Focus input when modal opens, clear query when it closes
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    } else if (!isOpen) {
      // Clear the query when modal closes to prevent it from persisting
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
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
        return 'text-blue-400';
      case 'prop':
        return 'text-[var(--mint)]';
      case 'clip':
        return 'text-purple-400';
      case 'game':
        return 'text-orange-400';
      default:
        return 'text-white/50';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <GlassOverlay isOpen={isOpen} onClose={onClose}>
          <motion.div 
            ref={modalRef}
            className="w-full max-w-2xl mx-4 overflow-hidden glass-strong rounded-3xl"
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={springGentle}
          >
            {/* Header */}
            <div className="border-b border-white/10 p-6">
              <div className="flex items-center space-x-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ ...springGentle, delay: 0.1 }}
                  className="p-2 rounded-xl glass-subtle"
                >
                  <Search className="w-5 h-5 text-white/70" />
                </motion.div>
                
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search players, props, clips..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 text-lg font-medium text-white placeholder-white/40 bg-transparent border-none outline-none ring-0 focus:outline-none focus:ring-0"
                  autoComplete="off"
                  spellCheck="false"
                />
                
                <div className="flex items-center space-x-3">
                  <motion.div 
                    className="flex items-center space-x-1 px-2 py-1 rounded-lg glass-subtle text-xs font-medium text-white/60"
                    whileHover={{ scale: 1.05 }}
                    transition={springGentle}
                  >
                    <Command className="w-3 h-3" />
                    <span>K</span>
                  </motion.div>
                  
                  <motion.button
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/60 hover:text-white"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={springGentle}
                    aria-label="Close search"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto custom-scroll">
              {isSearching ? (
                <motion.div 
                  className="p-8 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={easeOut}
                >
                  <div className="inline-flex items-center space-x-3 text-white/60">
                    <div className="w-4 h-4 border-2 border-[var(--mint)] border-t-transparent rounded-full animate-spin"></div>
                    <span className="font-medium">Searching</span>
                  </div>
                </motion.div>
              ) : results.length > 0 ? (
                <motion.div 
                  className="p-4 space-y-2"
                  variants={staggerChildren(0.05)}
                  initial="initial"
                  animate="animate"
                >
                  {results.map((result, index) => (
                    <motion.div key={result.id} variants={staggerItem}>
                      <Spotlight isActive={index === selectedIndex}>
                        <motion.button
                          onClick={() => {
                            if (onSelect) onSelect(result);
                            onClose();
                          }}
                          className={`w-full p-4 text-left rounded-2xl transition-all glass-subtle hover:glass ${
                            index === selectedIndex 
                              ? 'accent-ring ring-2 bg-white/10' 
                              : 'hover:bg-white/5'
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          transition={springGentle}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 flex-1 min-w-0">
                              <motion.div 
                                className={`p-2 rounded-xl glass-subtle ${getResultColor(result.type)}`}
                                whileHover={{ scale: 1.1 }}
                                transition={springGentle}
                              >
                                {getResultIcon(result.type)}
                              </motion.div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h3 className="font-semibold text-white truncate">
                                    {result.title}
                                  </h3>
                                  {result.confidence && (
                                    <motion.div 
                                      className="flex-shrink-0"
                                      whileHover={{ scale: 1.1 }}
                                      transition={springGentle}
                                    >
                                      <span className="text-xs glass-subtle text-white/70 px-2 py-1 rounded-lg font-medium">
                                        {Math.round(result.confidence * 100)}%
                                      </span>
                                    </motion.div>
                                  )}
                                </div>
                                <p className="text-sm text-white/60 truncate">
                                  {result.subtitle}
                                </p>
                              </div>
                            </div>
                            
                            {result.metadata?.edge !== undefined && (
                              <motion.div 
                                className="flex-shrink-0 ml-4"
                                whileHover={{ scale: 1.1 }}
                                transition={springGentle}
                              >
                                <span className={`text-sm font-bold px-2 py-1 rounded-lg ${
                                  result.metadata.edge > 0 
                                    ? 'text-green-400 bg-green-400/10 border border-green-400/20' 
                                    : 'text-red-400 bg-red-400/10 border border-red-400/20'
                                }`}>
                                  {result.metadata.edge > 0 ? '+' : ''}{result.metadata.edge.toFixed(1)}%
                                </span>
                              </motion.div>
                            )}
                          </div>
                        </motion.button>
                      </Spotlight>
                    </motion.div>
                  ))}
                </motion.div>
              ) : query.trim() ? (
                <motion.div 
                  className="p-8 text-center text-white/50"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={easeOut}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ ...springGentle, delay: 0.1 }}
                  >
                    <Search className="w-12 h-12 mx-auto mb-4 text-white/20" />
                  </motion.div>
                  <p className="font-medium text-white/60 mb-1">No results found for "{query}"</p>
                  <p className="text-sm text-white/40">Try searching for players, props, or clips</p>
                </motion.div>
              ) : (
                <motion.div 
                  className="p-8 text-center text-white/50"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={easeOut}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ ...springGentle, delay: 0.1 }}
                  >
                    <Search className="w-12 h-12 mx-auto mb-4 text-white/20" />
                  </motion.div>
                  <p className="font-medium text-white/60 mb-6">Start typing to search...</p>
                  
                  <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
                    {['Haynes King', 'Passing Yards', 'Video Clips', 'GT Live Game'].map((suggestion, index) => (
                      <motion.button
                        key={suggestion}
                        onClick={() => setQuery(suggestion)}
                        className="text-sm glass-subtle text-white/70 hover:text-white px-4 py-2 rounded-xl transition-all font-medium text-center"
                        variants={staggerItem}
                        whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                        whileTap={{ scale: 0.95 }}
                        transition={springGentle}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        {suggestion}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <motion.div 
              className="border-t border-white/10 px-6 py-4 glass-subtle text-xs text-white/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ ...easeOut, delay: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-1">
                    <span className="px-1.5 py-0.5 rounded glass-subtle text-white/50 font-mono">↑↓</span>
                    <span className="font-medium">Navigate</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="px-1.5 py-0.5 rounded glass-subtle text-white/50 font-mono">↵</span>
                    <span className="font-medium">Select</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="px-1.5 py-0.5 rounded glass-subtle text-white/50 font-mono text-xs">ESC</span>
                    <span className="font-medium">Close</span>
                  </div>
                </div>
                <span className="text-white/40 font-medium">Powered by TwelveLabs AI</span>
              </div>
            </motion.div>
          </motion.div>
        </GlassOverlay>
      )}
    </AnimatePresence>
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