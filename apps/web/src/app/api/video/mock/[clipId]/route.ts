import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { clipId: string } }) {
  const { clipId } = params;
  
  // Return a JSON response indicating this is a mock clip
  // The video player should handle this gracefully
  return NextResponse.json({
    type: 'mock',
    clipId,
    message: `Mock clip: ${clipId}`,
    duration: 15,
    placeholder: true
  }, { 
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300'
    }
  });
}