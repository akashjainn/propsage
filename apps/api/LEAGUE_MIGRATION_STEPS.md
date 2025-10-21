# Migration to League-Aware Evidence System

## ✅ What's Been Completed

### 1. Core Infrastructure (DONE)
- ✅ `league-context.ts` - Team databases, query construction, filtering, ranking
- ✅ `unified-evidence-service.ts` - Search pipeline with TwelveLabs integration
- ✅ Updated `/nfl/evidence/player/:playerId` route to use unified service
- ✅ Build passing with no errors

### 2. Key Features Implemented
- **Team Validation**: 32 NFL teams + 100+ CFB teams with normalization
- **Query Disambiguation**: Adds "NFL" or "College Football NCAA" to queries
- **Metadata Filtering**: League-specific filters in TL search
- **Post-Search Validation**: Removes any cross-league contamination
- **Context Ranking**: Boosts clips by team/opponent/week relevance
- **Auto-Detection**: Falls back to dual-search when league ambiguous
- **Batch Search**: Parallel queries with Promise.all
- **LRU Cache**: 5-minute TTL for evidence results

## 🔄 What Needs to Be Done Next

### Step 1: Test Current Implementation

```bash
# Start API
pnpm dev:api

# Test NFL evidence endpoint
curl "http://localhost:4000/nfl/evidence/player/Lamar%20Jackson?propType=rushing_touchdowns&team=Ravens&week=5"

# Expected response:
{
  "player": "Lamar Jackson",
  "propType": "rushing_touchdowns",
  "team": "Ravens",
  "totalClips": 3,
  "clips": [
    {
      "id": "tl_...",
      "league": "nfl",
      "start": 45.2,
      "end": 67.8,
      "confidence": 0.85,
      "metadata": { "league": "NFL" }
    }
  ],
  "league": "NFL",
  "week": 5
}
```

### Step 2: Update Remaining NFL Routes

The following routes still use the old `nflEvidenceService`:

#### `/nfl/evidence/search` - General Search
```typescript
// BEFORE:
const evidence = await nflEvidenceService.searchHighlights(query, options);

// AFTER:
const clips = await unifiedEvidenceService.searchWithAutoDetect(
  '', // player (not specified in general search)
  query, // use query as propType
  '', // team (not specified)
  { limit, minScore }
);
```

#### `/nfl/evidence/props/:propType` - Prop Type Search
```typescript
// BEFORE:
const evidence = await nflEvidenceService.getEvidenceForProp(propType, player, team, options);

// AFTER:
const clips = await unifiedEvidenceService.searchEvidence({
  league: 'nfl',
  player: player as string,
  team: team as string,
  propType,
  season: '2024',
  week: 5 // or from query param
}, options);
```

#### `/nfl/evidence/batch` - Batch Search
```typescript
// BEFORE:
const results = await Promise.all(
  queries.map(query => nflEvidenceService.searchHighlights(query, options))
);

// AFTER:
const contexts = queries.map(query => ({
  league: 'nfl' as const,
  player: extractPlayer(query), // Helper to parse query
  propType: query,
  team: '', // Can be enhanced with query parsing
  season: '2024',
  week: 5
}));
const resultsMap = await unifiedEvidenceService.batchSearch(contexts, options);
```

### Step 3: Create CFB Evidence Routes

Create `apps/api/src/routes/cfb-evidence.ts`:

```typescript
import { Router } from 'express';
import { unifiedEvidenceService } from '../services/unified-evidence-service.js';

const router = Router();

router.get('/player/:playerId', async (req, res) => {
  const { playerId } = req.params;
  const { propType, team, opponent, limit = 8, minScore = 0.6 } = req.query;

  const clips = await unifiedEvidenceService.searchEvidence({
    league: 'cfb',
    player: playerId,
    team: team as string,
    opponent: opponent as string,
    propType: propType as string,
    season: '2024'
  }, {
    limit: parseInt(limit as string),
    minScore: parseFloat(minScore as string)
  });

  res.json({
    player: playerId,
    clips,
    league: 'CFB',
    timestamp: new Date().toISOString()
  });
});

export { router as cfbEvidenceRoutes };
```

Then register in `apps/api/src/app.ts`:
```typescript
import { cfbEvidenceRoutes } from './routes/cfb-evidence.js';
app.use('/cfb/evidence', cfbEvidenceRoutes);
```

### Step 4: Update Frontend Integration

#### Add League Context to Props
In `apps/web/src/components/EdgeEvidenceDrawer.tsx`:

```typescript
// Detect league from prop data
const league = prop.league || (prop.team && isNFLTeam(prop.team) ? 'nfl' : 'cfb');

// Pass to search
const { data: clips } = useTlSearch({
  player: prop.player,
  propType: prop.propType,
  team: prop.team,
  opponent: prop.opponent,
  league, // NEW
  limit: 10
});
```

