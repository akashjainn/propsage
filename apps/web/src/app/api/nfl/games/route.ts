import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'

function getLocalNFLGames() {
  const candidates = [
    path.resolve(process.cwd(), '../../apps/api/src/data/week5.nfl.games.json'),
    path.resolve(process.cwd(), 'apps/api/src/data/week5.nfl.games.json'),
    path.resolve(process.cwd(), '../api/src/data/week5.nfl.games.json'),
    path.resolve(process.cwd(), '../api/data/week5.nfl.games.json')
  ]
  
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      try {
        const data = JSON.parse(fs.readFileSync(candidate, 'utf-8'))
        return { games: data, week: 5, season: 2025, count: data.length }
      } catch (e) {
        console.error(`Failed to read ${candidate}:`, e)
      }
    }
  }
  return { games: [], week: 5, season: 2025, count: 0 }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL('/nfl/games', API_BASE)
    req.nextUrl.searchParams.forEach((v, k) => url.searchParams.set(k, v))
    if (!url.searchParams.has('week')) url.searchParams.set('week', '5')
    // don't force demo here; let API decide demo/live based on env
    
    // Try to fetch from API server first
    try {
      const r = await fetch(url.toString(), { 
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })
      if (r.ok) {
        const data = await r.json()
        return NextResponse.json(data)
      }
    } catch (apiError) {
      console.log('API server not available, using local fallback')
    }
    
    // Fallback to local data
    const localData = getLocalNFLGames()
    return NextResponse.json(localData)
    
  } catch (e: any) {
    console.error('NFL Games API error:', e.message)
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 })
  }
}
