# PropSage NFL Week 5 - Diagnosis & Implementation Plan

## 🔴 DIAGNOSIS: Why Week 5 Props Aren't Loading

### Critical Issues Found

#### 1. **API Only Returns Demo Data (No Live Prop Generation)**
**Location:** `apps/api/src/routes/nfl.ts` lines 126-175
**Problem:** The `/nfl/props` endpoint ONLY serves static demo props from JSON files. There is **no live prop generation** from SportsDataIO player stats.

```typescript
// Current code only loads demo props:
const demoProps: any[] = useDemo
  ? (maybeReadJsonFromCandidates<any[]>([
      path.resolve(__dirname, '../data/props.nfl.json'),
      // ...
    ]) || [])
  : [] // ← Returns EMPTY array when demo=false!
```

**Impact:** When `DEMO_MODE=false`, the API returns `{ count: 0, props: [] }` because there's no live prop generation logic.

---

#### 2. **Frontend Expects Different API Response Shape**
**Location:** `apps/web/src/lib/nfl.ts` line 87
**Problem:** Frontend parses `json?.data` but API returns `json.props`

```typescript
// Frontend expects:
const arr = Array.isArray(json) ? json : json?.data;

// API returns:
res.json({ week, season, count: list.length, props: list })
```

**Impact:** Even if API had props, frontend would fail to extract them (looks for `.data`, not `.props`).

---

#### 3. **No SportsDataIO → Prop Line Pipeline**
**Problem:** You have SportsDataIO integration (`apps/api/src/services/sportsdataio-nfl.ts`) but it's NEVER called by the props endpoint. Missing:
- Fetching player rosters per team
- Generating candidate markets (PASS_YDS, RUSH_YDS, REC_YDS, etc.)
- Calling your pricing engine (`packages/core`) to produce fair lines
- Saving generated props to cache

**Impact:** Can't generate props from live data; stuck with 1 demo prop.

---

#### 4. **TwelveLabs Clip Attachment Not Wired**
**Problem:** Even if props were generated, there's no code to:
- Query TwelveLabs for each (player, market, game)
- Attach clips to props before returning to frontend
- Match clips deterministically by `(playerId, market)`

**Impact:** Props show "No clip" in UI even when video evidence exists.

---

#### 5. **Minimal Demo Data**
**Location:** `data/week5_props.json`
**Problem:** Only contains 1 prop (Patrick Mahomes Passing Yards). Even in demo mode, UI looks empty.

---

### Environment Issues

From `.env.example`:
```bash
DEMO_MODE=true  # ← Blocks live data
SPORTSDATAIO_API_KEY=  # ← Empty (no live schedule/rosters)
NEXT_PUBLIC_USE_LOCAL_WEEK5=true  # ← Forces fixtures only
```

**When `DEMO_MODE=true`:** API doesn't call SportsDataIO or TwelveLabs at all.
**When `SPORTSDATAIO_API_KEY` is empty:** Can't fetch teams, schedule, or rosters.

---

## 🎯 IMPLEMENTATION PLAN (Copy-Paste for Copilot)

### Phase 1: Fix API Response Format & Add Live Prop Generation

#### Step 1.1: Align API Response Shape with Frontend Expectation

**File:** `apps/api/src/routes/nfl.ts` (line ~175)

**Change:**
```typescript
// OLD:
res.json({ week, season, count: list.length, props: list })

// NEW (frontend expects .data):
res.json({ week, season, count: list.length, data: list })
```

---

#### Step 1.2: Create Prop Generation Service

**New File:** `apps/api/src/services/prop-generator.ts`

