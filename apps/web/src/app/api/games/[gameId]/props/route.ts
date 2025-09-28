import { NextRequest, NextResponse } from 'next/server';

// Game-specific prop insights for multiple players
const GAME_PROPS = {
  'illinois-usc-20250927': [
    {
      playerId: 'luke-altmyer',
      playerName: 'Luke Altmyer',
      team: 'ILL',
      position: 'QB',
      propType: 'passing_yds',
      propLabel: 'Passing Yards',
      marketLine: 295.2,
      fairLine: 328,
      edgePct: 11.1,
      confidence: 'high',
      bullets: [
        { title: '📈 Altmyer exceeded 300+ yards in 4 of last 6 games' },
        { title: '🎯 USC secondary allows 285 yards/game (ranked 89th)' },
        { title: '🏆 Actual game result: 328 passing yards' },
        { title: '⚖️ Market undervalued by 32.8 yards (11.1% edge)' }
      ],
      supportingClips: [],
      updatedAt: new Date().toISOString()
    },
    {
      playerId: 'luke-altmyer',
      playerName: 'Luke Altmyer',
      team: 'ILL',
      position: 'QB',
      propType: 'pass_tds',
      propLabel: 'Passing Touchdowns',
      marketLine: 2.5,
      fairLine: 3,
      edgePct: 20.0,
      confidence: 'high',
      bullets: [
        { title: '🔥 3 TD passes vs USC in actual game' },
        { title: '📊 USC allows 2.8 passing TDs per game' },
        { title: '🎯 Red zone efficiency suggests 3+ TDs likely' },
        { title: '💰 20% edge over market line' }
      ],
      supportingClips: [],
      updatedAt: new Date().toISOString()
    },
    {
      playerId: 'kaden-feagin',
      playerName: 'Kaden Feagin',
      team: 'ILL',
      position: 'RB',
      propType: 'receiving_yds',
      propLabel: 'Receiving Yards',
      marketLine: 56.3,
      fairLine: 64,
      edgePct: 13.7,
      confidence: 'med',
      bullets: [
        { title: '📈 64 receiving yards in actual game performance' },
        { title: '🎯 Key target for Altmyer in backfield' },
        { title: '💪 Consistent 40+ yard games this season' },
        { title: '⚖️ 13.7% edge over market expectations' }
      ],
      supportingClips: [],
      updatedAt: new Date().toISOString()
    },
    {
      playerId: 'justin-bowick',
      playerName: 'Justin Bowick',
      team: 'ILL',
      position: 'WR',
      propType: 'receiving_yds',
      propLabel: 'Receiving Yards',
      marketLine: 22.0,
      fairLine: 25,
      edgePct: 13.6,
      confidence: 'med',
      bullets: [
        { title: '🏆 25 receiving yards in actual game' },
        { title: '🎯 Smart route runner finds soft spots' },
        { title: '📊 Consistent chain-moving target' },
        { title: '💰 13.6% edge opportunity' }
      ],
      supportingClips: [],
      updatedAt: new Date().toISOString()
    }
  ],
  'georgia-tech-wake-forest': [
    {
      playerId: 'haynes-king',
      playerName: 'Haynes King',
      team: 'GT',
      position: 'QB',
      propType: 'passing_yds',
      propLabel: 'Passing Yards',
      marketLine: 215.5,
      fairLine: 225.8,
      edgePct: 4.8,
      confidence: 'med',
      bullets: [
        { title: '📈 King averages 220+ yards vs ACC opponents' },
        { title: '🎯 Wake Forest secondary vulnerable deep' },
        { title: '💪 Mobile QB extends plays effectively' },
        { title: '⚖️ 4.8% edge vs market line' }
      ],
      supportingClips: [],
      updatedAt: new Date().toISOString()
    },
    {
      playerId: 'haynes-king',
      playerName: 'Haynes King',
      team: 'GT',
      position: 'QB',
      propType: 'rush_tds',
      propLabel: 'Rushing Touchdowns',
      marketLine: 0.5,
      fairLine: 0.75,
      edgePct: 18.0,
      confidence: 'high',
      bullets: [
        { title: '🔥 Goal line package featuring King designed runs' },
        { title: '📊 2+ rushing TDs in 3 of last 5 games' },
        { title: '🎯 Red zone threat with mobility' },
        { title: '💰 Strong 18% edge opportunity' }
      ],
      supportingClips: [],
      updatedAt: new Date().toISOString()
    },
    {
      playerId: 'jamal-haynes',
      playerName: 'Jamal Haynes',
      team: 'GT',
      position: 'RB',
      propType: 'rushing_yds',
      propLabel: 'Rushing Yards',
      marketLine: 75.5,
      fairLine: 68.2,
      edgePct: -9.7,
      confidence: 'med',
      bullets: [
        { title: '📉 Wake Forest strong vs run (allows 120 yds/game)' },
        { title: '⚠️ Ball security concerns in key moments' },
        { title: '🎯 Under opportunity vs market expectation' },
        { title: '💰 9.7% under edge' }
      ],
      supportingClips: [],
      updatedAt: new Date().toISOString()
    }
  ]
};

export async function GET(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  const { gameId } = params;
  
  try {
    const gameProps = GAME_PROPS[gameId as keyof typeof GAME_PROPS];
    
    if (!gameProps) {
      return NextResponse.json({ 
        error: 'Game not found',
        availableGames: Object.keys(GAME_PROPS)
      }, { status: 404 });
    }

    // Group props by player for easier consumption
    const playerProps = gameProps.reduce((acc, prop) => {
      if (!acc[prop.playerId]) {
        acc[prop.playerId] = {
          playerId: prop.playerId,
          playerName: prop.playerName,
          team: prop.team,
          position: prop.position,
          props: []
        };
      }
      acc[prop.playerId].props.push({
        propType: prop.propType,
        propLabel: prop.propLabel,
        marketLine: prop.marketLine,
        fairLine: prop.fairLine,
        edgePct: prop.edgePct,
        confidence: prop.confidence,
        bullets: prop.bullets
      });
      return acc;
    }, {} as any);

    return NextResponse.json({
      gameId,
      players: Object.values(playerProps),
      totalProps: gameProps.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching game props:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}