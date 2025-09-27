# PropSage — HackGT 12 Submission

## Inspiration
Sports prop betting moves fast on news, injuries, and role changes, but users lack real-time synthesis of context and quantitative fair values. We built PropSage to bridge that gap with grounded AI evidence and explainable pricing.

## What it does  
PropSage ingests player prop lines and computes fair values using a Bayesian model enhanced by:
- **Perplexity Search**: Grounded news evidence with citations
- **TwelveLabs Video**: Similar-scenario clips for context
- **Live Monte Carlo**: Real-time edge scoring with confidence bands

## How we built it
- **Frontend**: Next.js with WebSocket client for live updates
- **Backend**: Node.js API integrating Perplexity + TwelveLabs APIs
- **Core**: TypeScript pricing engine with Web Worker Monte Carlo
- **Data**: Cached fallbacks for demo reliability
- **Deploy**: Railway (API) + Vercel (web) with Docker containers

## Challenges we ran into
- **ESM Module Resolution**: Fixed import paths for containerized deployment
- **API Rate Limits**: Implemented exponential backoff + caching strategies  
- **Data Path Issues**: Resolved file system paths across development/production
- **Git Secrets**: Cleaned API keys from commit history for security

## Accomplishments that we're proud of
- **Sub-300ms UI updates** with client-side Monte Carlo simulation
- **Grounded evidence integration** showing real news citations
- **Graceful offline mode** with cached demo data
- **Production-ready deployment** on Railway + Vercel

## What we learned
- Modern sports betting needs explainable, not just accurate, predictions
- API integration requires robust error handling + fallback strategies
- Real-time UX demands careful latency optimization
- Hackathon demos need offline backup modes

## What's next for PropSage
- **Open source** the core pricing models for community contribution
- **Pilot integration** with PrizePicks sandbox feeds
- **Parlay modeling** with correlation-aware risk calculations
- **Voice queries** and mobile-optimized interface

## Built With
- Next.js
- Node.js  
- TypeScript
- Perplexity API
- TwelveLabs API
- Railway
- Vercel
- Docker

## Try it out
- **Live Demo**: [Your Railway URL]
- **GitHub**: https://github.com/akashjainn/propsage
- **Demo Mode**: `pnpm demo` for offline presentation

---

*PropSage addresses PrizePicks' Sports Intelligence challenge while showcasing Perplexity's grounded search and TwelveLabs' video understanding capabilities. The streaming architecture and Monte Carlo modeling demonstrate technical depth valued by quantitative trading firms like Hudson River Trading.*