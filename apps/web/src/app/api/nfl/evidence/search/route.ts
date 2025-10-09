/**
 * NFL Evidence Search API Route
 * Proxies requests to the PropSage API
 */

import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    // Forward request to PropSage API
    const apiUrl = new URL('/nfl/evidence/search', API_BASE);
    
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
    console.error('NFL evidence search error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to search NFL evidence',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}