import { NextRequest, NextResponse } from 'next/server';
// NOTE: We cannot import the props route module directly because Next.js route type checks disallow extra exports.
// Instead we lazily reconstruct the same GAME_PROPS data here. Consider consolidating into a shared non-route module later.

// Mirror of GAME_PROPS from props route (consider centralizing later)
const GAME_PROPS: Record<string, any[]> = {
  'illinois-usc-20250927': [
    { playerId: 'luke-altmyer', playerName: 'Luke Altmyer', team: 'ILL', position: 'QB', propType: 'passing_yds', propLabel: 'Passing Yards', marketLine: 295.2, fairLine: 328, edgePct: 11.1, confidence: 'high', bullets: [ { title: '📈 Altmyer exceeded 300+ yards in 4 of last 6 games' }, { title: '🎯 USC secondary allows 285 yards/game (ranked 89th)' }, { title: '🏆 Actual game result: 328 passing yards' }, { title: '⚖️ Market undervalued by 32.8 yards (11.1% edge)' } ], updatedAt: new Date().toISOString() },
    { playerId: 'luke-altmyer', playerName: 'Luke Altmyer', team: 'ILL', position: 'QB', propType: 'pass_tds', propLabel: 'Passing Touchdowns', marketLine: 2.5, fairLine: 3, edgePct: 20.0, confidence: 'high', bullets: [ { title: '🔥 3 TD passes vs USC in actual game' }, { title: '📊 USC allows 2.8 passing TDs per game' }, { title: '🎯 Red zone efficiency suggests 3+ TDs likely' }, { title: '💰 20% edge over market line' } ], updatedAt: new Date().toISOString() },
    { playerId: 'kaden-feagin', playerName: 'Kaden Feagin', team: 'ILL', position: 'RB', propType: 'receiving_yds', propLabel: 'Receiving Yards', marketLine: 56.3, fairLine: 64, edgePct: 13.7, confidence: 'med', bullets: [ { title: '📈 64 receiving yards in actual game performance' }, { title: '🎯 Key target for Altmyer in backfield' }, { title: '💪 Consistent 40+ yard games this season' }, { title: '⚖️ 13.7% edge over market expectations' } ], updatedAt: new Date().toISOString() },
    { playerId: 'justin-bowick', playerName: 'Justin Bowick', team: 'ILL', position: 'WR', propType: 'receiving_yds', propLabel: 'Receiving Yards', marketLine: 22.0, fairLine: 25, edgePct: 13.6, confidence: 'med', bullets: [ { title: '🏆 25 receiving yards in actual game' }, { title: '🎯 Smart route runner finds soft spots' }, { title: '📊 Consistent chain-moving target' }, { title: '💰 13.6% edge opportunity' } ], updatedAt: new Date().toISOString() }
  ],
  'gt-wake-forest-20250927': [
    { playerId: 'haynes-king', playerName: 'Haynes King', team: 'GT', position: 'QB', propType: 'passing_yds', propLabel: 'Passing Yards', marketLine: 215.5, fairLine: 225.8, edgePct: 4.8, confidence: 'med', bullets: [ { title: '📈 King averages 220+ yards vs ACC opponents' }, { title: '🎯 Wake Forest secondary vulnerable deep' }, { title: '💪 Mobile QB extends plays effectively' }, { title: '⚖️ 4.8% edge vs market line' } ], updatedAt: new Date().toISOString() },
    { playerId: 'haynes-king', playerName: 'Haynes King', team: 'GT', position: 'QB', propType: 'rush_tds', propLabel: 'Rushing Touchdowns', marketLine: 0.5, fairLine: 0.75, edgePct: 18.0, confidence: 'high', bullets: [ { title: '🔥 Goal line package featuring King designed runs' }, { title: '📊 2+ rushing TDs in 3 of last 5 games' }, { title: '🎯 Red zone threat with mobility' }, { title: '💰 Strong 18% edge opportunity' } ], updatedAt: new Date().toISOString() },
    { playerId: 'jamal-haynes', playerName: 'Jamal Haynes', team: 'GT', position: 'RB', propType: 'rushing_yds', propLabel: 'Rushing Yards', marketLine: 75.5, fairLine: 68.2, edgePct: -9.7, confidence: 'med', bullets: [ { title: '📉 Wake Forest strong vs run (allows 120 yds/game)' }, { title: '⚠️ Ball security concerns in key moments' }, { title: '🎯 Under opportunity vs market expectation' }, { title: '💰 9.7% under edge' } ], updatedAt: new Date().toISOString() }
  ],
  'uga-alabama-20250927': [
    { playerId: 'gunner-stockton', playerName: 'Gunner Stockton', team: 'UGA', position: 'QB', propType: 'passing_yds', propLabel: 'Passing Yards', marketLine: 242.5, fairLine: 268.3, edgePct: 10.6, confidence: 'high', bullets: [ { title: '🔥 Stockton has thrown for 250+ in 3 of last 4 starts' }, { title: '📊 Alabama secondary allows 245 yards/game (ranked 67th)' }, { title: '🎯 UGA offensive line gives Stockton time in pocket' }, { title: '💰 Strong 10.6% edge over market line' } ], updatedAt: new Date().toISOString() },
    { playerId: 'gunner-stockton', playerName: 'Gunner Stockton', team: 'UGA', position: 'QB', propType: 'pass_tds', propLabel: 'Passing Touchdowns', marketLine: 1.5, fairLine: 2.1, edgePct: 15.2, confidence: 'high', bullets: [ { title: '🎯 Stockton averages 2.3 TD passes in SEC games' }, { title: '🔥 Red zone efficiency at 87% this season' }, { title: '📈 Alabama allows 2.1 passing TDs per game' }, { title: '⚖️ Excellent 15.2% edge opportunity' } ], updatedAt: new Date().toISOString() },
    { playerId: 'trevor-etienne', playerName: 'Trevor Etienne', team: 'UGA', position: 'RB', propType: 'rushing_yds', propLabel: 'Rushing Yards', marketLine: 89.5, fairLine: 107.2, edgePct: 19.8, confidence: 'high', bullets: [ { title: '💪 Etienne has rushed for 100+ in 5 of last 7 games' }, { title: '📊 Alabama run defense allows 127 yards/game' }, { title: '🎯 UGA offensive line creates strong running lanes' }, { title: '🔥 Outstanding 19.8% edge vs market' } ], updatedAt: new Date().toISOString() },
    { playerId: 'jalen-milroe', playerName: 'Jalen Milroe', team: 'ALA', position: 'QB', propType: 'rush_yds', propLabel: 'Rushing Yards', marketLine: 67.5, fairLine: 82.4, edgePct: 22.1, confidence: 'high', bullets: [ { title: '🏃‍♂️ Milroe averages 85+ rushing yards vs ranked teams' }, { title: '📈 UGA allows 72 rushing yards/game to QBs' }, { title: '💨 Mobile QB with designed run packages' }, { title: '⚡ Exceptional 22.1% edge opportunity' } ], updatedAt: new Date().toISOString() },
    { playerId: 'ryan-williams', playerName: 'Ryan Williams', team: 'ALA', position: 'WR', propType: 'receiving_yds', propLabel: 'Receiving Yards', marketLine: 78.5, fairLine: 69.3, edgePct: -11.7, confidence: 'med', bullets: [ { title: '⚠️ UGA secondary allows only 185 passing yards/game' }, { title: '📉 Williams faces elite CB coverage' }, { title: '🎯 Under opportunity vs inflated market' }, { title: '💰 11.7% under edge available' } ], updatedAt: new Date().toISOString() }
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
