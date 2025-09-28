import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { clipId: string } }) {
  const { clipId } = params;
  
  try {
    const apiKey = process.env.TL_API_KEY || process.env.TWELVELABS_API_KEY;
    
    if (!apiKey) {
      return new NextResponse('TwelveLabs API key not configured', { status: 503 });
    }

    // Fetch video from TwelveLabs
    const response = await fetch(`https://api.twelvelabs.io/v1.2/clips/${clipId}/video`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      return new NextResponse('Video not found', { status: 404 });
    }

    // Proxy the video with CORS headers for thumbnail extraction
    return new NextResponse(response.body, {
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'video/mp4',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Range',
        'Cache-Control': 'public, max-age=86400',
        'Accept-Ranges': 'bytes',
        'Content-Length': response.headers.get('Content-Length') || '',
      },
    });
  } catch (error) {
    console.error('Error proxying TwelveLabs video:', error);
    return new NextResponse('Failed to fetch video', { status: 500 });
  }
}