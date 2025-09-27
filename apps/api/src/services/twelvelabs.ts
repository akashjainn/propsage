import fetch from 'node-fetch'
import { config } from '../config.js'
import { getVideos, VideoClip } from './demoCache.js'

// Enhanced interfaces for video intelligence
export interface VideoHit { 
  id: string
  title: string
  url: string
  thumbnailUrl?: string
  relevanceScore?: number
  duration?: number
  start?: number
  end?: number
  metadata?: any
}

export interface VideoSignal {
  entity_type: 'player' | 'team' | 'game' | 'weather'
  entity_id: string
  event_id: string
  timestamp: string
  signal_type: 'injury' | 'minutes_restriction' | 'role_change' | 'weather' | 'coach_comment'
  value: number
  confidence: number
  evidence: {
    video_id: string
    start_time: number
    end_time: number
    description: string
    source: string
  }[]
}

export interface IndexConfig {
  name: string
  engines: Array<{
    engine_name: string
    engine_options: string[]
  }>
  addons?: string[]
}

class TwelveLabsVideoIntelligence {
  private baseUrl = 'https://api.twelvelabs.io/v1.2'
  private requestCount = 0
  private indexes: Map<string, string> = new Map() // league -> index_id

  constructor() {
    // Initialize known indexes
    this.indexes.set('NBA-2025', process.env.TL_NBA_INDEX || '')
    this.indexes.set('NFL-2025', process.env.TL_NFL_INDEX || '')
    this.indexes.set('Pressers-2025', process.env.TL_PRESSER_INDEX || '')
  }

