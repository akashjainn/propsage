import { videoIntelligenceService, type VideoSignal } from './twelvelabs.js'

export interface PlayerFeatures {
  usage_rate?: number
  minutes_projected?: number
  targets_per_game?: number
  opponent_dvoa?: number
  opponent_drtg?: number
  pace?: number
  spread?: number
  total?: number
  implied_team_total?: number
  weather_impact?: number
  rest_days?: number
  home_advantage?: boolean
  injury_probability?: number
  minutes_restriction?: number
  questionable_tag?: boolean
  video_intelligence_confidence?: number
}

export interface PropMarket {
  player_id: string
  player_name: string
  market: string
  sport: string
  event_id: string
  books: Array<{
    book: string
    line: number
    over_price: number
    under_price: number
    timestamp: string
  }>
  features: PlayerFeatures
  fair_market_line?: number
  confidence?: number
}

export interface VideoIntelligentFMLConfig {
  video_weight: number // How much to weight video intelligence (0-1)
  signal_decay_hours: number // How quickly signals decay over time
  min_confidence: number // Minimum confidence for video signals
  max_signals_per_player: number // Limit signals to prevent overweighting
}

export interface EnhancedPropMarket extends PropMarket {
  video_signals?: VideoSignal[]
  video_adjustments?: {
    injury_risk: number
    minutes_risk: number
    weather_impact: number
    role_change: number
    confidence: number
  }
}

/**
 * Video Intelligence Enhanced Fair Market Line Service
 * Integrates Twelve Labs video analysis to influence FML calculations
 */
export class VideoIntelligentFMLService {
  private videoConfig: VideoIntelligentFMLConfig

  constructor(config: Partial<VideoIntelligentFMLConfig> = {}) {
    this.videoConfig = {
      video_weight: 0.15, // 15% influence from video signals
      signal_decay_hours: 48, // Signals decay over 48 hours
      min_confidence: 0.3, // Minimum 30% confidence
      max_signals_per_player: 10, // Max 10 signals per player
      ...config
    }
  }

  /**
   * Enhanced market processing with video intelligence integration
   */
  async enhanceMarketWithVideo(market: PropMarket): Promise<EnhancedPropMarket> {
    console.log(`🎬 Enhancing market with video intelligence: ${market.player_name} ${market.market}`)
    
    try {
      // Step 1: Gather video intelligence signals
      const videoSignals = await this.gatherVideoSignals(market)
      
      // Step 2: Calculate video-based adjustments to player features
      const videoAdjustments = this.calculateVideoAdjustments(videoSignals, market)
      
      // Step 3: Apply video adjustments to player features
      const enhancedFeatures = this.enhancePlayerFeatures(market.features, videoAdjustments)
      
      // Step 4: Return enhanced market with video intelligence
      return {
        ...market,
        features: enhancedFeatures,
        video_signals: videoSignals,
        video_adjustments: videoAdjustments
      }
      
    } catch (error) {
      console.error(`❌ Error in video intelligence enhancement:`, error)
      // Return original market if video processing fails
      return {
        ...market,
        video_signals: [],
        video_adjustments: {
          injury_risk: 0,
          minutes_risk: 0,
          weather_impact: 0,
          role_change: 0,
          confidence: 0
        }
      }
    }
  }

  /**
   * Gather relevant video intelligence signals for a player
   */
  private async gatherVideoSignals(market: PropMarket): Promise<VideoSignal[]> {
    const playerQueries = this.buildPlayerQueries(market.player_name, market.market)
    
    // Search for video signals
    const allSignals = await videoIntelligenceService.searchVideoIntelligence(
      playerQueries,
      this.getLeagueFromSport(market.sport)
    )
    
    // Filter and rank signals
    return this.filterAndRankSignals(allSignals, market.player_id)
  }

  /**
   * Build targeted search queries based on player and market type
   */
  private buildPlayerQueries(playerName: string, market: string): string[] {
    const baseQueries = [
      `${playerName} injury concern status`,
      `${playerName} minutes restriction`,
      `${playerName} press conference update`
    ]

    // Market-specific queries
    if (market.includes('points') || market.includes('pts')) {
      baseQueries.push(
        `${playerName} shooting form accuracy`,
        `${playerName} offensive rhythm confidence`,
        `${playerName} hand wrist finger injury`
      )
    }

    if (market.includes('rebounds') || market.includes('reb')) {
      baseQueries.push(
        `${playerName} back knee injury`,
        `${playerName} positioning rebounding`,
        `${playerName} starting lineup rotation`
      )
    }

    if (market.includes('assists') || market.includes('ast')) {
      baseQueries.push(
        `${playerName} court vision passing`,
        `${playerName} shoulder elbow injury`,
        `${playerName} point guard role change`
      )
    }

    if (market.includes('threes') || market.includes('3pt')) {
      baseQueries.push(
        `${playerName} three point shooting`,
        `${playerName} shooting form mechanics`,
        `${playerName} confidence rhythm`
      )
    }

    return baseQueries
  }

