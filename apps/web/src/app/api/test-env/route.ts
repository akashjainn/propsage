import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  return NextResponse.json({
    TL_API_KEY: process.env.TL_API_KEY ? 'CONFIGURED' : 'NOT_CONFIGURED',
    TWELVELABS_API_KEY: process.env.TWELVELABS_API_KEY ? 'CONFIGURED' : 'NOT_CONFIGURED',
    TWELVELABS_INDEX_ID: process.env.TWELVELABS_INDEX_ID ? 'CONFIGURED' : 'NOT_CONFIGURED',
    allEnvs: Object.keys(process.env).filter(k => k.includes('TL') || k.includes('TWELVE'))
  });
}