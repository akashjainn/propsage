'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock, TrendingUp, User, Video, X, Command } from 'lucide-react';
import { GlassOverlay, Spotlight } from './ui/motion';
import { easeOut, springGentle, staggerChildren, staggerItem } from '@/lib/motion';
import { useFastSWR } from '../hooks/usePerformance';
import { useDebouncedValue } from '../hooks/useOptimization';

interface PropLine {
  id: string;
  player: string;
  team: string;
  market: string;
  marketLine: number;
  fairLine: number;
  edgePct: number;
  confidence: number;
  gameId: string;
  gameTitle: string;
  bullets: string[];
  analysis: string;
}

interface SearchResult {
  id: string;
  type: 'player' | 'prop' | 'clip' | 'game';
  title: string;
  subtitle: string;
  confidence?: number;
  propData?: PropLine; // For prop results
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

// Comprehensive prop database for search (restricted to players with available clips)
const PROP_DATABASE: PropLine[] = [
  // Gunner Stockton props
  {
    id: 'stockton-passing-tds',
    player: 'Gunner Stockton',
    team: 'UGA',
    market: 'Passing TDs',
    marketLine: 1.5,
    fairLine: 1.9,
    edgePct: 21.3,
    confidence: 0.88,
    gameId: 'uga-alabama-20250927',
    gameTitle: 'Georgia vs Alabama',
    bullets: [
      'Red‑zone TD rate on Stockton drives: 42% (team baseline 34%)',
      'Alabama has allowed 1.7 passing TDs per game over last 4 weeks',
      'UGA increasing tempo packages (+9% pace) raising play volume',
      'Film: Stockton consistently wins on layered seam / play‑action concepts'
    ],
    analysis: 'Video shows Stockton manipulating linebackers with eye discipline on play‑action, opening intermediate windows. Matchup factors elevate projection from 1.4 to 1.9 TD passes with >57% probability of 2+.'
  },
  {
    id: 'stockton-longest-completion',
    player: 'Gunner Stockton',
    team: 'UGA',
    market: 'Longest Completion',
    marketLine: 37.5,
    fairLine: 42.0,
    edgePct: 12.0,
    confidence: 0.74,
    gameId: 'uga-alabama-20250927',
    gameTitle: 'Georgia vs Alabama',
    bullets: [
      'Averages 2.6 deep attempts (20+ air yds) per half',
      'Shot rate off play‑action on 2nd & short: 46% (top 10 nationally)',
      'Alabama surrendered five 35+ yard completions past 3 games',
      'Primary deep target usage trending up (target share 28% → 34%)'
    ],
    analysis: 'Georgia self‑scout shows early scripted vertical shot. Defensive rotation in Cover 6 leaves post window vulnerable; model gives 57% ≥38 yd completion vs implied 47%.'
  },
  {
    id: 'stockton-passing-yards',
    player: 'Gunner Stockton',
    team: 'UGA',
    market: 'Passing Yards',
    marketLine: 248.5,
    fairLine: 262.0,
    edgePct: 5.4,
    confidence: 0.73,
    gameId: 'uga-alabama-20250927',
    gameTitle: 'Georgia vs Alabama',
    bullets: [
      'Median projection lift due to pace + matchup: +13.5 yards',
      'Explosive pass rate for UGA last 3 weeks: 18% (season 13%)',
      'Alabama pressure rate dip (32% → 26%) without consistent interior push',
      'Stockton completion % in intermediate band (10–19 air yds): 71%'
    ],
    analysis: 'Intermediate efficiency plus stabilized pocket time boosts Stockton’s yardage floor. Alabama conceding more in‑breaking routes; model fair line 262 vs market 248.5.'
  },

  // Haynes King props
  {
    id: 'king-passing-yards',
    player: 'Haynes King',
    team: 'Georgia Tech',
    market: 'Passing Yards',
    marketLine: 245.5,
    fairLine: 265.2,
    edgePct: 8.0,
    confidence: 0.79,
    gameId: 'gt-wake-forest-20250927',
    gameTitle: 'Georgia Tech @ Wake Forest',
    bullets: [
      'King averages 268.7 passing yards per game in road starts this season',
      'Wake Forest secondary allows 8.2 yards per attempt (bottom ACC)',
      'Tempo offense runs 78.4 plays per game (pace drives raw volume)',
      'Exceeded 245.5 yards in 6 of 8 ACC matchups'
    ],
    analysis: 'Wake Forest communication lapses vs RPO glance / seam tags expand throwing lanes. King’s scramble‑to‑throw tendency raises yards vs static pressure looks.'
  },
  {
    id: 'king-rushing-yards',
    player: 'Haynes King',
    team: 'Georgia Tech',
    market: 'Rushing Yards',
    marketLine: 55.5,
    fairLine: 48.2,
    edgePct: -13.1,
    confidence: 0.72,
    gameId: 'gt-wake-forest-20250927',
    gameTitle: 'Georgia Tech @ Wake Forest',
    bullets: [
      'Baseline rushing output 42.3 yds (design + scramble) per game',
      'Wake Forest uses dedicated spy on 72% of mobile QB snaps',
      'Lane discipline limits explosive scramble chunk gains',
      'Negative edge indicates potential under value vs posted line'
    ],
    analysis: 'Scheme + spy usage suppress high‑end rushing outcomes. Retained to demonstrate negative edge surfacing in search results.'
  }
];

// Enhanced search with prop-focused results
const generateSearchResults = (query: string): SearchResult[] => {
  console.log('generateSearchResults called with query:', query);
  
  if (!query.trim()) {
    console.log('generateSearchResults: Empty query, returning empty array');
    return [];
  }

  const lowerQuery = query.toLowerCase();
  const results: SearchResult[] = [];
  const addedPropIds = new Set<string>(); // Track which props we've already added

  // COMPREHENSIVE PROP SEARCH: Search through all properties of props
  
  // Search through all props for any match in player name, market, team, or keywords
  PROP_DATABASE.forEach(prop => {
    let isMatch = false;
    let matchType = '';
    let confidence = prop.confidence;
    
    // Check player name match
    const playerName = prop.player.toLowerCase();
    if (playerName.includes(lowerQuery) || 
        playerName.replace(/\s/g, '').includes(lowerQuery.replace(/\s/g, ''))) {
      isMatch = true;
      matchType = 'player';
      confidence = prop.confidence; // High confidence for player matches
    }
    
    // Check market type match
    const market = prop.market.toLowerCase();
    if (market.includes(lowerQuery)) {
      isMatch = true;
      matchType = matchType || 'market';
      confidence = Math.max(confidence, 0.85); // Good confidence for market matches
    }
    
    // Check team match
    const team = prop.team.toLowerCase();
    if (team.includes(lowerQuery)) {
      isMatch = true;
      matchType = matchType || 'team';
      confidence = Math.max(confidence, 0.75); // Decent confidence for team matches
    }
    
    // Check specific keyword matches for common search terms
    const keywords = {
      'pass': ['passing'],
      'rush': ['rushing'],
      'receive': ['receiving'],
      'reception': ['receiving'],
      'catch': ['receiving'],
      'int': ['interception'],
      'pick': ['interception'],
      'td': ['touchdown'],
      'touchdown': ['touchdown'],
      'yards': ['yards']
    };
    
    for (const [searchTerm, marketKeywords] of Object.entries(keywords)) {
      if (lowerQuery.includes(searchTerm)) {
        const hasMatchingMarket = marketKeywords.some(keyword => market.includes(keyword));
        if (hasMatchingMarket) {
          isMatch = true;
          matchType = matchType || 'keyword';
          confidence = Math.max(confidence, 0.70);
        }
      }
    }
    
    // Add to results if we found a match and haven't added this prop yet
    if (isMatch && !addedPropIds.has(prop.id)) {
      addedPropIds.add(prop.id);
      
      // Create appropriate subtitle based on match type
      let subtitle = '';
      switch (matchType) {
        case 'player':
          subtitle = `${prop.team} | ${prop.market} | Market: ${prop.marketLine} | Edge: ${prop.edgePct > 0 ? '+' : ''}${prop.edgePct.toFixed(1)}%`;
          break;
        case 'market':
          subtitle = `${prop.team} | ${prop.player} | ${prop.marketLine} ${market.includes('yards') ? 'yards' : ''} | Edge: ${prop.edgePct > 0 ? '+' : ''}${prop.edgePct.toFixed(1)}%`;
          break;
        case 'team':
          subtitle = `${prop.team} | ${prop.player} - ${prop.market} | Edge: ${prop.edgePct > 0 ? '+' : ''}${prop.edgePct.toFixed(1)}%`;
          break;
        default:
          subtitle = `${prop.team} | ${prop.player} | ${prop.marketLine} | Edge: ${prop.edgePct > 0 ? '+' : ''}${prop.edgePct.toFixed(1)}%`;
      }
      
      results.push({
        id: `${matchType}-${prop.id}`,
        type: 'prop',
        title: `${prop.player} - ${prop.market}`,
        subtitle,
        confidence,
        propData: prop,
        metadata: { edge: prop.edgePct, team: prop.team }
      });
    }
  });
  
  // If still no results, try fuzzy matching on player names
  if (results.length === 0 && lowerQuery.length > 2) {
    PROP_DATABASE.forEach(prop => {
      const playerWords = prop.player.toLowerCase().split(' ');
      const queryWords = lowerQuery.split(' ');
      
      // Check if any word in the query partially matches any word in player name
      const hasPartialMatch = queryWords.some(queryWord => 
        queryWord.length > 2 && playerWords.some(playerWord => 
          playerWord.includes(queryWord) || queryWord.includes(playerWord)
        )
      );
      
      if (hasPartialMatch && !addedPropIds.has(prop.id)) {
        addedPropIds.add(prop.id);
        results.push({
          id: `fuzzy-${prop.id}`,
          type: 'prop',
          title: `${prop.player} - ${prop.market}`,
          subtitle: `${prop.team} | Partial match | Edge: ${prop.edgePct > 0 ? '+' : ''}${prop.edgePct.toFixed(1)}%`,
          confidence: 0.5, // Lower confidence for fuzzy matches
          propData: prop,
          metadata: { edge: prop.edgePct, team: prop.team }
        });
      }
    });
  }

  // Sort by confidence
  console.log('generateSearchResults: Final results before sorting:', results);
  const sortedResults = results.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
  console.log('generateSearchResults: Final sorted results:', sortedResults);
  return sortedResults;
};

export default function SearchModal({ isOpen, onClose, onSelect }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Debounce search query to improve performance
  const debouncedQuery = useDebouncedValue(query, 150);

  // Memoize search results generation to avoid recalculation
  const searchResults = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    return generateSearchResults(debouncedQuery);
  }, [debouncedQuery]);

  // Update results when debounced query or search results change
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    
    // Use requestIdleCallback for non-blocking search if available
    const scheduleSearch = () => {
      setResults(searchResults);
      setSelectedIndex(0);
      setIsSearching(false);
    };

    if ('requestIdleCallback' in window) {
      const idleCallback = window.requestIdleCallback(scheduleSearch, { timeout: 100 });
      return () => window.cancelIdleCallback(idleCallback);
    } else {
      const timeoutId = setTimeout(scheduleSearch, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [searchResults, debouncedQuery]);

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
        return 'text-primary-400';
      case 'prop':
        return 'text-secondary-400';
      case 'clip':
        return 'text-tertiary-400';
      case 'game':
        return 'text-accent-400';
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
            className="w-full max-w-2xl mx-4 overflow-hidden bg-[var(--surface)] border border-[var(--border-strong)] rounded-3xl shadow-brand-glow backdrop-blur-xl"
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
                    <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="font-medium">Searching</span>
                  </div>
                </motion.div>
              ) : results.length > 0 ? (
                <div className="p-4 space-y-2">
                  <div className="text-white text-sm mb-4">Showing {results.length} results:</div>
                  {results.map((result, index) => (
                    <button
                      key={result.id}
                      onClick={() => {
                        console.log('SearchModal: Result clicked:', result);
                        if (onSelect) {
                          onSelect(result);
                        }
                        onClose();
                      }}
                      className={`w-full text-left bg-white/5 hover:bg-white/10 rounded-lg p-3 transition-all duration-200 cursor-pointer ${
                        index === selectedIndex ? 'ring-2 ring-primary-400 bg-primary-500/10' : ''
                      }`}
                    >
                      <div className="text-white font-semibold">{result.title}</div>
                      <div className="text-white/60 text-sm">{result.subtitle}</div>
                      {result.confidence && (
                        <div className="text-xs text-white/40 mt-1">
                          {Math.round(result.confidence * 100)}% match
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ) : query.trim() ? (
                <div className="p-8 text-center text-white/50">
                  <div className="text-white/60 mb-2">No results found for "{query}"</div>
                  <div className="text-sm text-white/40">Try searching for players, teams, or props</div>
                </div>
              ) : (
                <div className="p-8 text-center text-white/50">
                  <div className="text-white/60 mb-4">Start typing to search...</div>
                  <div className="text-sm text-white/40">Try: "Gunner Stockton", "Haynes King", "Passing Yards"</div>
                </div>
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