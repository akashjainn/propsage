# PropSage — Real-Time Sports Prop Pricing & Insight Copilot

Enterprise-grade hackathon architecture enabling: real-time fair line estimation, grounded news evidence (Perplexity), multimodal video context (TwelveLabs), and streaming edge updates.

## Monorepo Structure
```
apps/
  web/     # Next.js 14 UI (App Router)
  api/     # Express + WebSocket pricing & evidence API
packages/
  core/    # Pricing engine (priors + evidence adjustment + Monte Carlo)
data/      # Sample priors & lines for demo/offline mode
```

## Quick Start
1. Clone & install
```
pnpm install
```
2. Copy env
```
cp .env.example .env
```
3. Dev (parallel)
```
pnpm dev
```
API on :4000, Web on :3000.

### Offline Demo Mode
Set `DEMO_MODE=true` in `.env` (default) and the API will serve lines, priors, evidence, and video clips from `data/*.json` caches. No external network calls are made. Disable by setting `DEMO_MODE=false` and providing valid `PPLX_API_KEY` / `TL_API_KEY`.

### API Examples
```
curl http://localhost:4000/health
curl http://localhost:4000/lines
curl -X POST http://localhost:4000/fairline -H "Content-Type: application/json" -d '{"player_id":"ANT","market":"PTS","line":25.5}'
curl http://localhost:4000/evidence/ANT
curl http://localhost:4000/video/ANT
```

### Troubleshooting
- CORS: API allows `http://localhost:3000` by default. If frontend hosted elsewhere, adjust origin in `index.ts`.
- Ports: Change via `PORT` env var.
- Missing data: Ensure JSON files exist in `data/` and are valid; restart process to clear in-memory caches.
- Rate limits (when demo off): Evidence/video adapters include basic backoff; persistent failures return empty arrays.

## Core Concepts
- Pricing: Lightweight normal approximation with evidence-driven mean/variance shifts; Monte Carlo for edge & CI.
- Evidence: News snippets with bounded influence (deltaMu, deltaSigma, weight) -> applied list retained for audit.
- Streaming: WebSocket broadcast of periodic recompute (simulating live line/news updates); planned Redis pub/sub.
- Offline Mode: Use `data/` JSON and disable external API calls (future flag injection).

## Scripts
At repo root (Turborepo):
- `pnpm dev` — parallel web + api
- `pnpm build` — build all packages
- `pnpm test` — run test pipelines (add tests in each package)

## Extending
- Replace in-memory priors with DuckDB or SQLite adapter.
- Insert Perplexity adapter (caching layer) under `apps/api/src/adapters/perplexity.ts`.
- Insert TwelveLabs adapter for clip search.
- Add Redis (Upstash) pub/sub for multi-instance broadcast.

## Security & Compliance
- API keys only from server environment; never shipped to browser.
- Evidence cache strips personally identifiable information; retains source URLs.

## Roadmap (Hackathon 48h)
- T+6h: Working pricing endpoint & UI integration.
- T+18h: Lines ingestor + caching + evidence retrieval.
- T+30h: TwelveLabs clips & latency instrumentation (OTel spans).
- T+42h: Offline demo mode + polish + deck.

## License
MIT (hackathon prototype). Clean-room for data feeds.
