'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock, TrendingUp, User, Video, X, Command } from 'lucide-react';
import { GlassOverlay, Spotlight } from './ui/motion';
import { easeOut, springGentle, staggerChildren, staggerItem } from '@/lib/motion';
import { useFastSWR } from '../hooks/usePerformance';

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

// Comprehensive prop database for search
const PROP_DATABASE: PropLine[] = [
  // Jayden Maiava props
  {
    id: 'maiava-interceptions',
    player: 'Jayden Maiava',
    team: 'USC',
    market: 'Interceptions',
    marketLine: 0.5,
    fairLine: 0.8,
    edgePct: 24.1,
    confidence: 0.91,
    gameId: 'illinois-usc-20250927',
    gameTitle: 'Illinois @ USC',
    bullets: [
      'Maiava has thrown interceptions in 3 of his last 4 starts, averaging 1.2 per game',
      'Illinois defense ranks #12 nationally in interceptions with 18 picks this season',
      'USC offensive line allows pressure on 42% of dropbacks, forcing rushed decisions',
      'Weather conditions show 15+ mph winds which historically increase INT rates by 23%'
    ],
    analysis: 'Video analysis shows Maiava struggling with pocket presence under pressure, particularly on third downs where he\'s forced 6 interceptions this season. The Illinois secondary has excellent ball skills and creates 2.1 turnover opportunities per game. Combined with USC\'s porous pass protection, we project a 67% chance of 1+ interceptions.'
  },
  {
    id: 'maiava-passing-yards',
    player: 'Jayden Maiava',
    team: 'USC',
    market: 'Passing Yards',
    marketLine: 285.5,
    fairLine: 295.8,
    edgePct: 3.6,
    confidence: 0.78,
    gameId: 'illinois-usc-20250927',
    gameTitle: 'Illinois @ USC',
    bullets: [
      'Maiava averages 298.4 passing yards per game in home starts this season',
      'Illinois allows 4.2 yards per attempt more than USC\'s season average',
      'USC\'s receiving corps is fully healthy for first time in 4 weeks',
      'Home field advantage at Coliseum adds 18.7 passing yards per game historically'
    ],
    analysis: 'Film breakdown reveals Illinois struggles with USC\'s bunch formations and crossing routes, which comprise 38% of Maiava\'s completions. The Trojans should establish tempo early with quick game concepts that have been effective against similar defensive schemes.'
  },
  
  // Luke Altmyer props (Illinois)
  {
    id: 'altmyer-passing-yards',
    player: 'Luke Altmyer',
    team: 'Illinois',
    market: 'Passing Yards',
    marketLine: 275.5,
    fairLine: 295.0,
    edgePct: 7.1,
    confidence: 0.83,
    gameId: 'illinois-usc-20250927',
    gameTitle: 'Illinois vs USC',
    bullets: [
      'Altmyer averages 298.4 passing yards per game in his last 6 starts',
      'Illinois has increased pass attempts by 12% in recent games',
      'USC defense allows 4th most passing yards per game in Pac-12 (284.7)',
      'Altmyer has exceeded 275.5 yards in 4 of his last 5 games'
    ],
    analysis: 'Film study shows Altmyer excels in play-action situations where he completes 78% of attempts. USC\'s defense struggles with misdirection plays and RPOs, which are staples of Illinois\' offense. The Fighting Illini should have success attacking the middle of the field.'
  },
  {
    id: 'altmyer-rushing-touchdowns',
    player: 'Luke Altmyer',
    team: 'Illinois',
    market: 'Rushing Touchdowns',
    marketLine: 0.5,
    fairLine: 0.8,
    edgePct: 18.4,
    confidence: 0.79,
    gameId: 'illinois-usc-20250927',
    gameTitle: 'Illinois vs USC',
    bullets: [
      'Altmyer has scored rushing TDs in 3 of his last 4 games',
      'Illinois runs designed QB runs inside the red zone 34% of the time',
      'USC allows 0.8 rushing TDs per game to QBs this season',
      'Altmyer has 6 rushing TDs on the season, tied for team lead'
    ],
    analysis: 'Illinois frequently uses Altmyer in short-yardage and goal-line situations. His mobility creates problems for USC\'s defense, and the Illini coaching staff has shown confidence in his ability to punch in scores with his legs.'
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
      'Wake Forest secondary allows 8.2 yards per attempt, worst in ACC',
      'Georgia Tech\'s tempo offense runs 78.4 plays per game, 5th highest nationally',
      'King has exceeded 245.5 yards in 6 of 8 games against ACC opponents'
    ],
    analysis: 'Wake Forest\'s defensive film reveals consistent breakdowns in coverage communication, particularly against RPO concepts that comprise 45% of GT\'s offense. King\'s mobility creates additional passing windows when initial reads are covered.'
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
      'King averages 42.3 rushing yards per game this season',
      'Wake Forest allows only 3.8 yards per carry to mobile QBs',
      'GT offensive line struggles in short-yardage situations (58% success rate)',
      'Wake\'s defensive coordinator emphasizes QB spy coverage (72% of snaps)'
    ],
    analysis: 'Wake Forest has effectively contained mobile quarterbacks this season by using a dedicated spy and forcing King to beat them with his arm rather than legs. Their disciplined rush lane integrity limits scramble opportunities.'
  },
  
  // Makai Lemon props (USC)
  {
    id: 'lemon-receiving-yards',
    player: 'Makai Lemon',
    team: 'USC',
    market: 'Receiving Yards',
    marketLine: 85.5,
    fairLine: 95.0,
    edgePct: 11.1,
    confidence: 0.76,
    gameId: 'illinois-usc-20250927',
    gameTitle: 'Illinois vs USC',
    bullets: [
      'Lemon has exceeded 85.5 receiving yards in 4 of his last 6 games',
      'Illinois defense ranks #28 against slot receivers, allowing 9.1 yards per target',
      'USC QB Jayden Maiava has 72% completion rate when targeting Lemon',
      'Lemon averages 8.7 targets per game and leads USC in receptions'
    ],
    analysis: 'Film breakdown shows Lemon excels on crossing routes and slants, which Illinois struggles to defend. He has developed strong chemistry with Maiava, particularly on intermediate routes. The Trojans should target the middle of the field where Illinois is most vulnerable.'
  },
  
  // Nico Iamaleava props (Tennessee)
  {
    id: 'nico-passing-yards',
    player: 'Nico Iamaleava', 
    team: 'Tennessee',
    market: 'Passing Yards',
    marketLine: 268.5,
    fairLine: 285.2,
    edgePct: 6.2,
    confidence: 0.81,
    gameId: 'tennessee-georgia-20250927',
    gameTitle: 'Tennessee @ Georgia',
    bullets: [
      'Iamaleava averages 281.7 passing yards per game this season',
      'Tennessee\'s tempo offense ranks 8th nationally in plays per game',
      'Georgia allows 245.3 passing yards per game, but struggles vs mobile QBs',
      'Iamaleava has exceeded 268.5 yards in 5 of his last 7 starts'
    ],
    analysis: 'Iamaleava\'s dual-threat ability creates problems for Georgia\'s defense. His accuracy on rollouts and bootlegs is exceptional (79% completion rate). Tennessee should find success with play-action concepts that take advantage of their strong running game.'
  },
  
  // Ryan Williams props (Alabama)
  {
    id: 'williams-receiving-yards',
    player: 'Ryan Williams',
    team: 'Alabama',
    market: 'Receiving Yards', 
    marketLine: 92.5,
    fairLine: 105.8,
    edgePct: 14.4,
    confidence: 0.88,
    gameId: 'alabama-auburn-20250927',
    gameTitle: 'Alabama vs Auburn',
    bullets: [
      'Williams averages 106.2 receiving yards per game over his last 8 games',
      'Auburn defense allows 4th most receiving yards to WR1s (118.7 per game)',
      'Alabama QB Jalen Milroe targets Williams 11.4 times per game on average',
      'Williams has exceeded 92.5 yards in 7 of his last 9 games'
    ],
    analysis: 'Williams is Alabama\'s primary receiving threat and Auburn has struggled to contain elite WR1s this season. His route-running precision and speed make him a mismatch for Auburn\'s secondary. Expect heavy target share in this rivalry game.'
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

  // Simulate search delay for realism
  useEffect(() => {
    console.log('SearchModal: Query changed:', query);
    
    if (!query.trim()) {
      console.log('SearchModal: Empty query, clearing results');
      setResults([]);
      setIsSearching(false);
      return;
    }

    console.log('SearchModal: Starting search for:', query);
    setIsSearching(true);
    const searchDelay = setTimeout(() => {
      const searchResults = generateSearchResults(query);
      console.log('SearchModal: Search results generated:', searchResults);
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
                  <div className="text-sm text-white/40">Try: "Jayden Maiava", "Georgia Tech", "Passing Yards"</div>
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