#### Update `useTlSearch` Hook
In `apps/web/src/hooks/useTlSearch.ts`:

```typescript
interface TlSearchParams {
  player: string;
  propType: string;
  team?: string;
  opponent?: string;
  league?: 'nfl' | 'cfb'; // NEW
  limit?: number;
}

export function useTlSearch(params: TlSearchParams) {
  const endpoint = params.league === 'cfb' 
    ? `/cfb/evidence/player/${params.player}`
    : `/nfl/evidence/player/${params.player}`;
    
  return useQuery({
    queryKey: ['tl-search', params],
    queryFn: () => fetch(`${endpoint}?${new URLSearchParams({
      propType: params.propType,
      team: params.team || '',
      opponent: params.opponent || '',
      limit: String(params.limit || 10)
    })}`).then(r => r.json())
  });
}
```

### Step 5: Tag Existing TwelveLabs Videos

Run a migration script to add league metadata to existing videos:

```bash
# Create apps/api/scripts/tag-videos.ts
import { twelveLabsClient } from '../src/services/twelve-labs-client.js';
import { detectLeague, normalizeTeamName } from '../src/services/league-context.js';

async function tagExistingVideos() {
  // 1. List all videos in index
  const videos = await twelveLabsClient.listVideos();
  
  // 2. For each video, detect league from title/filename
  for (const video of videos) {
    const team = extractTeam(video.title); // Parse team from title
    const league = detectLeague(team);
    
    if (!league) {
      console.warn(`Cannot detect league for: ${video.title}`);
      continue;
    }
    
    // 3. Update metadata
    await twelveLabsClient.updateVideoMetadata(video.id, {
      league: league.toUpperCase(),
      team: normalizeTeamName(team),
      season: '2024',
      // ... other metadata
    });
    
    console.log(`Tagged ${video.id} as ${league}`);
  }
}

tagExistingVideos();
```

### Step 6: Test Cross-League Isolation

```bash
# Test 1: NFL query should return only NFL clips
curl "http://localhost:4000/nfl/evidence/player/Lamar%20Jackson?team=Ravens"
# Verify: all clips have metadata.league === "NFL"

# Test 2: CFB query should return only CFB clips
curl "http://localhost:4000/cfb/evidence/player/Carson%20Beck?team=Georgia"
# Verify: all clips have metadata.league === "CFB"

# Test 3: Generic name that exists in both leagues
curl "http://localhost:4000/nfl/evidence/player/Jackson?team=Ravens"
# Should auto-detect NFL from team name

# Test 4: Check for contamination
curl "http://localhost:4000/nfl/evidence/search?q=rushing%20touchdown&limit=20"
# Manually verify no CFB clips leaked through
```

### Step 7: Monitor and Refine

Add logging to track any cross-league issues:

```typescript
// In unified-evidence-service.ts, add after filtering:
const leagueMismatch = filteredResults.filter(r => r.league !== context.league);
if (leagueMismatch.length > 0) {
  console.error('[League Contamination]', {
    expected: context.league,
    found: leagueMismatch.map(r => ({ id: r.id, league: r.league, title: r.title }))
  });
  
  // Send to monitoring service
  captureEvent('league_contamination', { context, mismatches: leagueMismatch });
}
```

## 📊 Rollback Plan

If issues arise:

1. **Quick rollback**: Comment out unified service import in `nfl-evidence.ts`, uncomment old code
2. **Gradual rollback**: Add feature flag:
   ```typescript
   const USE_UNIFIED_SERVICE = process.env.FEATURE_UNIFIED_EVIDENCE === 'true';
   
   const clips = USE_UNIFIED_SERVICE
     ? await unifiedEvidenceService.searchEvidence(...)
     : await nflEvidenceService.getPlayerPropEvidence(...);
   ```

## 🎯 Success Criteria

- [ ] All NFL routes use `unifiedEvidenceService`
- [ ] CFB routes created and working
- [ ] Zero cross-league contamination in test queries
- [ ] Frontend passes `league` parameter correctly
- [ ] Existing videos tagged with league metadata
- [ ] Performance within acceptable range (cache helps)
- [ ] Monitoring in place for contamination detection

## 📝 Notes

- The unified service is **already wired** to TwelveLabs client
- LRU cache prevents redundant searches (5min TTL)
- Post-search filtering is a **safety net** - metadata filters should catch most cases
- Team normalization handles abbreviations (BAL→Ravens, OSU→Ohio State)
- Auto-detect falls back to dual-search if league ambiguous
- Build is passing ✅

## 🚀 Quick Start

```bash
# Test current implementation
pnpm dev:api
curl "http://localhost:4000/nfl/evidence/player/Lamar%20Jackson?team=Ravens&propType=rushing_touchdowns"

# Update remaining routes (Step 2)
# Create CFB routes (Step 3)
# Update frontend (Step 4)
# Tag videos (Step 5)
# Test isolation (Step 6)
```
