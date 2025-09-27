# PropSage — Slide Deck Outline

## Slide 1: The Problem (Hook)
**Title**: Props Swing on Info; Users Lack Grounded, Quantitative Insight

- Sports betting props move on rumors, injuries, role changes
- Casual users can't process news + context + math fast enough
- Existing tools: either pure stats OR pure news, never integrated
- **Pain Point**: "Is 25.5 points fair for Anthony Edwards tonight?"

## Slide 2: Why Now (Insight)
**Title**: Real-Time AI Search + Multimodal Video + Cheap Compute = Explainable Pricing

- **Perplexity API**: Grounded news search with citations (launched 2024)
- **TwelveLabs API**: Any-to-video search, contextual clip retrieval
- **Web Workers**: Client-side Monte Carlo in browsers
- **Timing**: Sports betting legalization + AI API maturity

## Slide 3: Demo & Architecture
**Title**: Live Flow + Technical Stack

**Demo Path**: Search → Fair Value + Edge → Citations → Video → Live Updates

**Architecture**:
```
Frontend (Next.js) ←→ API (Node.js) ←→ Perplexity + TwelveLabs
       ↓                    ↓
Web Worker Monte Carlo   Redis Pub/Sub
```

**Latency Numbers**: <300ms UI, <2.5s full load, real-time WebSocket updates

## Slide 4: Impact & Track Fit  
**Title**: PrizePicks Challenge + AI/Analytics Track

**Sponsor Alignment**:
- ✅ **PrizePicks**: Sports Intelligence & Insight Systems challenge
- ✅ **Perplexity**: Showcase grounded search + citations
- ✅ **TwelveLabs**: Multimodal video understanding demo
- ✅ **HRT**: Low-latency streaming + risk modeling

**Measurable Impact**: Fair line accuracy, evidence citation quality, sub-second updates

## Slide 5: Ask & Next
**Title**: Sponsor Feedback + Pilot Opportunities

**Immediate Ask**:
- Feedback from PrizePicks on sports intelligence approach
- TwelveLabs input on video indexing best practices  
- HRT perspective on risk modeling + observability

**Next Steps**:
- Open source core pricing models
- Pilot with sandbox feeds
- Extend to parlay correlation modeling

**GitHub**: github.com/akashjainn/propsage
**Demo**: [Live URL from Railway/Vercel]