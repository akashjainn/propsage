# Sportradar NFL API Migration

## Overview
PropSage has been migrated from SportsDataIO/TheSportsDB to **Sportradar NFL API v7** for NFL team and schedule data.

## What Changed

### API Provider
- **Before**: SportsDataIO (free tier with mock data) / TheSportsDB (limited free data)
- **After**: Sportradar NFL API v7 (trial/production tier with real-time data)

### Endpoints Migrated
1. **Teams** (`/nfl/sd/teams`)
   - Now uses Sportradar League Hierarchy endpoint
   - Returns 32 NFL teams with conference/division structure
   - Includes venue information

2. **Schedules** (`/nfl/sd/schedule`)
   - Now uses Sportradar Season Schedule endpoint
   - Supports REG (regular), PRE (preseason), PST (postseason)
   - Returns week-by-week game schedules with scores

### Configuration

#### Environment Variables
Add to your `.env` file:
```properties
SPORTRADAR_API_KEY=your_api_key_here
```

#### API Access Levels
The service is configured for `trial` access level. Update in `apps/api/src/services/sportsdataio-nfl.ts`:
```typescript
const ACCESS_LEVEL = 'trial'; // or 'production'
```

### Sportradar API Structure

#### Base URL
```
https://api.sportradar.com/nfl/official/{access_level}/v7/{language_code}/
```

#### Authentication
Query parameter: `?api_key={your_key}`

#### Key Endpoints
1. **League Hierarchy**: `league/hierarchy.json`
   - Returns all teams organized by conference and division
   - Includes venue and team metadata

2. **Season Schedule**: `games/{year}/{season_type}/schedule.json`
   - `{year}`: 2024, 2025, etc.
   - `{season_type}`: REG, PRE, PST
   - Returns weekly schedule with game details

3. **Weekly Schedule**: `games/{year}/{season_type}/{week}/schedule.json`
   - Returns games for a specific week

### Response Mapping

#### Teams Response
Sportradar structure:
```json
{
  "conferences": [
    {
      "alias": "AFC",
      "divisions": [
        {
          "alias": "North",
          "teams": [
            {
              "id": "...",
              "name": "Broncos",
              "market": "Denver",
              "alias": "DEN",
              "venue": {...}
            }
          ]
        }
      ]
    }
  ]
}
```

Mapped to PropSage format:
```typescript
{
  id: string,
  name: string,
  alias: string,
  market: string,
  abbreviation: string,
  conference: string,
  division: string,
  venue: object
}
```

#### Schedule Response
Sportradar structure:
```json
{
  "weeks": [
    {
      "sequence": 1,
      "games": [
        {
          "id": "...",
          "scheduled": "2025-09-04T17:00:00+00:00",
          "status": "scheduled",
          "venue": {...},
          "home": { "id": "...", "name": "...", "alias": "..." },
          "away": { "id": "...", "name": "...", "alias": "..." },
          "scoring": { "home_points": 0, "away_points": 0 }
        }
      ]
    }
  ]
}
```

Mapped to PropSage format:
```typescript
{
  id: string,
  week: number,
  season: number,
  date: string,
  status: string,
  venue: object,
  home: { id, name, alias, abbreviation, score },
  away: { id, name, alias, abbreviation, score },
  broadcast: object
}
```

## Testing

### Test Script
Run the Sportradar test script:
```bash
pnpm test:sportradar
```

Expected output:
```
✅ Success! League Hierarchy - Found 2 conferences, 32 teams
✅ Success! Season Schedule (2025 REG) - Found X weeks, Y games
```

### API Endpoints
Test the migrated endpoints:
```bash
# Teams
curl http://localhost:4000/nfl/sd/teams

# Schedule
curl http://localhost:4000/nfl/sd/schedule?season=2025REG

# Health check
curl http://localhost:4000/nfl/sd/health
```

## Rate Limits
- **Trial**: 1 request per second, 1000 requests per month
- **Production**: Higher limits based on subscription

Note: The test script may encounter 429 (Too Many Requests) errors with rapid consecutive calls.

## Files Modified
1. `apps/api/src/config.ts` - Added `sportradarKey` configuration
2. `apps/api/src/services/sportsdataio-nfl.ts` - Migrated teams and schedules to Sportradar
3. `apps/api/src/routes/nfl.sportsdata.ts` - Updated route comments
4. `scripts/test-sportradar.js` - New test script
5. `package.json` - Added `test:sportradar` script

## Documentation
- [Sportradar NFL API Overview](https://developer.sportradar.com/football/reference/nfl-overview)
- [NFL Integration Guide](https://developer.sportradar.com/football/docs/nfl-ig-overview)
- [API Reference](https://developer.sportradar.com/football/reference/nfl-endpoints)

## Next Steps
To migrate additional endpoints (scores, standings, players, props), update the corresponding methods in `sportsdataio-nfl.ts` following the same pattern:
1. Call `get<T>('endpoint/path')`
2. Map Sportradar response to PropSage format
3. Wrap in `fromCache()` for performance
4. Test with the test script

## Rollback
If needed, the previous TheSportsDB/SportsDataIO implementations are available in git history. Revert the files listed above and remove `SPORTRADAR_API_KEY` from `.env`.
