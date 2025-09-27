import { NextRequest, NextResponse } from 'next/server';
import { fetchBoxScore, generatePropFromBoxScore, getGameFromBoxScore } from '@/server/providers/boxscore';

export async function GET(req: NextRequest) {
  const gameId = req.nextUrl.searchParams.get('gameId');
  if (!gameId) {
    return NextResponse.json({ error: 'gameId parameter required' }, { status: 400 });
  }

  try {
    const boxScore = await fetchBoxScore(gameId);
    if (!boxScore) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    const game = getGameFromBoxScore(gameId);
    
    // Generate props for key players
    const props = [];
    const propTypes = ['Passing Yards', 'Passing Touchdowns', 'Rushing Yards', 'Receiving Yards'];
    
    for (const player of boxScore.players) {
      for (const propType of propTypes) {
        const prop = generatePropFromBoxScore(player, propType, gameId);
        if (prop && prop.fair > 0) {
          props.push(prop);
        }
      }
    }

    // Filter to most interesting props (top performers)
    const topProps = props
      .filter(p => p.fair >= (p.prop.includes('Yards') ? 50 : 1))
      .sort((a, b) => parseFloat(b.edge) - parseFloat(a.edge))
      .slice(0, 12);

    return NextResponse.json({
      game,
      boxScore,
      props: topProps
    });

  } catch (error: any) {
    console.error('Game data fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch game data' }, { status: 500 });
  }
}