import fs from 'fs'
import path from 'path'

interface PlayerProp { playerId: string; market: string; line: number; source: string; ts: string }
interface Prior { playerId: string; market: string; mu: number; sigma: number; updatedAt: string }
interface Evidence { playerId: string; snippets: EvidenceSnippet[] }
interface EvidenceSnippet { id: string; text: string; source: string; url: string; weight: number; timestamp?: string }
interface VideoCache { playerId: string; clips: VideoClip[] }
interface VideoClip { id: string; title: string; url: string; thumbnailUrl?: string; relevanceScore?: number; duration?: number }

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
