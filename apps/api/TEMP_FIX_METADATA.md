# TEMPORARY WORKAROUND: Disable Metadata Filtering

## The Problem

Your TwelveLabs videos don't have metadata tags yet, so the league-aware filter removes all results.

## Quick Fix (Temporary)

Add this environment variable to **temporarily disable** strict metadata filtering:

```bash
# Add to .env
SKIP_LEAGUE_FILTER=true
```

Then update the unified service to check this flag.

## Better Solution

The REAL issue is that TwelveLabs API for updating metadata seems to have changed or your videos are still indexing.

### Check Video Status

Run this diagnostic to see if videos are still indexing:

```bash
node apps/api/diagnose-video-issue.js
```

Look for:
```
Status: Indexing...   ← Still processing
Status: Ready         ← Can be tagged
```

### Wait for Indexing to Complete

If videos show "Indexing...", wait 5-10 minutes and check again. TwelveLabs won't let you update metadata until indexing completes.

### Alternative: Bypass Filter for Testing

Edit `apps/api/src/services/unified-evidence-service.ts`:

```typescript
// Around line 90, in searchEvidence method
const filteredResults = process.env.SKIP_LEAGUE_FILTER === 'true'
  ? rawResults  // Skip filtering temporarily
  : filterByLeague(rawResults, context.league, context.team);
```

This will let ALL clips through regardless of metadata, so you can test video playback.

## Why Videos Won't Update

The diagnostic showed:
```
Status: Indexing...
⚠️  No metadata - won't appear in league-aware searches!
```

TwelveLabs locks videos during indexing. You must wait until they're "Ready" before updating metadata.

## Timeline

1. **Now**: Videos are indexing (~5-15 min total)
2. **After indexing**: Run `node apps/api/quick-tag-all-nfl.js` to add metadata
3. **Testing**: curl endpoint should return clips
4. **Frontend**: Videos should play (HLS proxy already built)

## Check Indexing Status

```bash
# Run diagnostic
node apps/api/diagnose-video-issue.js

# Look for "Status: Ready" instead of "Status: Indexing..."
```

Once all show "Ready", the tagging script will work.

## Or: Use the Bypass Flag

```bash
# Add to .env
SKIP_LEAGUE_FILTER=true

# Restart API
pnpm dev:api

# Test
curl "http://localhost:4000/nfl/evidence/player/Lamar%20Jackson?team=Ravens"

# Should return clips (without metadata check)
```

This proves the playback system works, then you can remove the flag once metadata is added.
