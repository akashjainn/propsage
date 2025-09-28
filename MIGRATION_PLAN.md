# 🚀 PropSage Consolidation Plan: Everything at localhost:3000/

## 🎯 **Goal**
Merge `/demo` functionality into `/` (main page) to create one unified experience:
- Games → Players → Market vs Fair Lines → Video Evidence
- Single entry point with progressive disclosure
- Clean API consolidation

## 📋 **Migration Steps (in order)**

### 1. **API Standardization** ✅ (Already mostly done)
**Keep only these endpoints:**
- `GET /api/cfb/games/today` → Today's games with fallback
- `GET /api/cfb/games/for-team?q=Illinois` → Team search
- `GET /api/insights/[gameId]` → All props for a game (market vs fair + bullets + clips)  
- `POST /api/clips/search` → TwelveLabs proxy

**Remove/stop calling:**
- `/api/games` (404s in console)
- `/api/players/*` (404s in console) 
- `/api/props?gameId=` (404s in console)

### 2. **Component Architecture Migration**

#### **New Main Page Structure (`app/page.tsx`):**
```tsx
// Unified homepage with progressive disclosure
<AppShell>
  <HeroSection />           // "We analyze game film to show where market is wrong"
  <TopEdges />             // ✅ Already exists - top 3 edges across all games  
  <GamesRail />            // Today's games from /api/cfb/games/today
  <GameDashboard />        // ✅ Already exists - scoreboard + props grid
  <PropDrawer />           // ✅ Already exists - WhyCard + ClipsGrid
</AppShell>
```

#### **Components Status:**
- ✅ `TopEdges` - Already built, shows top 3 edges
- ✅ `GameDashboard` - Already built, shows scoreboard + props
- ✅ `PropDrawer` - Already built, two-column with video
- ✅ `TeamLogo` - Already built with fallback
- 🆕 `GamesRail` - Need to extract from demo page
- 🆕 `HeroSection` - Need to create

### 3. **Data Flow Consolidation**

#### **State Management:**
```tsx
// Single source of truth in main page
const [selectedGameId, setSelectedGameId] = useState('illinois-usc-20250927'); // Default
const [selectedProp, setSelectedProp] = useState(null);
const [gamesToday, setGameesToday] = useState([]);
```

#### **API Calls:**
```tsx
// Standardized API object
export const API = {
  gamesToday: "/api/cfb/games/today",
  gamesForTeam: (q: string) => `/api/cfb/games/for-team?q=${encodeURIComponent(q)}`,
  insightsForGame: (gameId: string) => `/api/insights/${encodeURIComponent(gameId)}`,
  clipsSearch: "/api/clips/search",
};
```

### 4. **File Operations Plan**

#### **Phase 1: Extract Reusable Components**
1. Extract `GamesRail` from `demo/page.tsx` 
2. Create `HeroSection` component
3. Update API calls in all components to use standardized endpoints

#### **Phase 2: Migrate Main Page**
1. Replace `app/page.tsx` content with consolidated UI
2. Move demo logic into main page
3. Update routing and remove `/demo` route

#### **Phase 3: Cleanup**
1. Remove `/demo` folder
2. Remove unused API routes
3. Update any hardcoded `/demo` links

### 5. **Implementation Priority**

#### **Critical Path (Do First):**
1. ✅ API endpoints working (already done)
2. ✅ Components built (already done)  
3. 🔄 Extract GamesRail from demo page
4. 🔄 Create unified main page
5. 🔄 Remove demo route

#### **Polish (Do After):**
- Performance optimizations
- Loading states
- Error boundaries

## 🛠 **Ready-to-Drop Code Snippets**

