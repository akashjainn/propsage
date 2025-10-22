# Video Issue: Root Cause & Solution

## 🎯 Root Cause Identified

Your API returned **0 clips** not because of playback issues, but because:

```json
{"player":"Lamar Jackson","totalClips":0,"clips":[],"league":"NFL","week":5}
```

### Why Videos Don't Appear

**Diagnostic Results:**
- ✅ TwelveLabs API connected
- ✅ Index exists (ID: `68d845e918ca9db9c9ddbe3b`)
- ✅ 26 videos indexed
- ✅ Search API working (returns 5 results)
- ❌ **BUT: All videos lack metadata tags**

### The League-Aware Filter Problem

Your unified evidence service **correctly filters by league**, but since videos have NO metadata:

```typescript
// Your videos have NO metadata
{
  "_id": "68e7d75cc3617b55088d44e5",
  "metadata": null  // ❌ Missing!
}

// Unified service checks:
if (clip.metadata?.league !== 'NFL') {
  // Remove as contamination
}

// Since metadata.league is undefined, ALL clips are removed
```

## ✅ Solution: Add Metadata to Videos

### Option 1: Quick Fix (Immediate Testing)

Tag all videos as NFL Ravens to see them immediately:

```bash
cd apps/api
node quick-tag-all-nfl.js
```

This will:
- Tag all 26 videos with `league: "NFL"`, `team: "Ravens"`, `player: "Lamar Jackson"`
- Allow you to test video playback immediately
- Take ~3 seconds

**After running:**
```bash
# Restart API
pnpm dev:api

# Test again
curl "http://localhost:4000/nfl/evidence/player/Lamar%20Jackson?team=Ravens&week=5"

# Should now return clips!
{"player":"Lamar Jackson","totalClips":5,"clips":[...],"league":"NFL","week":5}
```

### Option 2: Smart Tagging (Production)

Detect league/team from filenames:

```bash
cd apps/api
node tag-videos.js
```

This will:
- Parse team names from video filenames
- Auto-detect league (NFL vs CFB)
- Extract player names if present
- Tag each video appropriately
- Skip videos it can't identify

## 🎬 What Happens After Tagging

### Before (Current State)
```
TwelveLabs Search → 5 results
   ↓
Unified Service Filter (league: NFL)
   ↓
Check metadata.league === "NFL"
   ↓
All removed (metadata is null)
   ↓
Return: 0 clips ❌
```

### After (With Metadata)
```
TwelveLabs Search → 5 results
   ↓
Unified Service Filter (league: NFL)
   ↓
Check metadata.league === "NFL"
   ↓
5 clips pass filter ✅
   ↓
Rank by context (team/opponent/week)
   ↓
Return: 5 clips with confidence scores
```

## 📋 Required Metadata Schema

Every video needs:

```json
{
  "league": "NFL",           // Required: "NFL" or "CFB"
  "team": "Ravens",          // Required: Normalized team name
  "season": "2024",          // Required
  "week": 5,                 // Required for NFL
  "player": "Lamar Jackson", // Optional but recommended
  "opponent": "Chiefs"       // Optional
}
```

See `apps/api/LEAGUE_AWARE_EVIDENCE.md` for full schema.

## 🚀 Next Steps

### 1. Tag Videos (Choose One)

**Quick (for testing):**
```bash
node apps/api/quick-tag-all-nfl.js
```

**Smart (for production):**
```bash
node apps/api/tag-videos.js
```

### 2. Restart API
```bash
pnpm dev:api
```

### 3. Test Endpoint
```bash
curl "http://localhost:4000/nfl/evidence/player/Lamar%20Jackson?team=Ravens&week=5"
```

### 4. Verify Playback
Once clips return, the frontend should display them. If video **playback** still doesn't work, THEN we look at:
- HLS proxy (already implemented in `/api/proxy-hls`)
- hls.js integration
- CORS headers
- Video URL format

But first, get the clips showing up!

## 📊 Diagnostic Script

Run anytime to check status:

```bash
node apps/api/diagnose-video-issue.js
```

This shows:
- Environment variables
- TwelveLabs index status
- Video count and metadata
- Search functionality
- API endpoint health

## 🎓 Why This Happened

The unified evidence service was **designed correctly** to prevent cross-league contamination. It assumes:

1. Videos have metadata tags
2. Filters enforce league isolation
3. Only properly-tagged clips appear

Since your videos had NO metadata, the filter removed everything as a safety measure. This is **correct behavior** - the system is working as designed, it just needs data.

## 💡 Pro Tip: Future Video Indexing

When adding NEW videos to TwelveLabs, include metadata immediately:

```bash
curl -X POST https://api.twelvelabs.io/v1.3/indexes/${INDEX_ID}/videos \
  -H "x-api-key: $TL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/video.mp4",
    "metadata": {
      "league": "NFL",
      "team": "Ravens",
      "season": "2024",
      "week": 5,
      "player": "Lamar Jackson"
    }
  }'
```

Or use the indexing script: `pnpm tl:index` (make sure it includes metadata).

## Summary

- **Problem**: Videos missing metadata → league filter removes all results → 0 clips returned
- **Solution**: Run `quick-tag-all-nfl.js` to tag videos immediately
- **Test**: curl endpoint should return clips
- **Future**: Tag videos during indexing, not after

The playback system (HLS proxy, hls.js, CORS) is already built and ready. You just need data to play! 🎉