```typescript
import { sportsDataNFL } from './sportsdataio-nfl.js';
import { config } from '../config.js';

export interface PropCandidate {
  id: string;
  source: string;
  playerId: string;
  playerName: string;
  team: string;
  market: string;
  line: number;
  gameId?: string;
  opponent?: string;
  timestamp: string;
}

const MARKETS = ['Passing Yards', 'Rushing Yards', 'Receiving Yards', 'Receptions', 'Passing TDs'];

function generatePropId(playerId: string, market: string, week: number): string {
  return `wk${week}-${playerId}-${market.replace(/\s+/g, '-').toLowerCase()}`;
}

/**
 * Generate baseline prop lines for a week (no pricing yet - can add later)
 */
export async function generateWeekProps(season: string, week: number): Promise<PropCandidate[]> {
  if (config.demoMode || !config.sportsDataIOKey) {
    console.log('[PropGen] Demo mode or no SDIO key - returning empty');
    return [];
  }

  try {
    // 1. Get schedule for week
    const schedule = await sportsDataNFL.scoresByWeek(season, week);
    console.log(`[PropGen] Found ${schedule.length} games for ${season} week ${week}`);

    // 2. Collect unique teams
    const teamSet = new Set<string>();
    schedule.forEach((game: any) => {
      if (game.HomeTeam) teamSet.add(game.HomeTeam);
      if (game.AwayTeam) teamSet.add(game.AwayTeam);
    });
    const teams = Array.from(teamSet);
    console.log(`[PropGen] Teams in week:`, teams);

    // 3. Fetch rosters for each team
    const allPlayers: any[] = [];
    for (const team of teams) {
      try {
        const roster = await sportsDataNFL.playersBasic(team);
        allPlayers.push(...roster.map((p: any) => ({ ...p, Team: team })));
      } catch (e) {
        console.warn(`[PropGen] Failed to fetch roster for ${team}:`, e);
      }
    }
    console.log(`[PropGen] Total players fetched: ${allPlayers.length}`);

    // 4. Generate props for key positions
    const props: PropCandidate[] = [];
    const eligiblePositions = ['QB', 'RB', 'WR', 'TE'];
    
    allPlayers.forEach((player: any) => {
      if (!player.Position || !eligiblePositions.includes(player.Position)) return;
      
      // Find player's game
      const game = schedule.find((g: any) => 
        g.HomeTeam === player.Team || g.AwayTeam === player.Team
      );
      const opponent = game?.HomeTeam === player.Team ? game?.AwayTeam : game?.HomeTeam;

      // Determine markets by position
      let markets: string[] = [];
      if (player.Position === 'QB') markets = ['Passing Yards', 'Passing TDs'];
      else if (player.Position === 'RB') markets = ['Rushing Yards', 'Receptions'];
      else if (player.Position === 'WR' || player.Position === 'TE') markets = ['Receiving Yards', 'Receptions'];

      markets.forEach(market => {
        props.push({
          id: generatePropId(player.PlayerID, market, week),
          source: 'Generated',
          playerId: String(player.PlayerID),
          playerName: player.Name || `${player.FirstName} ${player.LastName}`,
          team: player.Team,
          market,
          line: getBaselineLine(player.Position, market), // Simple baseline
          gameId: game?.GameKey,
          opponent,
          timestamp: new Date().toISOString(),
        });
      });
    });

    console.log(`[PropGen] Generated ${props.length} props`);
    return props;

  } catch (error) {
    console.error('[PropGen] Error generating props:', error);
    throw error;
  }
}

/**
 * Simple baseline lines (replace with your pricing engine later)
 */
function getBaselineLine(position: string, market: string): number {
  const baselines: Record<string, Record<string, number>> = {
    QB: { 'Passing Yards': 265.5, 'Passing TDs': 1.5 },
    RB: { 'Rushing Yards': 65.5, 'Receptions': 2.5 },
    WR: { 'Receiving Yards': 55.5, 'Receptions': 4.5 },
    TE: { 'Receiving Yards': 45.5, 'Receptions': 3.5 },
  };
  return baselines[position]?.[market] ?? 50.5;
}
```

---

#### Step 1.3: Wire Prop Generator into `/nfl/props` Endpoint

**File:** `apps/api/src/routes/nfl.ts` (replace lines 126-175)

```typescript
import { generateWeekProps } from '../services/prop-generator.js';

// ... existing code ...

// GET /nfl/props?week=5&season=2025REG
r.get('/props', async (req, res) => {
  try {
    const { team, playerId, stat } = req.query as any;
    const week = getWeek(req);
    const seasonParam = req.query.season as string | undefined;
    const season = seasonParam || '2025REG'; // Default to current season
    const useDemo = String(req.query.demo).toLowerCase() === '1' || String(req.query.demo).toLowerCase() === 'true';
    
    console.log(`[NFL Props] week=${week}, season=${season}, demo=${useDemo}`);
    
    let props: any[] = [];

    if (useDemo) {
      // Demo mode: load from JSON
      props = maybeReadJsonFromCandidates<any[]>([
        path.resolve(__dirname, '../data/props.nfl.json'),
        path.resolve(process.cwd(), 'apps/api/src/data/props.nfl.json'),
        path.resolve(process.cwd(), 'apps/api/dist/data/props.nfl.json')
      ]) || [];
      console.log(`[NFL Props] Demo mode - loaded ${props.length} props from JSON`);
    } else {
      // Live mode: generate from SportsDataIO
      props = await generateWeekProps(season, week);
      console.log(`[NFL Props] Live mode - generated ${props.length} props`);
    }

    // Apply filters
    let list = props;
    if (team) list = list.filter(p => p.team === String(team).toUpperCase());
    if (playerId) list = list.filter(p => p.playerId === String(playerId));
    if (stat) list = list.filter(p => p.market === String(stat));
    
    console.log(`[NFL Props] After filters: ${list.length} props`);
    
    // CRITICAL: Return .data (not .props) to match frontend expectation
    res.json({ week, season, count: list.length, data: list });
  } catch (err) {
    console.error('[NFL Props] Error:', (err as Error).message);
    res.status(500).json({ error: (err as Error).message, data: [] });
  }
});
```

