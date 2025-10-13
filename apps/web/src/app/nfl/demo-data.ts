// Demo data loader for NFL
import fs from 'fs'
import path from 'path'

interface NFLGame {
  id: string
  week: number
  season: number
  date: string
  status: string
  venue: string
  home: { id: string, name: string, abbreviation: string, score?: number }
  away: { id: string, name: string, abbreviation: string, score?: number }
}

interface NFLProp {
  propId: string
  playerId: string
  playerName: string
  team: string
  stat: string
  book: string
  marketLine: number
  fairLine?: number
  updatedAt: string
}

function findDataFile(filename: string): string | null {
  const candidates = [
    path.resolve(process.cwd(), `../../apps/api/src/data/${filename}`),
    path.resolve(process.cwd(), `apps/api/src/data/${filename}`),
    path.resolve(process.cwd(), `../api/src/data/${filename}`),
    path.resolve(process.cwd(), `../api/data/${filename}`)
  ]
  
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }
  return null
}

export function loadNFLGames(): NFLGame[] {
  try {
    const filePath = findDataFile('week5.nfl.games.json')
    if (!filePath) {
      console.warn('NFL games data file not found')
      return []
    }
    
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Error loading NFL games:', error)
    return []
  }
}

export function loadNFLProps(): NFLProp[] {
  try {
    const filePath = findDataFile('props.nfl.json')
    if (!filePath) {
      console.warn('NFL props data file not found')
      return []
    }
    
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Error loading NFL props:', error)
    return []
  }
}

export function filterPropsForWeek(props: NFLProp[], games: NFLGame[]): NFLProp[] {
  const weekTeams = new Set(games.flatMap(g => [g.home.abbreviation, g.away.abbreviation]))
  return props.filter(p => weekTeams.has(p.team))
}