import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

function getLocalNFLData() {
  const gamesCandidates = [
    path.resolve(process.cwd(), '../../apps/api/src/data/week5.nfl.games.json'),
    path.resolve(process.cwd(), 'apps/api/src/data/week5.nfl.games.json'),
    path.resolve(process.cwd(), '../api/src/data/week5.nfl.games.json'),
    path.resolve(process.cwd(), '../api/data/week5.nfl.games.json')
  ]
  
  const propsCandidates = [
    path.resolve(process.cwd(), '../../apps/api/src/data/props.nfl.json'),
    path.resolve(process.cwd(), 'apps/api/src/data/props.nfl.json'),
    path.resolve(process.cwd(), '../api/src/data/props.nfl.json'),
    path.resolve(process.cwd(), '../api/data/props.nfl.json')
  ]
  
  let games = []
  let props = []
  
  // Load games
  for (const candidate of gamesCandidates) {
    if (fs.existsSync(candidate)) {
      try {
        games = JSON.parse(fs.readFileSync(candidate, 'utf-8'))
        break
      } catch (e) {
        console.error(`Failed to read games ${candidate}:`, e)
      }
    }
  }
  
  // Load props
  for (const candidate of propsCandidates) {
    if (fs.existsSync(candidate)) {
      try {
        props = JSON.parse(fs.readFileSync(candidate, 'utf-8'))
        break
      } catch (e) {
        console.error(`Failed to read props ${candidate}:`, e)
      }
    }
  }
  
  // Filter props to week 5 teams
  const weekTeams = new Set(games.flatMap((g: any) => [g.home.abbreviation, g.away.abbreviation]))
  const filteredProps = props.filter((p: any) => weekTeams.has(p.team))
  
  return { 
    props: filteredProps, 
    week: 5, 
    season: 2025, 
    count: filteredProps.length 
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL('/nfl/props', API_BASE)
    req.nextUrl.searchParams.forEach((v, k) => url.searchParams.set(k, v))
    if (!url.searchParams.has('week')) url.searchParams.set('week', '5')
    if (!url.searchParams.has('demo')) url.searchParams.set('demo', '1')
    
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
    const localData = getLocalNFLData()
    return NextResponse.json(localData)
    
  } catch (e: any) {
    console.error('NFL Props API error:', e.message)
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 })
  }
}