---

### Phase 2: TwelveLabs Clip Attachment

#### Step 2.1: Create Clip Attachment Service

**New File:** `apps/api/src/services/clip-attacher.ts`

```typescript
import { config } from '../config.js';

export interface VideoClip {
  id: string;
  videoId: string;
  start: number;
  end: number;
  score?: number;
  thumbnailUrl?: string;
  playbackUrl?: string;
}

export interface PropWithClips {
  [key: string]: any;
  clips?: VideoClip[];
}

/**
 * Query TwelveLabs for clips matching each prop
 */
export async function attachClipsToProps(props: PropWithClips[], week: number): Promise<PropWithClips[]> {
  if (config.demoMode || !config.twelveLabsKey || !config.videoEnabled) {
    console.log('[ClipAttach] Skipping - demo mode or TL not configured');
    return props;
  }

  const indexId = config.twelveLabsIndexByLeague.nfl;
  if (!indexId) {
    console.warn('[ClipAttach] No NFL index configured');
    return props;
  }

  console.log(`[ClipAttach] Attaching clips for ${props.length} props using index ${indexId}`);

  for (const prop of props) {
    try {
      // Build search query
      const query = buildSearchQuery(prop, week);
      console.log(`[ClipAttach] Query for ${prop.playerName} ${prop.market}: "${query}"`);

      // Call TwelveLabs search API
      const response = await fetch(`https://api.twelvelabs.io/v1.2/search`, {
        method: 'POST',
        headers: {
          'x-api-key': config.twelveLabsKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          index_id: indexId,
          query_text: query,
          options: ['visual', 'conversation'],
          page_limit: 3,
        }),
      });

      if (!response.ok) {
        console.warn(`[ClipAttach] TL search failed for ${prop.playerName}: ${response.status}`);
        continue;
      }

      const data = await response.json();
      const clips: VideoClip[] = (data.data || []).map((hit: any) => ({
        id: `${hit.video_id}-${hit.start}`,
        videoId: hit.video_id,
        start: hit.start,
        end: hit.end,
        score: hit.score,
        thumbnailUrl: hit.thumbnail_url,
        playbackUrl: hit.metadata?.url,
      }));

      prop.clips = clips;
      console.log(`[ClipAttach] Found ${clips.length} clips for ${prop.playerName}`);

    } catch (error) {
      console.error(`[ClipAttach] Error for ${prop.playerName}:`, error);
    }
  }

  return props;
}

/**
 * Build TwelveLabs search query for a prop
 */
function buildSearchQuery(prop: any, week: number): string {
  const player = prop.playerName;
  const team = prop.team;
  const market = prop.market.toLowerCase();
  
  // Map market to query terms
  let action = '';
  if (market.includes('passing')) action = 'throws pass';
  else if (market.includes('rushing')) action = 'runs';
  else if (market.includes('receiving')) action = 'catches';
  else action = 'highlight';

  return `${player} ${team} Week ${week} ${action}`;
}
```

---

#### Step 2.2: Wire Clip Attachment into Props Endpoint

**File:** `apps/api/src/routes/nfl.ts`

```typescript
import { attachClipsToProps } from '../services/clip-attacher.js';

// ... inside r.get('/props', ...) after generating/loading props:

// NEW: Attach clips before returning
if (!useDemo && config.videoEnabled) {
  props = await attachClipsToProps(props, week);
  console.log(`[NFL Props] Attached clips to props`);
}

