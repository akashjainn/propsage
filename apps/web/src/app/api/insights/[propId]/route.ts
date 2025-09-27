import { NextResponse } from 'next/server';
import { getInsights } from '@/server/mockInsights';

export async function GET(_: Request, { params }: { params: { propId: string } }) {
  const data = await getInsights(params.propId);
  return NextResponse.json(data);
}
