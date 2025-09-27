import fetch from 'node-fetch'
import { config } from '../config'
import { getEvidence, EvidenceSnippet } from './demoCache'

// Simple in-memory TTL cache
const memCache = new Map<string, { ts: number; data: EvidenceSnippet[] }>()
const TTL_MS = 5 * 60 * 1000

export async function searchEvidence(playerId: string, playerName: string): Promise<EvidenceSnippet[]> {
  if (config.demoMode) return getEvidence(playerId)
  const key = `ev:${playerId}`
  const now = Date.now()
  const cached = memCache.get(key)
  if (cached && now - cached.ts < TTL_MS) return cached.data
  if (!config.perplexityKey) return []

  const dateStr = new Date().toISOString().slice(0, 10)
  const body = {
    query: `${playerName} injury minutes role update ${dateStr}`,
    focus: 'news',
    top_k: 3,
  }

  let attempt = 0
  while (attempt < 4) {
    const resp = await fetch('https://api.perplexity.ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.perplexityKey}`,
      },
      body: JSON.stringify(body),
    })
    if (resp.status === 429) {
      const backoff = Math.pow(2, attempt) * 250
      await new Promise(r => setTimeout(r, backoff))
      attempt++
      continue
    }
    if (!resp.ok) return []
    const json: any = await resp.json()
    const items: EvidenceSnippet[] = (json.results || []).map((r: any, i: number) => ({
      id: r.id || String(i),
      text: r.text?.slice(0, 260) || 'N/A',
      source: r.source || 'news',
      url: r.url || r.source_url || '',
      weight: 0.5,
      timestamp: new Date().toISOString(),
    }))
    memCache.set(key, { ts: now, data: items })
    return items
  }
  return []
}
