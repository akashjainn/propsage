# Sportradar + TwelveLabs NFL Evidence Integration

## Overview
This integration connects Sportradar NFL API v7 (schedule + play-by-play) with TwelveLabs video intelligence to provide clip evidence for prop betting.

## Architecture

```
Sportradar Schedule → Game Events (PBP) → Event-to-Market Rules → TwelveLabs Search → Video Clips
```

## Setup

### Environment Variables
```bash
# Sportradar
SPORTRADAR_NFL_API_KEY=your_key_here
SPORTRADAR_ACCESS_LEVEL=trial  # or production

# TwelveLabs  
TWELVELABS_API_KEY=your_key_here
TWELVELABS_INDEX_ID=your_index_id
```

### Video Upload Requirements
When uploading highlights to TwelveLabs, include `gameId` in metadata:

```javascript
await twelveLabsClient.indexClip({
  gameId: 'sportradar-game-guid',
  s3Url: 'https://...',
  title: 'Week 5: KC vs MIN Highlights',
  metadata: {
    gameId: 'sportradar-game-guid',  // CRITICAL for filtering
    week: 5,
    season: 2024,
    homeTeam: 'KC',
    awayTeam: 'MIN'
  }
});
```

## API Endpoints

### 1. Weekly Schedule
```
GET /nfl/evidence/week/:week/schedule?year=2024&seasonType=REG
```

Returns all games for a given week with gameIds, teams, scores.

**Example:**
```bash
curl https://api.propsage.com/nfl/evidence/week/5/schedule
```

### 2. Game Events (Play-by-Play)
```
GET /nfl/evidence/game/:gameId/events
```

Parses play-by-play into structured `GameEvent[]` with:
- TDs (passing, rushing, receiving)
- Interceptions
- Fumbles  
- Sacks
- Big plays (15+ yard passes, 10+ yard runs)

**Example:**
```bash
curl https://api.propsage.com/nfl/evidence/game/sr:match:12345/events
```

### 3. Video Clips for Props
```
GET /nfl/evidence/clips?player=Patrick%20Mahomes&market=PASS_TDS&gameId=...&limit=4
```

Searches TwelveLabs for relevant clips matching player + market.

**Markets:**
- `PASS_YDS`, `PASS_TDS` - QB passing stats
- `RUSH_YDS`, `RUSH_TDS` - RB/QB rushing stats
- `REC_YDS`, `REC_TDS`, `RECEPTIONS` - WR/TE receiving stats
- `ANYTIME_TD` - Any touchdown scorer
- `INTS` - QB interceptions or DEF picks
- `SACKS` - QB sacked or DEF sacks

**Example:**
```bash
curl "https://api.propsage.com/nfl/evidence/clips?player=Lamar%20Jackson&market=RUSH_TDS&limit=4"
```

## Event-to-Market Mapping

The system uses deterministic rules to match game events to prop markets:

| Market | Event Types | Player Match |
|--------|-------------|--------------|
| PASS_YDS | PASS_TD, BIG_PASS (15+ yds) | passer == player |
| PASS_TDS | PASS_TD | passer == player |
| RUSH_YDS | RUSH_TD, BIG_RUN (10+ yds) | rusher == player |
| RUSH_TDS | RUSH_TD | rusher == player |
| REC_YDS | REC_TD, BIG_PASS | receiver == player |
| REC_TDS | REC_TD | receiver == player |
| ANYTIME_TD | All *_TD events | any scorer |
| INTS | INT | passer or interceptor |
| SACKS | SACK | passer or tackler |

## Data Flow

### Full Pipeline Example

```typescript
// 1. Get Week 5 schedule
const games = await sportradarNFLClient.getWeekSchedule({ week: 5 });

// 2. For each game, extract events
for (const game of games) {
  const events = await sportradarNFLClient.getGameEvents(game.gameId);
  
  // 3. Filter events by player + market
  const playerEvents = events.filter(e => 
    e.passer === 'Patrick Mahomes' && 
    ['PASS_TD', 'BIG_PASS'].includes(e.type)
  );
  
  // 4. Convert events to TL queries
  const clips = await eventClipMapper.getClipsFromEvents(
    playerEvents,
    'Patrick Mahomes',
    'PASS_TDS',
    4
  );
  
  // 5. Display clips in Evidence Drawer
  clips.forEach(clip => {
    console.log(`${clip.label}: ${clip.startTime}s - ${clip.endTime}s`);
    console.log(`HLS URL: ${clip.thumbnailUrl}`);
  });
}
```

## Rate Limiting

### Sportradar
- **Schedule**: TTL ~10s during games, longer for past weeks
- **Play-by-Play**: Refresh during games, stable after completion
- Batch PBP calls after games finish to avoid rate limits

### TwelveLabs  
- **Rate limits**: Varies by plan (free/trial have strict limits)
- **Solutions implemented**:
  - Exponential backoff retry (1s, 2s delays)
  - Single query per market (reduced from 4)
  - 30-minute result caching
  
## Caching Strategy

```typescript
// Schedule: 10 minutes (aligns with Sportradar TTL)
const scheduleCache = new LRUCache({ max: 50, ttl: 1000 * 60 * 10 });

// PBP: 1 hour (stable after game)
const pbpCache = new LRUCache({ max: 100, ttl: 1000 * 60 * 60 });

// TL Search: 30 minutes
const searchCache = new LRUCache({ max: 500, ttl: 1000 * 60 * 30 });
```

## Testing

### Test Schedule Fetch
```bash
node -e "
const { sportradarNFLClient } = require('./dist/services/sportradar-nfl.js');
sportradarNFLClient.getWeekSchedule({ week: 5 }).then(console.log);
"
```

### Test Event Extraction
```bash
# Replace with actual gameId
curl http://localhost:3000/nfl/evidence/game/sr:match:12345/events
```

### Test Clip Search
```bash
curl "http://localhost:3000/nfl/evidence/clips?player=Lamar%20Jackson&market=RUSH_TDS"
```

## Acceptance Checklist

- [x] Sportradar v7 client with schedule + PBP
- [x] GameEvent parser from PBP response
- [x] Event-to-market mapping rules
- [x] TwelveLabs query builder from events
- [x] API routes for schedule, events, clips
- [ ] Video uploads include `gameId` metadata
- [ ] End-to-end test with real Week 5 data
- [ ] Frontend Evidence Drawer integration
- [ ] HLS playback working

## Next Steps

1. **Upload Videos with Metadata**: Ensure all Week 5 highlights have correct `gameId`
2. **Test with Real Data**: Run full pipeline with actual Sportradar gameIds
3. **Frontend Integration**: Connect Evidence Drawer to new `/clips` endpoint
4. **Monitoring**: Add logging for TL rate limits and cache hit rates

## Resources

- [Sportradar NFL v7 Docs](https://developer.sportradar.com/docs/read/american_football/NFL_v7)
- [TwelveLabs Search API](https://docs.twelvelabs.io/reference/search)
- [PropSage Evidence Service](./apps/api/src/services/event-clip-mapper.ts)
