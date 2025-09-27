'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import MatchupHero from '@/components/MatchupHero';
import { AppShell, SectionHeader, Card, CTAButton, Badge, StatCard } from '@/ui';
import type { GameLite, GameState } from '@/types/cfb';
import SearchModal, { useSearch } from '@/components/SearchModal';
import { PropDrawer } from '@/components/PropDrawer';
import WhyCard from '@/components/WhyCard';
import type { Clip } from '@/components/clip.types';
import { useFastSWR, preloadResources, trackWebVitals } from '@/hooks/usePerformance';
import { TrendingUp, TrendingDown, Play, Search, Command } from 'lucide-react';

// Default fallback game placeholder (will be replaced by live fetch)
const FALLBACK_GAME: GameLite = {
  id: 'pending',
  start: new Date().toISOString(),
  state: 'pre',
  home: { id: 'gt', name: 'Georgia Tech Yellow Jackets', short: 'Georgia Tech', abbrev: 'GT', logo: '/images/gt-logo.png', color: 'B3A369', rank: 24 },
  away: { id: 'opp', name: 'Opponent', short: 'Opponent', abbrev: 'OPP', logo: '/images/opponent-logo.png', color: '666666', rank: null },
  venue: { name: 'Loading…' },
  broadcast: { network: '—' }
};

