/**
 * NFL Player Evidence API Route
 * Proxies player-specific evidence requests to PropSage API
 */

import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function GET(
  request: NextRequest,
  { params }: { params: { playerId: string } }
) {
  try {
    const { playerId } = params;
    
    if (!playerId) {
      return NextResponse.json(
        { error: 'Player ID is required' },
        { status: 400 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    
    // Forward request to PropSage API
    const apiUrl = new URL(`/nfl/evidence/player/${encodeURIComponent(playerId)}`, API_BASE);
    
    // Copy all search params
    searchParams.forEach((value, key) => {
      apiUrl.searchParams.set(key, value);
    });

    const response = await fetch(apiUrl.toString());
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data);

  } catch (error) {
    console.error('NFL player evidence error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get player evidence',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}