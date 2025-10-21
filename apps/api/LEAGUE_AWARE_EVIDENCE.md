# League-Aware TwelveLabs Integration

## Overview
This system ensures clean separation between College Football (CFB) and NFL clips in your single TwelveLabs index by using:

1. **Metadata tagging** - Every video includes `league`, `team`, `season`, `week` tags
2. **Query disambiguation** - Queries include league-specific terms (e.g., "NFL Week 5")
3. **Post-search filtering** - Results are validated against team rosters and league indicators
4. **Context ranking** - Clips are scored by relevance to the specific game/player context

## Video Indexing Requirements

### Required Metadata for Each Video

```json
{
  "league": "NFL",           // or "CFB"
  "team": "Ravens",          // Normalized team name
  "opponent": "Chiefs",      // Optional
  "season": "2024",
  "week": 5,                 // NFL only
  "player": "Lamar Jackson", // Optional, for player-specific clips
  "tags": ["rushing", "touchdown", "red_zone"]
}
```

### Indexing Script Example

```bash
# NFL Week 5 clip
curl -X POST https://api.twelvelabs.io/v1.2/indexes/{index_id}/videos \
  -H "x-api-key: $TL_API_KEY" \
  -d '{
    "video_url": "https://example.com/nfl-lamar-td.mp4",
    "metadata": {
      "league": "NFL",
      "team": "Ravens",
      "opponent": "Chiefs",
      "season": "2024",
      "week": 5,
      "player": "Lamar Jackson",
      "tags": ["rushing_touchdown", "red_zone", "Q4"]
    }
  }'

# CFB clip
curl -X POST https://api.twelvelabs.io/v1.2/indexes/{index_id}/videos \
  -H "x-api-key: $TL_API_KEY" \
  -d '{
    "video_url": "https://example.com/cfb-beck-pass.mp4",
    "metadata": {
      "league": "CFB",
      "team": "Georgia",
      "opponent": "Alabama",
      "season": "2024",
      "week": 8,
      "player": "Carson Beck",
      "tags": ["passing_touchdown", "deep_ball"]
    }
  }'
```

## Usage in Your Application

### 1. NFL Props Evidence Search

```typescript
import { unifiedEvidenceService } from './services/unified-evidence-service';

// Search for NFL player evidence
const results = await unifiedEvidenceService.searchEvidence({
  league: 'nfl',
  player: 'Lamar Jackson',
  team: 'Ravens',
  opponent: 'Chiefs',
  propType: 'rushing_touchdowns',
  season: '2024',
  week: 5
}, {
  limit: 10,
  minScore: 0.6
});
```

### 2. CFB Props Evidence Search

```typescript
// Search for CFB player evidence
const results = await unifiedEvidenceService.searchEvidence({
  league: 'cfb',
  player: 'Carson Beck',
  team: 'Georgia',
  opponent: 'Alabama',
  propType: 'passing_yards',
  season: '2024'
}, {
  limit: 10,
  minScore: 0.6
});
```

### 3. Auto-Detection (When League is Ambiguous)

```typescript
// Service will auto-detect league from team name
const results = await unifiedEvidenceService.searchWithAutoDetect(
  'Lamar Jackson',    // player
  'rushing_attempts',  // propType
  'Ravens',           // team (auto-detects NFL)
  { limit: 10 }
);
```

### 4. Batch Search (Multiple Props)

```typescript
const contexts = [
  { league: 'nfl', player: 'Lamar Jackson', team: 'Ravens', propType: 'rushing_touchdowns', season: '2024', week: 5 },
  { league: 'nfl', player: 'Patrick Mahomes', team: 'Chiefs', propType: 'passing_yards', season: '2024', week: 5 },
  { league: 'cfb', player: 'Carson Beck', team: 'Georgia', propType: 'passing_attempts', season: '2024' }
];

const resultsMap = await unifiedEvidenceService.batchSearch(contexts, { limit: 5 });
```

## API Routes

### NFL Evidence Route (Updated)

```typescript
// GET /nfl/evidence/player/:playerId?propType=rushing_attempts&team=Ravens
router.get('/player/:playerId', async (req, res) => {
  const { playerId } = req.params;
  const { propType, team, opponent, week = 5 } = req.query;
  
  const clips = await unifiedEvidenceService.searchEvidence({
    league: 'nfl',
    player: playerId,
    team: team as string,
    opponent: opponent as string,
    propType: propType as string,
    season: '2024',
    week: parseInt(week as string)
  }, {
    limit: 10,
    minScore: 0.6
  });
  
  res.json({ player: playerId, clips });
});
```

### CFB Evidence Route (New)

```typescript
// GET /cfb/evidence/player/:playerId?propType=passing_yards&team=Georgia
router.get('/player/:playerId', async (req, res) => {
  const { playerId } = req.params;
  const { propType, team, opponent } = req.query;
  
  const clips = await unifiedEvidenceService.searchEvidence({
    league: 'cfb',
    player: playerId,
    team: team as string,
    opponent: opponent as string,
    propType: propType as string,
    season: '2024'
  }, {
    limit: 10,
    minScore: 0.6
  });
  
  res.json({ player: playerId, clips });
});
```

## How It Prevents Cross-League Contamination

### 1. Query Disambiguation
```typescript
// NFL query includes league-specific terms
buildLeagueAwareQuery({
  league: 'nfl',
  player: 'Lamar Jackson',
  team: 'Ravens',
  propType: 'rushing_touchdowns'
})
// → "NFL Week 5 Ravens Lamar Jackson rushing touchdowns"

// CFB query includes different markers
buildLeagueAwareQuery({
  league: 'cfb',
  player: 'Carson Beck',
  team: 'Georgia',
  propType: 'passing_yards'
})
// → "College Football NCAA Georgia Carson Beck passing yards"
```