  /**
   * Filter and rank video signals by relevance and recency
   */
  private filterAndRankSignals(signals: VideoSignal[], playerId: string): VideoSignal[] {
    const now = new Date()
    
    return signals
      .filter(signal => {
        // Filter by confidence threshold
        if (signal.confidence < this.videoConfig.min_confidence) return false
        
        // Filter by recency (signals decay over time)
        const signalAge = now.getTime() - new Date(signal.timestamp).getTime()
        const ageHours = signalAge / (1000 * 60 * 60)
        return ageHours < this.videoConfig.signal_decay_hours
      })
      .sort((a, b) => {
        // Sort by confidence * recency
        const aRecency = this.calculateRecencyWeight(a.timestamp)
        const bRecency = this.calculateRecencyWeight(b.timestamp)
        return (b.confidence * bRecency) - (a.confidence * aRecency)
      })
      .slice(0, this.videoConfig.max_signals_per_player)
  }

  /**
   * Calculate recency weight (1.0 = now, 0.1 = max decay)
   */
  private calculateRecencyWeight(timestamp: string): number {
    const now = new Date()
    const signalTime = new Date(timestamp)
    const ageHours = (now.getTime() - signalTime.getTime()) / (1000 * 60 * 60)
    
    // Exponential decay over configured hours
    const decayRate = Math.log(0.1) / this.videoConfig.signal_decay_hours
    return Math.max(0.1, Math.exp(decayRate * ageHours))
  }

  /**
   * Calculate video-based adjustments to influence the model
   */
  private calculateVideoAdjustments(signals: VideoSignal[], market: PropMarket): EnhancedPropMarket['video_adjustments'] {
    let injuryRisk = 0
    let minutesRisk = 0
    let weatherImpact = 0
    let roleChange = 0
    let totalConfidence = 0

    for (const signal of signals) {
      const weight = signal.confidence * this.calculateRecencyWeight(signal.timestamp)
      
      switch (signal.signal_type) {
        case 'injury':
          injuryRisk += signal.value * weight
          break
        case 'minutes_restriction':
          minutesRisk += signal.value * weight
          break
        case 'weather':
          weatherImpact += signal.value * weight
          break
        case 'role_change':
          roleChange += signal.value * weight
          break
      }
      
      totalConfidence += weight
    }

    // Normalize by total confidence
    const confidence = Math.min(1.0, totalConfidence / signals.length)
    
    return {
      injury_risk: Math.min(1.0, injuryRisk),
      minutes_risk: Math.min(1.0, minutesRisk),
      weather_impact: Math.min(1.0, weatherImpact),
      role_change: Math.min(1.0, roleChange),
      confidence
    }
  }

  /**
   * Enhance player features with video intelligence adjustments
   */
  private enhancePlayerFeatures(
    baseFeatures: PlayerFeatures,
    adjustments: EnhancedPropMarket['video_adjustments']
  ): PlayerFeatures {
    if (!adjustments || adjustments.confidence < 0.1) {
      return baseFeatures // No significant video signals
    }

    const adjustmentWeight = this.videoConfig.video_weight * adjustments.confidence

    return {
      ...baseFeatures,
      
      // Adjust usage rate based on minutes restriction risk
      usage_rate: baseFeatures.usage_rate ? 
        baseFeatures.usage_rate * (1 - adjustments.minutes_risk * adjustmentWeight * 0.4) :
        baseFeatures.usage_rate,
      
      // Adjust minutes projection based on injury risk
      minutes_projected: baseFeatures.minutes_projected ?
        baseFeatures.minutes_projected * (1 - adjustments.injury_risk * adjustmentWeight * 0.3) :
        baseFeatures.minutes_projected,
      
      // Adjust weather impact
      weather_impact: Math.min(1.0, 
        (baseFeatures.weather_impact || 0) + (adjustments.weather_impact * adjustmentWeight * 0.15)
      ),
      
      // Increase injury probability based on video signals
      injury_probability: Math.min(1.0,
        (baseFeatures.injury_probability || 0) + (adjustments.injury_risk * adjustmentWeight * 0.5)
      ),
      
      // Increase minutes restriction probability
      minutes_restriction: Math.min(1.0,
        (baseFeatures.minutes_restriction || 0) + (adjustments.minutes_risk * adjustmentWeight * 0.6)
      ),
      
      // Add video confidence as a feature
      video_intelligence_confidence: adjustments.confidence
    }
  }

  /**
   * Map sport to league for video search
   */
  private getLeagueFromSport(sport: string): string {
    switch (sport.toLowerCase()) {
      case 'basketball':
      case 'nba':
        return 'NBA-2025'
      case 'football':
      case 'nfl':
        return 'NFL-2025'
      default:
        return 'NBA-2025' // Default fallback
    }
  }

  /**
   * Get usage statistics including video intelligence
   */
  getUsageStats() {
    const videoStats = videoIntelligenceService.getUsageStats()
    
    return {
      video_searches: videoStats.requests_used,
      video_indexes: videoStats.indexes_created,
      estimated_video_cost: videoStats.estimated_cost,
      markets_enhanced: 0, // Would track this in production
      signals_processed: 0 // Would track this in production
    }
  }
}

// Export singleton instance
export const videoIntelligentFMLService = new VideoIntelligentFMLService({
  video_weight: 0.15,
  signal_decay_hours: 48,
  min_confidence: 0.3,
  max_signals_per_player: 10
})