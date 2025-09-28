import { NextRequest, NextResponse } from 'next/server';

// Mock props data for different games
const MOCK_PROPS: Record<string, any[]> = {
  'uga-bama-2024': [
    {
      id: 'gunner-stockton-passing-yards',
      player: 'Gunner Stockton',
      playerId: 'gunner-stockton',
      prop: 'Passing Yards',
      market: 245.5,
      fair: 258.2,
      edge: 5.2,
      position: 'QB',
      team: 'UGA',
      confidence: 0.78
    },
    {
      id: 'jalen-milroe-passing-yards',
      player: 'Jalen Milroe',
      playerId: 'jalen-milroe',
      prop: 'Passing Yards',
      market: 225.5,
      fair: 240.8,
      edge: 6.8,
      position: 'QB',
      team: 'BAMA',
      confidence: 0.82
    }
  ],
  'illinois-usc-20250927': [
    {
      id: 'luke-altmyer-passing-yards',
      player: 'Luke Altmyer',
      playerId: 'luke-altmyer',
      prop: 'Passing Yards',
      market: 215.5,
      fair: 225.8,
      edge: 4.8,
      position: 'QB',
      team: 'ILL',
      confidence: 0.75
    }
  ]
};

export async function GET(req: NextRequest) {
  const gameId = req.nextUrl.searchParams.get('gameId');
  
  if (!gameId) {
    return NextResponse.json(
      { error: 'gameId parameter required' }, 
      { status: 400 }
    );
  }
  
  try {
    const props = MOCK_PROPS[gameId] || [];
    
    return NextResponse.json({ 
      gameId,
      props,
      count: props.length 
    });
  } catch (error) {
    console.error('Error fetching props:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}