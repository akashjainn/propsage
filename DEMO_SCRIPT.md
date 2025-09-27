# PropSage — HackGT 12 Demo Script

## 90-Second Pitch Script

"Hi, I'm Akash and this is PropSage, your fair-value copilot for player props. Props move on rumors, injuries, and role shifts; users need truth and timing. 

We ingest today's lines and compute a quant-grade fair line with a lightweight Bayesian model. Then we pull grounded news via Perplexity, and surface look-alike video clips with TwelveLabs — so every adjustment is explainable.

**[Demo Live]** Watch: Anthony Edwards 25.5 → our fair is 27.2; citations show last-minute rotation news; similar clips highlight his drives vs a comparable scheme. The edge sparkline updates live as we tweak pace.

This hits PrizePicks' Sports Intelligence sweet spot, and the streaming infra + modeling depth is what firms like HRT care about. We're privacy-safe, latency-aware, and demo-ready. Thanks!"

## Demo Flow (2-3 minutes)

### Setup Commands
```bash
# Start demo mode (offline fallback)
pnpm demo

# Or production mode with APIs
PPLX_API_KEY=your-key TL_API_KEY=your-key pnpm dev
```

### Live Demo Steps

1. **Search Player**: "Anthony Edwards PTS 25.5 O/U"
   - Show platform line vs our fair line (27.2)
   - Edge score: +5.9%

2. **Evidence Tab**: 
   - 3 Perplexity citations appear
   - "Coach confirms increased usage, ankle fine"
   - Click through to source links

3. **Video Tab**:
   - TwelveLabs retrieval: "similar defensive schemes" 
   - 10-second montage of comparable plays

4. **Live Updates**:
   - Toggle pace/role sliders
   - Watch fair line shift in real-time
   - <500ms Monte Carlo updates

5. **Explain Math**:
   - Show confidence bands
   - Evidence-adjusted distribution

## Sponsor Alignment

- **PrizePicks**: Sports Intelligence & Insight Systems challenge ✓
- **Perplexity**: Grounded search with citations, rate-limit handling ✓
- **TwelveLabs**: Multimodal video understanding, any-to-video search ✓
- **HRT**: Low-latency streaming, risk modeling, observability ✓

## Backup Demo (Offline Mode)

If WiFi fails, toggle "Demo Mode":
- Pre-cached player data
- Simulated real-time updates
- All features work offline

## Technical Highlights

- **Latency**: <300ms UI updates, <2.5s full page load
- **Coverage**: 3 demo players with 6 prop markets
- **Architecture**: Next.js frontend, Node.js API, TypeScript core
- **Data**: Cached fallbacks, graceful degradation

## Next Steps

- Open source core pricing models
- Pilot with PrizePicks sandbox feeds
- Extend to parlays & correlation modeling