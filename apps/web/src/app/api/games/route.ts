import { NextRequest, NextResponse } from 'next/server';

// General games endpoint - returns today's games by default
export async function GET(req: NextRequest) {
  try {
    // Redirect to today's games endpoint
    const response = await fetch(`${req.nextUrl.origin}/api/cfb/games/today`);
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 });
    }
    
    const games = await response.json();
    return NextResponse.json(games);
  } catch (error) {
    console.error('Error fetching games:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}