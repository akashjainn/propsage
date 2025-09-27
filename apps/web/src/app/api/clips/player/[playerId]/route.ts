import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_URL || 'http://localhost:4000';

export async function GET(
  req: NextRequest,
  { params }: { params: { playerId: string } }
) {
  try {
    const { playerId } = params;
    const searchParams = req.nextUrl.searchParams;
    const tags = searchParams.get('tags');
    const confidence = searchParams.get('confidence');
    const limit = searchParams.get('limit') || '10';

    let url = `${API_BASE_URL}/clips/player/${playerId}?limit=${limit}`;
    if (tags) url += `&tags=${encodeURIComponent(tags)}`;
    if (confidence) url += `&confidence=${confidence}`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      // Add cache control for demo
      next: { revalidate: 300 } // 5 minutes cache
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch clips: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching player clips:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player clips' },
      { status: 500 }
    );
  }
}