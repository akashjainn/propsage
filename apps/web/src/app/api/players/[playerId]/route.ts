import { NextRequest, NextResponse } from 'next/server';

// Mock player data
const MOCK_PLAYERS: Record<string, any> = {
  'gunner-stockton': {
    id: 'gunner-stockton',
    name: 'Gunner Stockton',
    position: 'QB',
    team: 'Georgia',
    teamAbbrev: 'UGA',
    number: 14,
    height: '6-1',
    weight: 205,
    year: 'Sophomore',
    stats: {
      passing: {
        completions: 157,
        attempts: 251,
        yards: 2045,
        touchdowns: 18,
        interceptions: 5,
        rating: 148.2
      }
    }
  },
  'haynes-king': {
    id: 'haynes-king',
    name: 'Haynes King',
    position: 'QB',
    team: 'Georgia Tech',
    teamAbbrev: 'GT',
    number: 10,
    height: '6-3',
    weight: 205,
    year: 'Senior',
    stats: {
      passing: {
        completions: 189,
        attempts: 298,
        yards: 2156,
        touchdowns: 15,
        interceptions: 8,
        rating: 135.4
      }
    }
  }
};

export async function GET(
  req: NextRequest,
  { params }: { params: { playerId: string } }
) {
  const { playerId } = params;
  
  try {
    const player = MOCK_PLAYERS[playerId];
    
    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' }, 
        { status: 404 }
      );
    }
    
    return NextResponse.json({ player });
  } catch (error) {
    console.error('Error fetching player:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}