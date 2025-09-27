import fs from 'fs'
import path from 'path'

interface PlayerProp { playerId: string; market: string; line: number; source: string; ts: string }
interface Prior { playerId: string; market: string; mu: number; sigma: number; updatedAt: string }
interface Evidence { playerId: string; snippets: EvidenceSnippet[] }
interface EvidenceSnippet { id: string; text: string; source: string; url: string; weight: number; timestamp?: string }
interface VideoCache { playerId: string; clips: VideoClip[] }
interface VideoClip { id: string; title: string; url: string; thumbnailUrl?: string; relevanceScore?: number; duration?: number }

// Player name mapping for demo/display purposes
const PLAYER_NAMES: Record<string, string> = {
  'anthony-edwards': 'Anthony Edwards',
  'luka-doncic': 'Luka Doncic', 
  'jayson-tatum': 'Jayson Tatum'
}

// Reverse mapping for search
const NAME_TO_ID: Record<string, string> = {
  'anthony edwards': 'anthony-edwards',
  'luka doncic': 'luka-doncic',
  'jayson tatum': 'jayson-tatum',
  'ant': 'anthony-edwards',
  'ae': 'anthony-edwards',
  'luka': 'luka-doncic',
  'ld': 'luka-doncic',
  'tatum': 'jayson-tatum',
  'jt': 'jayson-tatum'
}

export function getPlayerName(playerId: string): string {
  return PLAYER_NAMES[playerId] || playerId
}

export function findPlayerId(query: string): string | null {
  const normalized = query.toLowerCase().trim()
  
  // Direct match
  if (NAME_TO_ID[normalized]) {
    return NAME_TO_ID[normalized]
  }
  
  // Partial match on first/last name
  for (const [key, id] of Object.entries(NAME_TO_ID)) {
    if (key.includes(normalized) || normalized.includes(key)) {
      return id
    }
  }
  
  return null
}

let propsCache: PlayerProp[] | null = null
let priorsCache: Prior[] | null = null
let evidenceCache: Record<string, EvidenceSnippet[]> | null = null
let videoCache: Record<string, VideoClip[]> | null = null

function loadJSON<T>(rel: string): T {
  // Try data directory relative to repo root first (deployment)
  let file = path.resolve(process.cwd(), '..', '..', 'data', rel)
  if (!fs.existsSync(file)) {
    // Fallback to data directory relative to current working directory (development)
    file = path.resolve(process.cwd(), 'data', rel)
  }
  const raw = fs.readFileSync(file, 'utf-8')
  return JSON.parse(raw) as T
}

export function getProps(): PlayerProp[] {
  if (!propsCache) propsCache = loadJSON<PlayerProp[]>('sample_lines.json')
  return propsCache
}

export function getPriors(): Prior[] {
  if (!priorsCache) priorsCache = loadJSON<Prior[]>('sample_priors.json')
  return priorsCache
}

export function getEvidence(playerId: string): EvidenceSnippet[] {
  if (!evidenceCache) {
    try {
      evidenceCache = loadJSON<Evidence[]>('evidence.cache.json').reduce<Record<string, EvidenceSnippet[]>>((acc, row) => {
        acc[row.playerId] = row.snippets
        return acc
      }, {})
    } catch { evidenceCache = {} }
  }
  return evidenceCache[playerId] || []
}

export function getVideos(playerId: string): VideoClip[] {
  if (!videoCache) {
    try {
      videoCache = loadJSON<VideoCache[]>('video.cache.json').reduce<Record<string, VideoClip[]>>((acc, row) => {
        acc[row.playerId] = row.clips
        return acc
      }, {})
    } catch { videoCache = {} }
  }
  return videoCache[playerId] || []
}

export type { PlayerProp, Prior, EvidenceSnippet, VideoClip }