### 2. Metadata Filtering
```typescript
// TwelveLabs search includes metadata filters
{
  query: "NFL Ravens Lamar Jackson rushing touchdown",
  filters: {
    league: "NFL",
    team: "Ravens",
    week: 5,
    season: "2024"
  }
}
```

### 3. Post-Search Validation
```typescript
// Removes any results that don't match league
filterByLeague(results, 'nfl', 'Ravens')
// Checks:
// - metadata.league === 'NFL'
// - metadata.team is in NFL_TEAMS roster
// - No CFB indicators in title/transcript
```

### 4. Context-Based Ranking
```typescript
// Boosts clips that match context better
rankByLeagueContext(results, {
  league: 'nfl',
  team: 'Ravens',
  opponent: 'Chiefs',
  week: 5
})
// Multipliers:
// - Exact team match: 1.5x
// - Opponent match: 1.3x
// - Week match: 1.2x
```

## Team Rosters

The system includes complete NFL and CFB team lists:

- **NFL**: All 32 teams with abbreviation support (e.g., BAL → Ravens)
- **CFB**: Power 5 + top G5 teams with common abbreviations (e.g., OSU → Ohio State)

You can expand the CFB roster in `league-context.ts` based on your index contents.

## Testing Your Integration

### 1. Verify Metadata

```bash
# Check if your indexed videos have proper metadata
curl -X GET https://api.twelvelabs.io/v1.2/indexes/{index_id}/videos/{video_id} \
  -H "x-api-key: $TL_API_KEY"
```

### 2. Test Search Isolation

```typescript
// Search for NFL player
const nflResults = await unifiedEvidenceService.searchEvidence({
  league: 'nfl',
  player: 'Lamar Jackson',
  team: 'Ravens',
  propType: 'rushing_touchdowns',
  season: '2024',
  week: 5
});

// Verify no CFB clips leaked through
const hasCFB = nflResults.some(r => r.league === 'cfb');
console.assert(!hasCFB, 'CFB clips found in NFL search!');
```

### 3. Test Edge Cases

```typescript
// Generic player name that exists in both leagues
const results = await unifiedEvidenceService.searchWithAutoDetect(
  'Jackson',          // Player exists in both leagues
  'rushing_attempts',
  'Ravens',           // Should detect NFL
  { limit: 10 }
);

// All results should be NFL
results.forEach(r => {
  console.assert(r.league === 'nfl', `Wrong league: ${r.league}`);
});
```

## Environment Variables

```bash
# Required
TWELVELABS_API_KEY=tlk_xxxxx
TWELVELABS_INDEX_ID=your_index_id

# Optional (for per-league indexes)
TL_INDEX_NFL=nfl_index_id
TL_INDEX_CFB=cfb_index_id
```

## Best Practices

1. **Always tag videos during indexing** - Retroactive tagging is hard
2. **Use normalized team names** - "Ravens" not "Baltimore Ravens"
3. **Include opponent when available** - Helps with game-specific queries
4. **Tag prop type** - Makes filtering faster (e.g., "rushing_touchdown")
5. **Test cross-league queries** - Ensure no contamination
6. **Cache aggressively** - Evidence doesn't change often (5min TTL)
7. **Monitor false positives** - Log when wrong league clips appear

## Migration from Single-League to Multi-League

If you already have an index with only one league:

1. Add metadata to existing videos:
```typescript
// Batch update metadata
for (const video of existingVideos) {
  await updateVideoMetadata(video.id, {
    league: detectLeagueFromTitle(video.title),
    team: extractTeam(video.title),
    // ... other metadata
  });
}
```

2. Start fresh with proper tagging:
```bash
# Create new index with metadata schema
curl -X POST https://api.twelvelabs.io/v1.2/indexes \
  -H "x-api-key: $TL_API_KEY" \
  -d '{
    "index_name": "propsage-multi-league",
    "engines": [
      { "name": "marengo2.6", "options": ["visual", "conversation"] }
    ]
  }'
```

3. Reindex with metadata as shown in "Indexing Script Example" above.

## Troubleshooting

### Issue: CFB clips appearing in NFL searches

**Solution**: Check metadata on those clips:
```bash
curl -X GET https://api.twelvelabs.io/v1.2/indexes/{index_id}/videos/{video_id}/metadata
```

Update if missing:
```bash
curl -X PUT https://api.twelvelabs.io/v1.2/indexes/{index_id}/videos/{video_id}/metadata \
  -d '{"league": "CFB", "team": "Georgia"}'
```

### Issue: No results for valid queries

**Solution**: Verify team name normalization:
```typescript
import { normalizeTeamName, isValidTeamForLeague } from './league-context';

console.log(normalizeTeamName('BAL'));  // → Ravens
console.log(isValidTeamForLeague('Ravens', 'nfl'));  // → true
```

### Issue: Slow searches

**Solution**: 
1. Add indexes on metadata fields in TwelveLabs
2. Increase cache TTL: `CACHE_TTL_MS = 15 * 60 * 1000` (15min)
3. Use batch search for multiple props

## Support

For questions or issues:
1. Check TwelveLabs docs: https://docs.twelvelabs.io/
2. Review `league-context.ts` for team roster updates
3. Check logs for filter/ranking debug output
