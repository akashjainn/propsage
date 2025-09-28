import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const src = new URL(req.url).searchParams.get('src');
  if (!src) return NextResponse.json({ error: 'missing src' }, { status: 400 });
  try {
    const upstream = await fetch(src);
    const res = new NextResponse(upstream.body, { status: upstream.status });
    res.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
    res.headers.set('Accept-Ranges', 'bytes');
    if (src.endsWith('.m3u8')) res.headers.set('Content-Type', 'application/vnd.apple.mpegurl');
    if (/\.(ts|m4s)$/i.test(src)) res.headers.set('Content-Type', 'video/mp2t');
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'fetch_failed' }, { status: 502 });
  }
}
