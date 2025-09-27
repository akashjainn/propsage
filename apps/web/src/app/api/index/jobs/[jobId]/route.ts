import { NextResponse } from 'next/server';
import { getJob } from '@/server/mockIndexStore';

export async function GET(_: Request, { params }: { params: { jobId: string } }) {
  const job = getJob(params.jobId);
  return job ? NextResponse.json(job) : NextResponse.json({ error: 'Not found' }, { status: 404 });
}