  private async request(endpoint: string, options: any = {}): Promise<any> {
    if (!config.twelveLabsKey) {
      throw new Error('TwelveLabs API key not configured')
    }

    this.requestCount++
    console.log(`📹 TwelveLabs API call #${this.requestCount}: ${endpoint}`)

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'x-api-key': config.twelveLabsKey,
        'Content-Type': 'application/json',
        ...options.headers
      }
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`TwelveLabs API error: ${response.status} ${error}`)
    }

    return response.json()
  }

  /**
   * Create video intelligence indexes for different leagues/seasons
   */
  async createVideoIntelligenceIndexes(): Promise<void> {
    const indexConfigs: Array<{name: string, config: IndexConfig}> = [
      {
        name: 'NBA-2025',
        config: {
          name: 'NBA-2025',
          engines: [
            { engine_name: 'marengo2.6', engine_options: ['visual', 'conversation', 'text_in_video'] }
          ],
          addons: ['thumbnail']
        }
      },
      {
        name: 'NFL-2025', 
        config: {
          name: 'NFL-2025',
          engines: [
            { engine_name: 'marengo2.6', engine_options: ['visual', 'conversation', 'text_in_video'] }
          ],
          addons: ['thumbnail']
        }
      },
      {
        name: 'Pressers-2025',
        config: {
          name: 'Pressers-2025', 
          engines: [
            { engine_name: 'marengo2.6', engine_options: ['conversation', 'text_in_video'] }
          ],
          addons: ['thumbnail']
        }
      }
    ]

    for (const {name, config: indexConfig} of indexConfigs) {
      if (!this.indexes.get(name)) {
        try {
          const response = await this.request('/indexes', {
            method: 'POST',
            body: JSON.stringify(indexConfig)
          })
          this.indexes.set(name, response._id)
          console.log(`✅ Created TwelveLabs index: ${name} (${response._id})`)
        } catch (error) {
          console.error(`❌ Failed to create index ${name}:`, error)
        }
      }
    }
  }

  /**
   * Search for video intelligence signals
   */
  async searchVideoIntelligence(queries: string[], league = 'NBA-2025'): Promise<VideoSignal[]> {
    const indexId = this.indexes.get(league)
    if (!indexId) {
      console.warn(`⚠️  No index found for ${league}`)
      return []
    }

    const allSignals: VideoSignal[] = []

    for (const query of queries) {
      try {
        const hits = await this.searchVideoHits(indexId, query)
        const signals = await this.extractSignalsFromHits(hits, query)
        allSignals.push(...signals)
      } catch (error) {
        console.error(`❌ Error searching for "${query}":`, error)
      }
    }

    return allSignals
  }

  async searchVideoHits(indexId: string, query: string): Promise<VideoHit[]> {
    const response = await this.request(`/indexes/${indexId}/search`, {
      method: 'POST',
      body: JSON.stringify({
        query,
        options: ['visual', 'conversation', 'text_in_video'],
        conversation_option: 'semantic',
        page_limit: 10,
        threshold: 'medium'
      })
    })

    return (response.data || []).map((hit: any) => ({
      id: hit.video_id,
      title: hit.metadata?.title || 'Video Clip',
      url: hit.video_url || '',
      thumbnailUrl: hit.thumbnail_url,
      relevanceScore: hit.score,
      duration: hit.end - hit.start,
      start: hit.start,
      end: hit.end,
      metadata: hit.metadata
    }))
  }

  private async extractSignalsFromHits(hits: VideoHit[], originalQuery: string): Promise<VideoSignal[]> {
    const signals: VideoSignal[] = []

    for (const hit of hits) {
      // Extract different types of signals based on query patterns
      if (originalQuery.toLowerCase().includes('injury') || originalQuery.toLowerCase().includes('hurt')) {
        signals.push({
          entity_type: 'player',
          entity_id: this.extractPlayerFromQuery(originalQuery),
          event_id: hit.metadata?.event_id || 'unknown',
          timestamp: new Date().toISOString(),
          signal_type: 'injury',
          value: this.assessInjurySeverity(hit, originalQuery),
          confidence: hit.relevanceScore || 0.5,
          evidence: [{
            video_id: hit.id,
            start_time: hit.start || 0,
            end_time: hit.end || 0,
            description: `Found in search: "${originalQuery}"`,
            source: 'twelvelabs'
          }]
        })
      }

      if (originalQuery.toLowerCase().includes('minutes') || originalQuery.toLowerCase().includes('pitch count')) {
        signals.push({
          entity_type: 'player',
          entity_id: this.extractPlayerFromQuery(originalQuery),
          event_id: hit.metadata?.event_id || 'unknown',
          timestamp: new Date().toISOString(),
          signal_type: 'minutes_restriction',
          value: 0.6, // Default restriction probability
          confidence: hit.relevanceScore || 0.5,
          evidence: [{
            video_id: hit.id,
            start_time: hit.start || 0,
            end_time: hit.end || 0,
            description: `Found in search: "${originalQuery}"`,
            source: 'twelvelabs'
          }]
        })
      }

      if (originalQuery.toLowerCase().includes('weather') || originalQuery.toLowerCase().includes('rain')) {
        signals.push({
          entity_type: 'game',
          entity_id: hit.metadata?.event_id || 'unknown',
          event_id: hit.metadata?.event_id || 'unknown',
          timestamp: new Date().toISOString(),
          signal_type: 'weather',
          value: 0.7, // Weather impact probability
          confidence: hit.relevanceScore || 0.5,
          evidence: [{
            video_id: hit.id,
            start_time: hit.start || 0,
            end_time: hit.end || 0,
            description: `Found in search: "${originalQuery}"`,
            source: 'twelvelabs'
          }]
        })
      }
    }

    return signals
  }

  private extractPlayerFromQuery(query: string): string {
    // Simple player name extraction - in production use NER
    const commonNames = ['mahomes', 'edwards', 'doncic', 'tatum', 'allen', 'brown']
    const lowerQuery = query.toLowerCase()
    
    for (const name of commonNames) {
      if (lowerQuery.includes(name)) {
        return name
      }
    }
    
    return 'unknown-player'
  }

  private assessInjurySeverity(hit: VideoHit, query: string): number {
    // Assess injury severity based on context clues
    const text = `${hit.title} ${query}`.toLowerCase()
    
    if (text.includes('out') || text.includes('ir') || text.includes('surgery')) return 0.9
    if (text.includes('questionable') || text.includes('doubtful')) return 0.6
    if (text.includes('probable') || text.includes('day-to-day')) return 0.3
    
    return 0.5 // Default moderate concern
  }

  /**
   * Run standard video intelligence queries for upcoming games
   */
  async runVideoIntelligenceDigest(league = 'NBA-2025'): Promise<VideoSignal[]> {
    const standardQueries = [
      'player limping injury concern',
      'coach minutes restriction pitch count',
      'weather conditions rain snow visibility',
      'lineup changes starting rotation',
      'practice limited participation',
      'press conference injury update',
      'questionable doubtful game status',
      'ankle knee shoulder injury'
    ]

    console.log(`🎬 Running video intelligence digest for ${league}...`)
    return this.searchVideoIntelligence(standardQueries, league)
  }

  getUsageStats() {
    return {
      requests_used: this.requestCount,
      indexes_created: this.indexes.size,
      estimated_cost: this.requestCount * 0.005 // Rough estimate per search
    }
  }
}

// Legacy function for backward compatibility
export async function findSimilarClips(playerId: string, playerName: string): Promise<VideoClip[]> {
  if (config.demoMode) return getVideos(playerId)
  if (!config.twelveLabsKey) return []

  try {
    const videoIntel = new TwelveLabsVideoIntelligence()
    const hits = await videoIntel.searchVideoHits(
      process.env.TL_NBA_INDEX || 'demo-index',
      `${playerName} highlights gameplay analysis`
    )
    
    return hits.map(hit => ({
      id: hit.id,
      title: hit.title,
      url: hit.url,
      thumbnailUrl: hit.thumbnailUrl,
      relevanceScore: hit.relevanceScore,
      duration: hit.duration || 10
    }))
  } catch (error) {
    console.error('❌ Error finding clips:', error)
    return []
  }
}

export const videoIntelligenceService = new TwelveLabsVideoIntelligence()