const DEMO_PROPS = [
  {
    id: 'haynes-passing-yards',
    player: 'Haynes King',
    prop: 'Passing Yards',
    market: 215.5,
    fair: 225.8,
    edge: 4.1,
    position: 'QB',
    team: 'GT',
    confidence: 92
  },
  {
    id: 'haynes-rushing-yards',
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

interface PropRowProps {
  prop: typeof DEMO_PROPS[0];
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
  ]
};

// Mock clips (would map from backend /clips route)
const DEMO_CLIPS: Clip[] = [
  { id: 'c_king_pass_td', playerId:'haynes-king', title:'King threads TD seam', src:'/video/king_pass_td.mp4', start:5, end:17, thumbnail:'/thumbs/king_pass_td.jpg', tags:['TD','Seam','Red Zone'], confidence:0.93 },
  { id: 'c_king_rush_td', playerId:'haynes-king', title:'Designed QB draw scores', src:'/video/king_rush_td.mp4', start:0, end:12, thumbnail:'/thumbs/king_rush_td.jpg', tags:['Rushing','Score','Red Zone'], confidence:0.9 },
  { id: 'c_haines_fumble', playerId:'jamal-haines', title:'Haines ball security lapse', src:'/video/haines_fumble.mp4', start:2, end:11, thumbnail:'/thumbs/haines_fumble.jpg', tags:['Turnover','Momentum'], confidence:0.88 }
];

interface TeamInputProps { value: string; onChange: (v: string)=>void; onSubmit: ()=>void; loading?: boolean; }
const TeamInput: React.FC<TeamInputProps> = ({ value, onChange, onSubmit, loading }) => (
  <form onSubmit={(e)=>{e.preventDefault(); onSubmit();}} className="flex items-center gap-2">
    <input
      value={value}
      onChange={e=>onChange(e.target.value)}
      placeholder="Find team (e.g. GT, Georgia Tech)"
      className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/40 placeholder:text-white/40"
      aria-label="Team search"
    />
    <CTAButton type="submit" disabled={loading}>{loading ? '...' : 'Set'}</CTAButton>
  </form>
);

export default function DemoPage() {
  const [showPropBoard, setShowPropBoard] = useState(false);
  const [selectedProp, setSelectedProp] = useState<typeof DEMO_PROPS[0] | null>(null);
  const search = useSearch();
  const [teamQuery, setTeamQuery] = useState('Georgia Tech');
  const [game, setGame] = useState<GameLite>(FALLBACK_GAME);
  const [gamesToday, setGamesToday] = useState<GameLite[]>([]);
  const [loadingGame, setLoadingGame] = useState(true);
  const [loadingTeamSwitch, setLoadingTeamSwitch] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGameForTeam = useCallback(async (team: string, silent = false) => {
    if (!silent) setLoadingTeamSwitch(true);
    try {
      setError(null);
      const res = await fetch(`/api/cfb/games/for-team?q=${encodeURIComponent(team)}`);
      if (!res.ok) throw new Error('network');
      const json = await res.json();
      const first: GameLite | undefined = json.games?.[0];
      if (first) setGame(first);
    } catch (e: any) {
      setError('Schedule temporarily unavailable');
    } finally {
      setLoadingGame(false);
      setLoadingTeamSwitch(false);
    }
  }, []);

  const fetchToday = useCallback(async ()=>{
    try {
      const r = await fetch('/api/cfb/games/today');
      if (!r.ok) return;
      const arr: GameLite[] = await r.json();
      // Sort: live first, then upcoming by start time
      const order = (g: GameLite) => g.state === 'in' ? 0 : g.state === 'pre' ? 1 : 2;
      arr.sort((a,b)=> order(a)-order(b) || a.start.localeCompare(b.start));
      setGamesToday(arr.slice(0,8));
    } catch { /* silent */ }
  }, []);

  // initial load
  useEffect(()=> { fetchGameForTeam(teamQuery); fetchToday(); }, [fetchGameForTeam, fetchToday, teamQuery]);

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

  const handleTeamSubmit = () => fetchGameForTeam(teamQuery);

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

  const displayHome = game?.home?.abbrev === 'GT' ? game.home : game?.away;
  const displayAway = game?.home?.abbrev === 'GT' ? game.away : game?.home;

  // Initialize performance tracking
  useEffect(() => {
    preloadResources();
    trackWebVitals();
  }, []);

  // Demo flow: Hero → Prop Board → Video Drawer
  const handleOpenPropBoard = () => {
    setShowPropBoard(true);
  };

  const handleSelectProp = (prop: typeof DEMO_PROPS[0]) => {
    setSelectedProp(prop);
  };

  const handleCloseDrawer = () => {
    setSelectedProp(null);
  };

  const handleSearchSelect = (result: any) => {
    console.log('Search selected:', result);
    // Handle search result selection
  };

  const ShellWrapper: React.FC<{children:React.ReactNode}> = ({children}) => <AppShell>{children}</AppShell>;

  if (!showPropBoard) {
    return (
      <ShellWrapper>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-8">
            <SectionHeader title="Matchup" subtitle="Live narrative + video intelligence overlay" action={<CTAButton onClick={handleOpenPropBoard} disabled={loadingGame || !!error}>{loadingGame? 'Loading…':'Open Prop Board'}</CTAButton>} />
            <div className="flex items-center justify-between mb-4">
              <TeamInput value={teamQuery} onChange={setTeamQuery} onSubmit={handleTeamSubmit} loading={loadingTeamSwitch} />
              {error && <span className="text-sm text-red-300">{error}</span>}
            </div>
            <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex-1 text-center">
                  <div className="mx-auto w-20 h-20 mb-3 rounded-full bg-white/5 flex items-center justify-center overflow-hidden">
                    {displayAway?.logo && <img src={displayAway.logo} alt={displayAway.short} className="w-16 h-16 object-contain" />}
                  </div>
                  <div className="text-lg font-semibold flex items-center justify-center gap-2">
                    {displayAway?.short}
                    {displayAway?.rank && <Badge color="sky">#{displayAway.rank}</Badge>}
                  </div>
                </div>
                <div className="px-4 text-center">
                  <div className="text-sm tracking-wide text-white/60 mb-1">{isLive ? 'Score' : 'Kickoff'}</div>
                  <div className="text-3xl font-bold tabular-nums mb-1">{isLive ? `${game.awayScore ?? 0}` : countdown}</div>
                  <div className="text-xs text-white/50">
                    {isLive ? `Q${game.period ?? '?'} • ${game.clock ?? ''}` : new Date(game.start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  </div>
                  {isLive && <Badge color="emerald">LIVE</Badge>}
                  {game.state==='post' && <Badge>FINAL</Badge>}
                </div>
                <div className="flex-1 text-center">
                  <div className="mx-auto w-20 h-20 mb-3 rounded-full bg-white/5 flex items-center justify-center overflow-hidden">
                    {displayHome?.logo && <img src={displayHome.logo} alt={displayHome.short} className="w-16 h-16 object-contain" />}
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
          {/* Today's Games side panel */}
          <div className="lg:col-span-4 space-y-4">
            <SectionHeader title="Today's CFB" subtitle="Live + upcoming" />
            <div className="space-y-3">
              {gamesToday.slice(0,8).map(g => {
                const live = g.state === 'in';
                return (
                  <button key={g.id} onClick={()=>{ setGame(g); setShowPropBoard(false); }} className="w-full text-left p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
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

  return (
    <AppShell>
      <div className="mb-10 flex items-center gap-4">
        <SectionHeader title="Haynes King Props" subtitle="Tap a line to view fair value, reasoning & video evidence." action={<CTAButton onClick={()=>setShowPropBoard(false)}>← Back</CTAButton>} />
        <Badge color="emerald">LIVE</Badge>
      </div>
      <div className="space-y-3 mb-10">
        {DEMO_PROPS.map((prop) => (
          <PropRow
            key={prop.id}
            prop={prop}
            onClick={() => handleSelectProp(prop)}
            isSelected={selectedProp?.id === prop.id}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Decision Time" value="<30s" accent="text-emerald-300" />
        <StatCard label="Confidence Boost" value="+25%" accent="text-sky-300" />
        <StatCard label="AI Confidence" value="89%" accent="text-purple-300" />
      </div>
      <PropDrawer
        isOpen={!!selectedProp}
        onClose={handleCloseDrawer}
        propId={selectedProp?.id || ''}
        propType={selectedProp?.prop as any}
        playerId={'haynes-king'}
        marketLine={selectedProp?.market || 0}
        fairLine={selectedProp?.fair || 0}
        edgePct={selectedProp?.edge || 0}
        bullets={selectedProp ? INSIGHTS[selectedProp.id] : []}
        clips={DEMO_CLIPS.filter(c=>c.playerId==='haynes-king')}
      />
      <SearchModal isOpen={search.isOpen} onClose={search.close} onSelect={handleSearchSelect} />
    </AppShell>
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