'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import MatchupHero from '@/components/MatchupHero';
import { AppShell, SectionHeader, Card, CTAButton, Badge, StatCard } from '@/ui';
import type { GameLite, GameState } from '@/types/cfb';
import SearchModal, { useSearch } from '@/components/SearchModal';
import { PropDrawer } from '@/components/PropDrawer';
import WhyCard from '@/components/WhyCard';
import GameDashboard from '@/components/GameDashboard';
import PropsGrid from '@/components/PropsGrid';
import type { Clip } from '@/components/clip.types';
import { useFastSWR, preloadResources, trackWebVitals } from '@/hooks/usePerformance';
import { TrendingUp, TrendingDown, Play, Search, Command } from 'lucide-react';
import { TeamLogo } from '@/components/TeamLogo';
import { safeFetch, ENDPOINTS } from '@/lib/api';

// Default fallback game placeholder (will be replaced by live fetch)
const GT_FALLBACK_GAME: GameLite = {
  id: 'pending',
  start: new Date().toISOString(),
  state: 'pre',
  home: { id: 'gt', name: 'Georgia Tech Yellow Jackets', short: 'Georgia Tech', abbrev: 'GT', logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncf/500/59.png&h=200&w=200', color: 'B3A369', rank: 24 },
  away: { id: 'wf', name: 'Wake Forest Demon Deacons', short: 'Wake Forest', abbrev: 'WF', logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncf/500/154.png&h=200&w=200', color: '9E7E38', rank: null },
  venue: { name: 'Loading…' },
  broadcast: { network: '—' }
};

const ILLINOIS_USC_GAME: GameLite = {
  id: 'illinois-usc-20250927',
  start: '2025-09-27T16:10:00.000Z',
  state: 'post',
  home: { id: 'illinois', name: 'Illinois Fighting Illini', short: 'Illinois', abbrev: 'ILL', logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncf/500/356.png&h=200&w=200', color: 'E84A27' },
  away: { id: 'usc', name: 'USC Trojans', short: 'USC', abbrev: 'USC', logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncf/500/30.png&h=200&w=200', color: '990000' },
  venue: { name: 'Gies Memorial Stadium', city: 'Champaign', state: 'Illinois' },
  broadcast: { network: 'BTN' },
  homeScore: 34,
  awayScore: 32
};

const GT_DEMO_PROPS = [
  {
    id: 'haynes-king-passing-yards',
    player: 'Haynes King',
    prop: 'Passing Yards',
    market: 215.5,
    fair: 225.8,
    edge: 4.8,
    position: 'QB',
    team: 'GT',
    confidence: 92
  },
  {
    id: 'haynes-king-rushing-yards',
    player: 'Haynes King',
    prop: 'Rushing Yards',
    market: 45.5,
    fair: 41.2,
    edge: -2.8,
    position: 'QB',
    team: 'GT',
    confidence: 88
  },
  {
    id: 'haynes-passing-tds',
    player: 'Haynes King',
    prop: 'Passing Touchdowns',
    market: 1.5,
    fair: 1.75,
    edge: 3.2,
    position: 'QB',
    team: 'GT',
    confidence: 89
  }
];

const ILLINOIS_DEMO_PROPS = [
  {
    id: 'luke-altmyer-passing-yards',
    player: 'Luke Altmyer',
    prop: 'Passing Yards',
    market: 295.2,
    fair: 328,
    edge: 11.1,
    position: 'QB',
    team: 'ILL',
    confidence: 94
  },
  {
    id: 'luke-altmyer-passing-tds',
    player: 'Luke Altmyer',
    prop: 'Passing Touchdowns',
    market: 2.5,
    fair: 3,
    edge: 20.0,
    position: 'QB',
    team: 'ILL',
    confidence: 91
  },
  {
    id: 'kaden-feagin-receiving-yards',
    player: 'Kaden Feagin',
    prop: 'Receiving Yards',
    market: 56.3,
    fair: 64,
    edge: 13.7,
    position: 'RB',
    team: 'ILL',
    confidence: 89
  },
  {
    id: 'justin-bowick-receiving-yards',
    player: 'Justin Bowick',
    prop: 'Receiving Yards',
    market: 22.0,
    fair: 25,
    edge: 13.6,
    position: 'WR',
    team: 'ILL',
    confidence: 87
  }
];

interface PropRowProps {
  prop: typeof GT_DEMO_PROPS[0];
  onClick: () => void;
  isSelected?: boolean;
}

function PropRow({ prop, onClick, isSelected }: PropRowProps) {
  const isOver = prop.edge > 0;
  const edgeColor = isOver ? 'text-green-600' : 'text-red-600';
  const edgeBg = isOver ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';

  return (
    <button
      onClick={onClick}
      className={`w-full p-4 rounded-xl border transition-all duration-200 hover:scale-[1.01] hover:shadow-lg ${
        isSelected 
          ? 'border-blue-500 bg-blue-50 shadow-lg' 
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-left">
            <div className="font-semibold text-gray-900">{prop.prop}</div>
            <div className="text-sm text-gray-500">{prop.player}</div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-lg font-mono font-bold text-gray-900">
              {prop.market}
            </div>
            <div className="text-sm text-gray-500">Market</div>
          </div>
          
          <div className={`px-3 py-1 rounded-full border ${edgeBg}`}>
            <span className={`text-sm font-medium ${edgeColor}`}>
              {prop.edge > 0 ? '+' : ''}{prop.edge.toFixed(1)}% {isOver ? 'OVER' : 'UNDER'}
            </span>
          </div>
          
          <Play className="w-5 h-5 text-gray-400" />
        </div>
      </div>
    </button>
  );
}

// Mock precomputed insights bullets (would come from insights.demo.json)
const INSIGHTS: Record<string,string[]> = {
  'haynes-passing-yards': [
    'GT leaning pass early; scripted shots successful',
    'Opponent allowing explosive passes on play-action',
    'Tempo elevated first half → extra drive potential'
  ],
  'haynes-rushing-yards': [
    'QB keepers live vs light box looks',
    'Edge contain breaking down on boot action',
    'Designed draw success rate high tonight'
  ],
  'haynes-passing-tds': [
    'Red zone play-action working; TE seams open',
    'Shot plays generating DPI / chunk gains',
    'High RPO success forcing linebackers to commit'
  ],
  'luke-altmyer-passing-yards': [
    'Altmyer connecting on deep balls vs USC secondary',
    'Illinois offensive line giving clean pockets',
    'USC pass rush neutralized by quick game'
  ],
  'luke-altmyer-passing-tds': [
    'Red zone efficiency at 75% with Altmyer at helm',
    'Trick play TD to Beatty shows creativity',
    'USC linebackers struggling with RPO reads'
  ],
  'kaden-feagin-receiving-yards': [
    'Feagin creating explosive plays as pass-catcher',
    '64-yard TD shows breakaway speed vs USC',
    'Dual-threat ability opening up Illinois offense'
  ],
  'justin-bowick-receiving-yards': [
    'Bowick finding soft spots in USC zone coverage',
    '25-yard TD showcases precise route running',
    'Late-game target for Altmyer in clutch situations'
  ]
};

// TwelveLabs clips will be fetched dynamically via PropDrawer
// No need for static DEMO_CLIPS - this will be handled by TwelveLabs integration
const DEMO_CLIPS: Clip[] = []; // Empty - will be populated by TwelveLabs search

interface TeamInputProps { value: string; onChange: (v: string)=>void; loading?: boolean; }
const TeamInput: React.FC<TeamInputProps> = ({ value, onChange, loading }) => (
  <div className="relative">
    <input
      value={value}
      onChange={e=>onChange(e.target.value)}
      placeholder="Find team (e.g. GT, Georgia Tech, Illinois)"
      className="px-3 py-2 pr-8 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/40 placeholder:text-white/40 w-full"
      aria-label="Team search"
    />
    {loading && (
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white/40 text-xs">...</div>
    )}
  </div>
);

export default function DemoPage() {
  const [showGameDashboard, setShowGameDashboard] = useState(false);
  const search = useSearch();
  const [teamQuery, setTeamQuery] = useState('Georgia Tech');
  const [game, setGame] = useState<GameLite>(GT_FALLBACK_GAME);
  const [currentGameType, setCurrentGameType] = useState<'GT' | 'ILLINOIS'>('GT');
  const [gamesToday, setGamesToday] = useState<GameLite[]>([]);
  const [loadingGame, setLoadingGame] = useState(true);
  const [loadingTeamSwitch, setLoadingTeamSwitch] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Props-related state
  const [propInsights, setPropInsights] = useState<any[]>([]);
  const [loadingProps, setLoadingProps] = useState(false);
  const [selectedProp, setSelectedProp] = useState<any>(null);
  const [showPropsGrid, setShowPropsGrid] = useState(false);

  const fetchGameForTeam = useCallback(async (team: string, silent = false) => {
    if (!silent) setLoadingTeamSwitch(true);
    try {
      setError(null);
      
      // Check for Illinois first
      if (team.toLowerCase().includes('illinois') || team.toLowerCase().includes('illini')) {
        handleTeamSwitch(team);
        return;
      }
      
      const json = await safeFetch<{ games: GameLite[] }>(ENDPOINTS.gamesForTeam(team));
      if (!json) throw new Error('network');
      const first: GameLite | undefined = json.games?.[0];
      if (first) {
        setGame(first);
        setCurrentGameType('GT');
      }
    } catch (e: any) {
      setError('Schedule temporarily unavailable');
    } finally {
      setLoadingGame(false);
      setLoadingTeamSwitch(false);
    }
  }, []);

  const fetchToday = useCallback(async ()=>{
    try {
      const arr = await safeFetch<GameLite[]>(ENDPOINTS.gamesToday);
      if (!arr) return;
      // Sort: live first, then upcoming by start time
      const order = (g: GameLite) => g.state === 'in' ? 0 : g.state === 'pre' ? 1 : 2;
      arr.sort((a,b)=> order(a)-order(b) || a.start.localeCompare(b.start));
      setGamesToday(arr.slice(0,8));
    } catch { /* silent */ }
  }, []);

  const fetchProps = useCallback(async (gameId: string) => {
    setLoadingProps(true);
    try {
      const data = await safeFetch<{ insights: any[] }>(ENDPOINTS.insightsForGame(gameId));
      if (!data) throw new Error('Failed to fetch props');
      setPropInsights(data.insights || []);
    } catch (error) {
      console.error('Error fetching props:', error);
      setPropInsights([]);
    } finally {
      setLoadingProps(false);
    }
  }, []);

  // initial load
  useEffect(()=> { fetchGameForTeam('Georgia Tech'); fetchToday(); }, [fetchGameForTeam, fetchToday]);
  
  // Auto-search when teamQuery changes (debounced)
  useEffect(() => {
    if (!teamQuery.trim() || teamQuery === 'Georgia Tech') return;
    const searchDelay = setTimeout(() => {
      fetchGameForTeam(teamQuery, true); // silent = true to avoid loading states
    }, 800);
    return () => clearTimeout(searchDelay);
  }, [teamQuery]); // Removed fetchGameForTeam from deps to prevent re-renders

  // polling logic for selected game
  useEffect(()=> {
    if (!game) return;
    let interval = 60000; // pre default
    if (game.state === 'in') interval = 15000; else if (game.state === 'pre') {
      const startMs = new Date(game.start).getTime();
      if (startMs - Date.now() < 10*60*1000) interval = 15000; // within 10m
    } else if (game.state === 'post') return; // stop
    const id = setInterval(()=> fetchGameForTeam(teamQuery, true), interval);
    return ()=> clearInterval(id);
  }, [game, teamQuery, fetchGameForTeam]);

  // poll today list (light)
  useEffect(()=> { const id = setInterval(fetchToday, 60000); return ()=>clearInterval(id); }, [fetchToday]);



  const countdown = useMemo(()=>{
    if (!game) return null;
    if (game.state === 'in') return 'LIVE';
    if (game.state === 'post') return 'FINAL';
    const ms = new Date(game.start).getTime() - Date.now();
    if (ms <= 0) return 'LIVE';
    const h = Math.floor(ms/3600000); const m = Math.floor((ms%3600000)/60000); const s = Math.floor((ms%60000)/1000);
    return `${h>0? h+ 'h ': ''}${m}m ${h===0? s+'s':''}`.trim();
  }, [game]);

  const isLive = game?.state === 'in' || countdown === 'LIVE';

  // Always treat game.home / game.away as delivered; remove GT-specific perspective swap
  const displayHome = game?.home;
  const displayAway = game?.away;

  // Initialize performance tracking
  useEffect(() => {
    preloadResources();
    trackWebVitals();
  }, []);

  // Fetch props when game changes
  useEffect(() => {
    if (game && game.id !== 'pending') {
      const gameId = currentGameType === 'ILLINOIS' ? 'illinois-usc' : 'gt-wake';
      fetchProps(gameId);
    }
  }, [game, currentGameType, fetchProps]);

  // Demo flow: Hero → Unified Game Dashboard → Video Drawer
  const handleOpenGameDashboard = () => {
    setShowGameDashboard(true);
    setShowPropsGrid(true);
    // Ensure we have props loaded
    if (propInsights.length === 0 && game && game.id !== 'pending') {
      const gameId = currentGameType === 'ILLINOIS' ? 'illinois-usc' : 'gt-wake';
      fetchProps(gameId);
    }
  };

  const handleTeamSwitch = (team: string) => {
    if (team.toLowerCase().includes('illinois') || team.toLowerCase().includes('illini')) {
      setCurrentGameType('ILLINOIS');
      setGame(ILLINOIS_USC_GAME);
      setShowPropsGrid(true);
    } else {
      setCurrentGameType('GT');
      setGame(GT_FALLBACK_GAME);
      setShowPropsGrid(true);
    }
  };

  const handlePropClick = (prop: any) => {
    setSelectedProp(prop);
    // Could open PropDrawer here or navigate to detailed analysis
    console.log('Prop clicked:', prop);
  };



  const handleSearchSelect = (result: any) => {
    console.log('Search selected:', result);
    // Handle search result selection
  };

  const ShellWrapper: React.FC<{children:React.ReactNode}> = ({children}) => <AppShell>{children}</AppShell>;

  // Show GameDashboard if active
  if (showGameDashboard) {
    const gameId = currentGameType === 'ILLINOIS' ? 'illinois-usc-20250927' : 'gt-wake-forest-20250927';
    const gameTitle = currentGameType === 'ILLINOIS' ? 'Illinois vs USC' : 'Georgia Tech vs Wake Forest';
    
    return (
      <GameDashboard
        gameId={gameId}
        gameTitle={gameTitle}
        onBack={() => setShowGameDashboard(false)}
      />
    );
  }

  // Main hero view
  return (
    <ShellWrapper>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
          <SectionHeader 
            title="Matchup" 
            subtitle="Live narrative + video intelligence overlay" 
            action={
              <CTAButton onClick={handleOpenGameDashboard}>
                View Props
              </CTAButton>
            } 
          />
          <div className="flex items-center justify-between mb-4">
            <TeamInput value={teamQuery} onChange={setTeamQuery} loading={loadingTeamSwitch} />
            {error && <span className="text-sm text-red-300">{error}</span>}
          </div>
            <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex-1 text-center">
                  <div className="mx-auto w-20 h-20 mb-3 rounded-full bg-white/5 flex items-center justify-center overflow-hidden">
                    <TeamLogo src={displayAway?.logo} alt={displayAway?.short || 'Away Team'} size={64} />
                  </div>
                  <div className="text-lg font-semibold flex items-center justify-center gap-2">
                    {displayAway?.short}
                    {displayAway?.rank && <Badge color="sky">#{displayAway.rank}</Badge>}
                  </div>
                </div>
                <div className="px-4 text-center">
                  <div className="text-sm tracking-wide text-white/60 mb-1">{isLive ? 'Score' : 'Kickoff'}</div>
                  <div className="text-3xl font-bold tabular-nums mb-1">
                    {isLive || game.state === 'post' ? (
                      <>
                        {game.awayScore ?? 0} <span className="text-white/40">–</span> {game.homeScore ?? 0}
                      </>
                    ) : countdown}
                  </div>
                  <div className="text-xs text-white/50">
                    {isLive ? `Q${game.period ?? '?'} • ${game.clock ?? ''}` : new Date(game.start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  </div>
                  {isLive && <Badge color="emerald">LIVE</Badge>}
                  {game.state==='post' && <Badge>FINAL</Badge>}
                </div>
                <div className="flex-1 text-center">
                  <div className="mx-auto w-20 h-20 mb-3 rounded-full bg-white/5 flex items-center justify-center overflow-hidden">
                    <TeamLogo src={displayHome?.logo} alt={displayHome?.short || 'Home Team'} size={64} />
                  </div>
                  <div className="text-lg font-semibold flex items-center justify-center gap-2">
                    {displayHome?.short}
                    {displayHome?.rank && <Badge color="sky">#{displayHome.rank}</Badge>}
                  </div>
                </div>
              </div>
              <div className="text-center text-sm text-white/60">
                {game.venue?.name} {game.venue?.city && `• ${game.venue.city}`}
                {game.broadcast?.network && <span className="ml-2 text-white/40">{game.broadcast.network}</span>}
              </div>
            </div>
          </div>
          
          {/* Props Grid Section */}
          {showPropsGrid && (
            <div className="space-y-6">
              <SectionHeader 
                title="Player Props" 
                subtitle={`${currentGameType === 'ILLINOIS' ? 'Illinois vs USC' : 'Georgia Tech vs Wake Forest'} • Market vs Fair Analysis`}
              />
              {loadingProps ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-6 rounded-xl border border-white/10 bg-white/5 animate-pulse">
                      <div className="h-4 bg-white/10 rounded w-3/4 mb-3"></div>
                      <div className="h-3 bg-white/10 rounded w-1/2 mb-4"></div>
                      <div className="h-8 bg-white/10 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <PropsGrid
                  props={propInsights}
                  onPropClick={handlePropClick}
                  selectedPropId={selectedProp ? `${selectedProp.playerId}-${selectedProp.propType}` : undefined}
                />
              )}
            </div>
          )}
          
          {/* Today's Games side panel */}
          <div className="lg:col-span-4 space-y-4">
            <SectionHeader title="Today's CFB" subtitle="Live + upcoming" />
            <div className="space-y-3">
              {gamesToday.slice(0,8).map(g => {
                const live = g.state === 'in';
                return (
                  <button key={g.id} onClick={()=>{ setGame(g); }} className="w-full text-left p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{g.away.short} @ {g.home.short}</div>
                        <div className="text-xs text-white/50 truncate">{live ? `Q${g.period} • ${g.clock}` : new Date(g.start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} {g.broadcast?.network && `• ${g.broadcast.network}`}</div>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-mono">
                        {live && <Badge color="emerald">LIVE</Badge>}
                        {g.state==='post' && <Badge>F</Badge>}
                        {live || g.state==='post' ? <span className="tabular-nums text-white/70">{g.awayScore}-{g.homeScore}</span> : null}
                      </div>
                    </div>
                  </button>
                );
              })}
              {gamesToday.length===0 && <div className="text-sm text-white/40">No games loaded.</div>}
            </div>
          </div>
        </div>
        <SearchModal isOpen={search.isOpen} onClose={search.close} onSelect={handleSearchSelect} />
      </ShellWrapper>
    );
}

// Add CSS animations
const styles = `
  @keyframes slide-up {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }
  
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .animate-slide-up {
    animation: slide-up 0.3s ease-out;
  }
  
  .animate-fade-in {
    animation: fade-in 0.4s ease-out;
  }
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}