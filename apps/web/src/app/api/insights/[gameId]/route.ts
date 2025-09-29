import { NextRequest, NextResponse } from 'next/server';
// NOTE: We cannot import the props route module directly because Next.js route type checks disallow extra exports.
// Instead we lazily reconstruct the same GAME_PROPS data here. Consider consolidating into a shared non-route module later.

const GAME_PROPS: Record<string, any[]> = {
  'illinois-usc-20250927': [
    // Minimal placeholder; if needed, mirror data from props route or move to shared module.
  ],
  'gt-wake-forest-20250927': [
  ],
  'uga-alabama-20250927': [
  ]
};

// Attempt to hydrate from props route at runtime (best-effort) if environment allows dynamic import.
// Wrapped in try/catch so build won't fail if unsupported.
declare global {
  // eslint-disable-next-line no-var
  var __GAME_PROPS_OVERRIDE__: Record<string, any[]> | undefined;
}
try {
  if (globalThis.__GAME_PROPS_OVERRIDE__) {
    Object.assign(GAME_PROPS, globalThis.__GAME_PROPS_OVERRIDE__);
  }
} catch {}

// Provide an insights-style response derived from GAME_PROPS for compatibility
// Shape: { gameId, insights: [ { playerId, player, team, position, propType, marketLine, fairLine, edge, confidence, bullets, analysis? } ] }

const LEGACY_GAME_ID_MAP: Record<string,string> = {
  'georgia-tech-wake-forest': 'gt-wake-forest-20250927',
  'gatech-wake-20250927': 'gt-wake-forest-20250927',
  'georgia-tech-wake-forest-20250927': 'gt-wake-forest-20250927'
};

function resolveGameId(rawId: string): string | null {
  if (GAME_PROPS[rawId]) return rawId;
  if (LEGACY_GAME_ID_MAP[rawId]) {
    const mapped = LEGACY_GAME_ID_MAP[rawId];
    if (GAME_PROPS[mapped]) return mapped;
  }
  const noDate = rawId.replace(/-20\d{6}$/,'');
  if (noDate !== rawId && LEGACY_GAME_ID_MAP[noDate]) {
    const mapped = LEGACY_GAME_ID_MAP[noDate];
    if (GAME_PROPS[mapped]) return mapped;
  }
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  const { gameId } = params;
  const resolved = resolveGameId(gameId);
  const props = resolved ? GAME_PROPS[resolved] : undefined;

  if (!props) {
    return NextResponse.json({
      error: 'Game not found',
      requested: gameId,
      availableGames: Object.keys(GAME_PROPS)
    }, { status: 404 });
  }

  // Flatten props to insights shape
  const insights = props.map(p => ({
    playerId: p.playerId,
    player: p.playerName,
    team: p.team,
    position: p.position,
    propType: p.propType,
    marketLine: p.marketLine,
    fairLine: p.fairLine,
    edge: p.edgePct,
    confidence: typeof p.confidence === 'string' ? (p.confidence === 'high' ? 95 : p.confidence === 'med' ? 80 : 65) : p.confidence,
    bullets: p.bullets?.map((b: any) => typeof b === 'string' ? b : b.title) || [],
    analysis: p.analysis
  }));

  return NextResponse.json({
    gameId: resolved,
    insights,
    total: insights.length,
    timestamp: new Date().toISOString()
  });
}