// Apply filters
let list = props;
// ... rest of code
```

---

### Phase 3: Enrich Demo Data for Better UX

#### Step 3.1: Expand Week 5 Fixtures

**File:** `data/week5_props.json`

Add more demo props (20-30) covering different teams/players/markets so the UI looks populated even in demo mode.

```json
[
  {
    "id": "wk5-prop-001",
    "source": "DK",
    "playerId": "pm-15",
    "playerName": "Patrick Mahomes",
    "team": "KC",
    "market": "Passing Yards",
    "line": 285.5,
    "timestamp": "2025-10-05T20:05:00.000Z"
  },
  {
    "id": "wk5-prop-002",
    "source": "DK",
    "playerId": "jh-32",
    "playerName": "Justin Herbert",
    "team": "LAC",
    "market": "Passing Yards",
    "line": 275.5,
    "timestamp": "2025-10-05T20:05:00.000Z"
  },
  {
    "id": "wk5-prop-003",
    "source": "DK",
    "playerId": "jt-28",
    "playerName": "Jonathan Taylor",
    "team": "IND",
    "market": "Rushing Yards",
    "line": 85.5,
    "timestamp": "2025-10-05T20:05:00.000Z"
  }
  // ... add 20-30 more
]
```

---

### Phase 4: Environment & Configuration

#### Step 4.1: Update `.env.example` with Clear Instructions

**File:** `.env.example`

```bash
# === NFL DATA PIPELINE CONFIGURATION ===

# Demo Mode: Set to false for live SportsDataIO + TwelveLabs
DEMO_MODE=false

# SportsDataIO (required for live NFL schedule, rosters, stats)
# Get key from: https://sportsdata.io/
SPORTSDATAIO_API_KEY=your-key-here

# TwelveLabs Video Intelligence (required for clip matching)
TL_API_KEY=your-twelvelabs-key-here
TL_INDEX_NFL=your-nfl-index-id

# Video Features
VIDEO_ENABLED=true

# Frontend (Web App)
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_USE_LOCAL_WEEK5=false  # Set to true to force fixtures only

# Lock NFL context (or leave blank for auto-detection)
NEXT_PUBLIC_NFL_SEASON=2025REG
NEXT_PUBLIC_NFL_WEEK=5
```

---

#### Step 4.2: Add Health Check Endpoint

**File:** `apps/api/src/routes/nfl.ts`

```typescript
// GET /nfl/props/health - Check prop generation pipeline status
r.get('/props/health', async (req, res) => {
  const week = getWeek(req);
  const season = req.query.season as string || '2025REG';
  
  try {
    const props = await generateWeekProps(season, week);
    const propsWithClips = props.filter(p => p.clips && p.clips.length > 0);
    
    res.json({
      ok: true,
      environment: {
        demoMode: config.demoMode,
        videoEnabled: config.videoEnabled,
        sportsDataIO: !!config.sportsDataIOKey,
        twelveLabs: !!config.twelveLabsKey,
        nflIndex: !!config.twelveLabsIndexByLeague.nfl,
      },
      pipeline: {
        season,
        week,
        propsGenerated: props.length,
        propsWithClips: propsWithClips.length,
        clipAttachmentRate: props.length > 0 ? (propsWithClips.length / props.length * 100).toFixed(1) + '%' : 'N/A',
      },
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: (error as Error).message,
      environment: {
        demoMode: config.demoMode,
        sportsDataIO: !!config.sportsDataIOKey,
        twelveLabs: !!config.twelveLabsKey,
      },
    });
  }
});
```

---

### Phase 5: Testing & Verification

#### Step 5.1: Local Testing Checklist

```bash
# 1. Set environment (API)
cd apps/api
cp .env.example .env
# Edit .env: Set DEMO_MODE=false, add SPORTSDATAIO_API_KEY and TL_API_KEY

# 2. Start API
pnpm dev
# API should start on http://localhost:4000

# 3. Test health endpoint
curl http://localhost:4000/nfl/props/health?week=5&season=2025REG | jq

# Expected output:
# {
#   "ok": true,
#   "environment": {
#     "demoMode": false,
#     "videoEnabled": true,
#     "sportsDataIO": true,
#     "twelveLabs": true,
#     "nflIndex": true
#   },
#   "pipeline": {
#     "season": "2025REG",
#     "week": 5,
#     "propsGenerated": 150,
#     "propsWithClips": 45,
#     "clipAttachmentRate": "30.0%"
#   }
# }

# 4. Test props endpoint
curl "http://localhost:4000/nfl/props?week=5&season=2025REG" | jq '.count'
# Should return > 0 props

# 5. Start web app
cd ../../apps/web
pnpm dev
# Visit http://localhost:3000/nfl

