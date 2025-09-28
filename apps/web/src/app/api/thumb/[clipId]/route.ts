import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { clipId: string } }) {
  const { clipId } = params;
  
  // Return a placeholder SVG thumbnail
  const svg = `
    <svg width="320" height="180" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#1e293b"/>
      <text x="50%" y="50%" text-anchor="middle" fill="#94a3b8" font-family="system-ui" font-size="14">
        ${clipId}
      </text>
      <text x="50%" y="65%" text-anchor="middle" fill="#64748b" font-family="system-ui" font-size="12">
        Video Clip
      </text>
    </svg>
  `;
  
  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}