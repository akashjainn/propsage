# PropSage AI Coding Instructions

## Project Overview
PropSage is an enterprise sports betting analytics platform with AI-powered fair value calculations, multimodal video evidence (TwelveLabs), and real-time edge detection. The system processes sports props through Monte Carlo simulations and evidence-driven adjustments.

## Architecture & Key Components

### Monorepo Structure
- **`apps/api/`** - Express + WebSocket server with pricing engine
- **`apps/web/`** - Next.js 14 App Router frontend  
- **`packages/core/`** - Shared pricing algorithms (`monteCarloFairValue`, `applyEvidenceAdjustments`)
- **`data/`** - JSON fixtures for demo mode (priors, lines, evidence)

### Core Pricing Engine
The heart of PropSage is the Monte Carlo fair value calculator in `packages/core/src/pricing/model.ts`:
```typescript
// Box-Muller normal sampling with evidence adjustments
monteCarloFairValue({ marketLine, prior, evidence, simulations })
```
Evidence adjustments modify mean/variance: `deltaMu` shifts expected value, `deltaSigma` affects confidence intervals.

### Dual Mode Operation
- **Demo Mode** (`DEMO_MODE=true`): Uses cached JSON data from `data/` directory
- **Live Mode** (`DEMO_MODE=false`): Requires `PPLX_API_KEY`, `TL_API_KEY` for real external data

## Development Workflows

### Essential Commands
```bash
pnpm dev              # Start both API (:4000) and Web (:3000) in parallel
pnpm demo             # Start in demo mode with feature flags
pnpm tl:setup         # Create TwelveLabs index (outputs TWELVELABS_INDEX_ID)
pnpm tl:index         # Upload/index videos for AI analysis
pnpm test:e2e         # Playwright tests with matrix (dev/prod × TL on/off)
```

### Port Management
API auto-retries ports if 4000 is occupied (incremental +1) unless `PORT` is explicitly set in env (fails fast for CI/config issues).

## Key Patterns & Conventions

### Environment Configuration
- `config.ts` uses `requireIfLive()` pattern - required vars only enforced in non-demo mode
- CORS origins support Railway/Vercel domains + localhost patterns
- Feature flags: `NEXT_PUBLIC_FEATURE_*` prefix for client-side flags

### Video Intelligence Integration
- `evidenceService.buildMomentPack()` creates video evidence packages
- Mock data fallback: `getMockVideoForDemo()` when TwelveLabs unavailable
- Evidence affects pricing through `NewsEvidence[]` with `weight`, `deltaMu`, `deltaSigma`

### WebSocket Real-time Updates
```typescript
// Broadcast periodic edge updates to all connected clients
setInterval(() => {
  const mc = monteCarloFairValue({ marketLine, prior: jitteredPrior, evidence: [] })
  broadcast({ type: 'edge_update', playerId, market, result: mc })
}, 6000)
```

### Route Organization
- CFB-specific routes: `/cfb/players`, `/cfb/props`, `/cfb/evidence`
- Enterprise demo routes: `/games`, `/players`, `/props` (broader scope)
- Evidence endpoints distinguish prop-level vs moment-pack level data

## Testing & Deployment

### E2E Test Matrix
GitHub Actions runs Playwright across combinations:
- Mode: `dev` vs `prod` (built)
- TwelveLabs: enabled/disabled via `NEXT_PUBLIC_FEATURE_TL`
- Stubs external APIs with `CI_TL_STUB=true`

### Deployment Patterns
- **Split deployment**: API container (Railway/Render) + Web static (Vercel)
- **Monolithic**: Both services in single container via Turborepo
- CORS configuration must match final web domain

## External Service Integration

### TwelveLabs Video AI
- Index setup: `scripts/setup-tl-index.js` creates video search index
- Query patterns defined in `PROP_INTENT_LIBRARY` map prop types to search queries
- Evidence features calculate confidence levels and risk/support factors

### Cloud Storage (R2/S3)
- Video clips stored in configured bucket (`VIDEO_BUCKET_NAME`)
- Presigned URLs for secure access
- Setup scripts detect provider from environment (`--provider=r2|aws`)

## Critical Implementation Notes

### Fair Market Line Algorithm
Uses bisection method in `packages/core/src/fml/index.ts` to solve for line where P(over) = 0.5, with Bayesian curve blending between market and model probabilities.

### Worker Architecture
`apps/web/src/workers/mcWorker.ts` runs Monte Carlo in web worker to prevent UI blocking - same Box-Muller implementation as server-side.

### Cache Strategy
- Evidence cache with TTL (`evidenceCache.set(cacheKey, evidence)`)
- FML results cached for 2 minutes
- Demo data loaded once at startup from JSON files