# 6. Verify UI shows:
# - Multiple props (not just 1)
# - Clips attached where available
# - "No clip" for unmatched props (expected initially)
```

---

#### Step 5.2: Troubleshooting Guide

**Issue:** API returns `{ count: 0, data: [] }`
- **Check:** `DEMO_MODE` is `false` in `.env`
- **Check:** `SPORTSDATAIO_API_KEY` is set and valid
- **Check:** API logs show `[PropGen] Generated X props` (not "Demo mode")
- **Test:** Visit SportsDataIO dashboard to verify key has quota

**Issue:** Props show but "No clip"
- **Check:** `TL_API_KEY` and `TL_INDEX_NFL` are set
- **Check:** Video index contains Week 5 footage
- **Check:** API logs show `[ClipAttach] Found X clips` per prop
- **Test:** Query TwelveLabs directly:
  ```bash
  curl -X POST https://api.twelvelabs.io/v1.2/search \
    -H "x-api-key: YOUR_KEY" \
    -H "Content-Type: application/json" \
    -d '{"index_id":"YOUR_INDEX","query_text":"Patrick Mahomes Week 5","page_limit":3}'
  ```

**Issue:** Frontend still shows "No props available"
- **Check:** `NEXT_PUBLIC_API_URL` in web `.env.local` points to `http://localhost:4000`
- **Check:** Browser Network tab shows request to `/nfl/props?season=2025REG&week=5`
- **Check:** Response has `.data` array (not `.props`)
- **Check:** CORS headers allow `localhost:3000`

---

### Phase 6: Future Enhancements (Post-MVP)

#### 6.1: Integrate Pricing Engine
Replace baseline lines in `prop-generator.ts` with calls to `packages/core/src/pricing/model.ts`:

```typescript
import { monteCarloFairValue } from '@propsage/core';

// Inside generateWeekProps():
const fairLine = monteCarloFairValue({
  marketLine: baselineLine,
  prior: { mu: playerSeasonAvg, sigma: stdDev },
  evidence: [], // Add video evidence later
  simulations: 10000,
});
```

#### 6.2: Add Evidence-Driven Adjustments
After attaching clips, update fair lines based on video evidence:

```typescript
import { applyEvidenceAdjustments } from '@propsage/core';

// Inside attachClipsToProps():
const evidence = clips.map(c => ({
  weight: c.score,
  deltaMu: extractPerformanceShift(c),
  deltaSigma: 0,
}));
prop.fairLine = applyEvidenceAdjustments(prop.fairLine, evidence);
```

#### 6.3: Real-Time Updates via WebSocket
Broadcast prop line changes when new clips are indexed or game status updates.

#### 6.4: Player Historical Stats Integration
Fetch season averages from SportsDataIO `PlayerSeasonStats` to improve priors:

```typescript
const stats = await sportsDataNFL.playerSeasonStats(season, playerId);
const prior = {
  mu: stats.PassingYards / stats.Played,
  sigma: calculateStdDev(stats.GameLogs),
};
```

---

## 📋 Summary Checklist

- [ ] **Step 1.1:** Change API response from `.props` to `.data`
- [ ] **Step 1.2:** Create `prop-generator.ts` with SportsDataIO integration
- [ ] **Step 1.3:** Wire generator into `/nfl/props` endpoint
- [ ] **Step 2.1:** Create `clip-attacher.ts` with TwelveLabs queries
- [ ] **Step 2.2:** Wire clip attachment into props endpoint
- [ ] **Step 3.1:** Expand `week5_props.json` with 20-30 demo props
- [ ] **Step 4.1:** Update `.env.example` with clear DEMO_MODE instructions
- [ ] **Step 4.2:** Add `/nfl/props/health` endpoint
- [ ] **Step 5.1:** Test locally with real API keys
- [ ] **Step 5.2:** Verify UI shows props with clips

---

## 🚀 Quick Start (TL;DR)

```bash
# 1. Set environment
cd apps/api
echo "DEMO_MODE=false" >> .env
echo "SPORTSDATAIO_API_KEY=your-key" >> .env
echo "TL_API_KEY=your-key" >> .env
echo "TL_INDEX_NFL=your-index" >> .env

# 2. Create prop-generator.ts and clip-attacher.ts (see Phase 1 & 2)

# 3. Update /nfl/props route (see Step 1.3)

# 4. Test
pnpm dev
curl http://localhost:4000/nfl/props/health?week=5
curl "http://localhost:4000/nfl/props?week=5&season=2025REG" | jq '.count'

# 5. Start web app
cd ../web
pnpm dev
# Visit http://localhost:3000/nfl
```

---

## 📞 Support Prompts for Copilot

If you need help with specific steps, ask:

1. **"Implement prop-generator.ts with SportsDataIO integration for NFL Week 5"**
2. **"Wire TwelveLabs clip attachment into /nfl/props endpoint"**
3. **"Create health check endpoint to diagnose prop generation pipeline"**
4. **"Expand week5_props.json with 30 realistic demo props across all positions"**
5. **"Integrate monteCarloFairValue pricing engine into prop generator"**

---

**Generated:** 2025-10-15
**Version:** 1.0
**Status:** Ready for Implementation
