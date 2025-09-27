# PropSage Video Intelligence Setup Guide

## 🎬 TwelveLabs Integration Overview

PropSage now includes comprehensive video intelligence powered by TwelveLabs that provides:

1. **User-facing video search** - Find specific game moments and press conferences
2. **Quantitative signal extraction** - Extract structured data to improve your FML engine

## 🚀 Quick Setup

### 1. Get API Keys

**TheOddsApi** (500 requests/month free):
1. Sign up at [the-odds-api.com](https://the-odds-api.com)
2. Get your API key from dashboard

**TwelveLabs** (free tier available):
1. Sign up at [twelvelabs.io](https://twelvelabs.io)
2. Get your API key from dashboard

### 2. Environment Variables

**Railway (API Backend):**
```bash
DEMO_MODE=true
VIDEO_ENABLED=true
PPLX_API_KEY=[your-perplexity-key]
TL_API_KEY=[your-twelvelabs-key] 
ODDS_API_KEY=[your-odds-api-key]
PORT=8080
CORS_ORIGIN=https://propsage-web.vercel.app
```

**Vercel (Frontend):**
```bash
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_VIDEO_ENABLED=true
NEXT_PUBLIC_API_URL=https://worthy-charisma-production.up.railway.app
NEXT_PUBLIC_API_WS_URL=wss://worthy-charisma-production.up.railway.app
NEXT_PUBLIC_HACKGT_MODE=true
```

## 📹 Video Intelligence Features

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/video-intel` | GET | Get all video intelligence signals |
| `/video-intel/search` | POST | Search for specific video moments |
| `/video-intel/digest` | POST | Force refresh intelligence digest |
| `/video-intel/setup` | POST | Initialize TwelveLabs indexes |

### Signal Types Extracted

1. **Injury Signals** 🏥
   - Player limping, grimacing, being helped off field
   - Confidence level based on severity indicators
   - Impact on expected performance

2. **Minutes Restriction** ⏱️
   - Coach comments about "pitch count" or "managing minutes"
   - Practice participation levels
   - Game-time decision indicators

3. **Weather Conditions** 🌧️
   - Visible precipitation, wind, field conditions
   - Impact on passing vs rushing game plans
   - Player performance in adverse conditions

4. **Coach Comments** 🎤
   - Press conference quotes about player status
   - Injury updates, role changes, game plans
   - Sentiment analysis for player confidence

### Frontend Components

**VideoIntelligencePanel** - Shows:
- Latest video intelligence signals
- Search interface for specific moments
- Evidence clips with timestamps
- Impact assessments and confidence levels

## 🔧 Integration with FML Engine

Video signals integrate with your existing fair value model:

```typescript
// Example: Adjust player prop based on video intelligence
if (videoSignal.signal_type === 'injury' && videoSignal.value > 0.6) {
  // Reduce expected points, increase variance
  adjustedMean = originalMean * (1 - videoSignal.value * 0.2)
  adjustedStdDev = originalStdDev * (1 + videoSignal.value * 0.3)
}

if (videoSignal.signal_type === 'minutes_restriction') {
  // Cap expected minutes
  expectedMinutes = Math.min(expectedMinutes, 32 * (1 - videoSignal.value))
}
```

## 📊 Usage & Cost Management

### Smart Caching
- **5-minute cache** for odds data
- **15-minute cache** for video intelligence
- Automatic fallback to demo data

### API Limits
- **TheOddsApi**: 500 requests/month free
- **TwelveLabs**: Pay per minute indexed + queries
- Request counters prevent overuse

### Demo Mode Benefits
- Full functionality without API costs
- Sample video intelligence signals
- Perfect for development and testing

## 🎯 Search Examples

Try these searches in the Video Intelligence panel:

**Injury Searches:**
- "Mahomes ankle injury concern"
- "Edwards shoulder discomfort" 
- "Player limping after collision"

**Minutes Restriction:**
- "Coach pitch count comments"
- "Limited practice participation"
- "Game-time decision status"

**Weather Impact:**
- "Rain game conditions"
- "Snow affecting visibility"
- "Wind impact on passing"

**Role Changes:**
- "Lineup changes announced"
- "Starting rotation update"
- "Snap count distribution"

## 🏗️ Advanced Setup (Production)

### 1. Create TwelveLabs Indexes
```bash
POST /video-intel/setup
```

This creates indexes for:
- `NBA-2025` - Current season games
- `NFL-2025` - Current season games  
- `Pressers-2025` - Press conferences

### 2. Upload Video Content
```typescript
// Example video upload
const upload = {
  index_id: 'NBA-2025',
  video_url: 'https://youtube.com/watch?v=...',
  metadata: {
    event_id: 'LAL-vs-BOS-2025-01-15',
    teams: ['Lakers', 'Celtics'],
    datetime: '2025-01-15T20:00:00Z',
    players: ['lebron-james', 'jayson-tatum'],
    source_type: 'game'
  }
}
```

### 3. Automated Workflows
Set up cron jobs to:
- Index new videos daily
- Run intelligence digest before games
- Update player injury status
- Monitor coach press conferences

## 🎪 HackGT Demo Ready

Your PropSage app now includes:
- ✅ Real market lines from TheOddsApi
- ✅ Video intelligence from TwelveLabs
- ✅ AI-powered fair value calculations
- ✅ Monte Carlo simulations
- ✅ Evidence-based betting insights

Perfect for showcasing at HackGT 12! 🚀

## 🔍 Testing

Run the test script to verify everything works:
```bash
node test-api.js
```

This tests:
- Health endpoint
- Lines with Odds API integration
- Video intelligence signals
- API usage tracking
- CORS configuration

The app intelligently falls back to demo data when API keys aren't configured, so it works perfectly for demonstrations even without live data.