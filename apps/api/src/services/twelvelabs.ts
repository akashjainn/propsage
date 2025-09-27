import fetch from 'node-fetch'
import { config } from '../config'
import { getVideos, VideoClip } from './demoCache'

export interface VideoHit { id: string; title: string; url: string; thumbnailUrl?: string; relevanceScore?: number; duration?: number }

export async function findSimilarClips(playerId: string, playerName: string): Promise<VideoClip[]> {
  if (config.demoMode) return getVideos(playerId)
  if (!config.twelveLabsKey) return []
  // Placeholder search call (real index id would be env-configured)
  const query = `aggressive drive vs drop coverage ${playerName}`
  try {
    const resp = await fetch('https://api.twelvelabs.io/v1.3/indexes/demo-index/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': config.twelveLabsKey },
      body: JSON.stringify({ query, page_size: 3 })
    })
    if (!resp.ok) return []
    const json: any = await resp.json()
    return (json.data || []).map((d: any, i: number) => ({
      id: d.id || String(i),
      title: d.metadata?.title || 'Similar Clip',
      url: d.video_url || d.url || '',
      thumbnailUrl: d.thumbnail_url,
      relevanceScore: d.score,
      duration: d.duration || 10,
    }))
  } catch { return [] }
}