### **New `app/page.tsx`** (Unified Experience)
```tsx
'use client';

import React, { useState, useEffect } from 'react';
import { AppShell, SectionHeader } from '@/ui';
import TopEdges from '@/components/TopEdges';
import GameDashboard from '@/components/GameDashboard';
import { TeamLogo } from '@/components/TeamLogo';
import { PropDrawer } from '@/components/PropDrawer';
import type { GameLite } from '@/types/cfb';

// API Constants
const API = {
  gamesToday: "/api/cfb/games/today",
  gamesForTeam: (q: string) => `/api/cfb/games/for-team?q=${encodeURIComponent(q)}`,
  insightsForGame: (gameId: string) => `/api/insights/${encodeURIComponent(gameId)}`,
  clipsSearch: "/api/clips/search",
};

export default function HomePage() {
  const [selectedGameId, setSelectedGameId] = useState('illinois-usc-20250927');
  const [gamesToday, setGamesToday] = useState<GameLite[]>([]);
  const [selectedProp, setSelectedProp] = useState(null);

  // Fetch today's games
  useEffect(() => {
    fetch(API.gamesToday)
      .then(res => res.json())
      .then(data => setGamesToday(data))
      .catch(console.error);
  }, []);

  return (
    <AppShell>
      {/* Hero Section */}
      <section className="mb-12 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
          We analyze game film to show where the market is wrong.
        </h1>
        <p className="text-xl text-white/70 mb-8">
          Compare market lines with our fair lines, then watch the plays that justify it.
        </p>
      </section>

      {/* Top Edges */}
      <section className="mb-12">
        <SectionHeader 
          title="Top Edges Today" 
          subtitle="Biggest market vs fair line discrepancies" 
        />
        <TopEdges />
      </section>

      {/* Games Rail */}
      <section className="mb-8">
        <SectionHeader title="Today's Games" subtitle="Select a game to analyze" />
        <div className="flex gap-4 overflow-x-auto pb-4">
          {gamesToday.map(game => (
            <button
              key={game.id}
              onClick={() => setSelectedGameId(game.id)}
              className={`flex-shrink-0 p-4 rounded-xl border transition-colors ${
                selectedGameId === game.id 
                  ? 'border-blue-500 bg-blue-500/10' 
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <TeamLogo src={game.away.logo} alt={game.away.short} size={32} />
                <span className="text-sm">@</span>
                <TeamLogo src={game.home.logo} alt={game.home.short} size={32} />
              </div>
              <div className="text-sm mt-2 text-center">
                {game.away.short} @ {game.home.short}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Game Dashboard */}
      <GameDashboard 
        gameId={selectedGameId}
        gameTitle="Selected Game"
        onBack={() => {}} // No back needed in unified view
      />

      {/* PropDrawer will be opened by GameDashboard */}
    </AppShell>
  );
}
```

### **GamesRail Component** (Extract from demo)
```tsx
'use client';

import React from 'react';
import { TeamLogo } from './TeamLogo';
import { Badge } from '@/ui';
import type { GameLite } from '@/types/cfb';

interface GamesRailProps {
  games: GameLite[];
  selectedGameId: string;
  onGameSelect: (gameId: string) => void;
}

export default function GamesRail({ games, selectedGameId, onGameSelect }: GamesRailProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {games.map(game => {
        const isLive = game.state === 'in';
        const isSelected = selectedGameId === game.id;
        
        return (
          <button
            key={game.id}
            onClick={() => onGameSelect(game.id)}
            className={`flex-shrink-0 p-4 rounded-xl border transition-colors min-w-[200px] ${
              isSelected 
                ? 'border-blue-500 bg-blue-500/10' 
                : 'border-white/10 bg-white/5 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <TeamLogo src={game.away.logo} alt={game.away.short} size={24} />
                <span className="text-sm font-medium">{game.away.short}</span>
                {game.away.rank && <Badge color="sky">#{game.away.rank}</Badge>}
              </div>
              {isLive || game.state === 'post' ? (
                <span className="text-sm font-mono">{game.awayScore}</span>
              ) : null}
            </div>
            
            <div className="text-xs text-white/60 mb-2">@</div>
            
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <TeamLogo src={game.home.logo} alt={game.home.short} size={24} />
                <span className="text-sm font-medium">{game.home.short}</span>
                {game.home.rank && <Badge color="sky">#{game.home.rank}</Badge>}
              </div>
              {isLive || game.state === 'post' ? (
                <span className="text-sm font-mono">{game.homeScore}</span>
              ) : null}
            </div>
            
            <div className="mt-3 flex items-center justify-between">
              <div className="text-xs text-white/50">
                {isLive ? `Q${game.period} • ${game.clock}` : 
                 new Date(game.start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </div>
              {isLive && <Badge color="emerald">LIVE</Badge>}
              {game.state === 'post' && <Badge>FINAL</Badge>}
            </div>
          </button>
        );
      })}
    </div>
  );
}
```

## 🚦 **Implementation Checklist**

### **Phase 1: Component Extraction** (30 mins)
- [ ] Create `GamesRail` component  
- [ ] Create `HeroSection` component
- [ ] Update API constants in a shared file

### **Phase 2: Main Page Migration** (45 mins)  
- [ ] Replace `app/page.tsx` with unified experience
- [ ] Test game selection and prop loading
- [ ] Verify PropDrawer opens correctly

### **Phase 3: Cleanup** (15 mins)
- [ ] Remove `/demo` route folder
- [ ] Remove unused API routes
- [ ] Update any `/demo` references

### **Phase 4: Testing** (30 mins)
- [ ] Load `localhost:3000` - see hero + top edges
- [ ] Select different games - props load
- [ ] Click props - PropDrawer opens with video
- [ ] Check console - no 404s

## 🎯 **Expected Outcome**

**Single URL (`localhost:3000`) provides complete experience:**
1. **Hero** - Clear value proposition 
2. **Top Edges** - Best opportunities today
3. **Games Rail** - Select any game
4. **Props Grid** - All players for selected game  
5. **PropDrawer** - Market vs fair + video evidence

**Zero 404s, clean console, fast loading.**

Ready to implement? Let me know which phase you'd like me to start with!