import { NextRequest, NextResponse } from 'next/server';
import { createJob, listJobs } from '@/server/mockIndexStore';

export async function GET(req: NextRequest) {
  const playerId = req.nextUrl.searchParams.get('playerId') ?? undefined;
  return NextResponse.json(listJobs(playerId));
}

export async function POST(req: NextRequest) {
  try {
    const { playerId, source, url } = await req.json();
    if (!playerId || !source) {
      return NextResponse.json({ error: 'playerId and source required' }, { status: 400 });
    }
    const job = createJob({ playerId, source, url });
    return NextResponse.json(job, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Invalid payload' }, { status: 400 });
  }
}
