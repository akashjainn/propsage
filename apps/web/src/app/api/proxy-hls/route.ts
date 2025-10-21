import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

function isHttpUrl(u: string) {
  try { const x = new URL(u); return x.protocol === 'http:' || x.protocol === 'https:'; } catch { return false; }
}

function resolveUri(base: string, ref: string) {
  try { return new URL(ref, base).toString(); } catch { return ref; }
}

export async function GET(req: NextRequest) {
  const src = new URL(req.url).searchParams.get('src');
  if (!src) return NextResponse.json({ error: 'missing src' }, { status: 400 });
  if (!isHttpUrl(src)) return NextResponse.json({ error: 'invalid src' }, { status: 400 });

  try {
    // Special handling for playlists: rewrite segment/key URIs to go through this proxy
    if (/\.m3u8($|\?)/i.test(src)) {
      const upstream = await fetch(src, { headers: { 'Accept': 'application/vnd.apple.mpegurl,*/*' } });
      const text = await upstream.text();
      const base = src;
      const proxied = text
        .split('\n')
        .map((line) => {
          // Rewrite key URI parameter
          if (line.startsWith('#EXT-X-KEY')) {
            // Find URI="..." and rewrite it
            return line.replace(/URI="([^"]+)"/i, (_m, p1) => {
              const abs = resolveUri(base, p1);
              const wrapped = `/api/proxy-hls?src=${encodeURIComponent(abs)}`;
              return `URI="${wrapped}"`;
            });
          }
          // Ignore comments/directives
          if (line.trim().length === 0 || line.startsWith('#')) return line;
          // Rewrite variant/segment URIs
          const abs = resolveUri(base, line.trim());
          return `/api/proxy-hls?src=${encodeURIComponent(abs)}`;
        })
        .join('\n');

      const res = new NextResponse(proxied);
      res.headers.set('Content-Type', 'application/vnd.apple.mpegurl');
      res.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
      return res;
    }

    // For TS/M4S segments or MP4 and others: stream through
    const upstream = await fetch(src, { headers: { 'Accept': '*/*' } });
    const contentType =
      (/\.(ts|m4s)(\?|$)/i.test(src) ? 'video/mp2t' :
       /\.mp4(\?|$)/i.test(src) ? 'video/mp4' :
       upstream.headers.get('Content-Type') || 'application/octet-stream');

    const res = new NextResponse(upstream.body, { status: upstream.status });
    res.headers.set('Content-Type', contentType);
    res.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
    res.headers.set('Accept-Ranges', 'bytes');
    const len = upstream.headers.get('Content-Length');
    if (len) res.headers.set('Content-Length', len);
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'fetch_failed' }, { status: 502 });
  }
}
