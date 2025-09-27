// FML Integration Service - Combines market data with model predictions
import { devig, calculateConsensus, buildProbabilityCurve, solveFairMarketLine, calculateEdges, type BookWeight, type ProbabilityCurve, type EdgeCalculation } from '../fml/index.js'
import { predictPlayerOutcome, calculateProbabilityOver, type PlayerFeatures, type DistributionParams } from '../models/distributions.js'

export interface PropMarket {
  player_id: string
  player_name: string
  market: string
  sport: string
  event_id: string
  
  // Market data
  books: Array<{
    book: string
    line: number
    over_price: number
    under_price: number
    timestamp: string
  }>
  
  // Context
  features: PlayerFeatures
  
  // Results
  fair_market_line?: number
  confidence?: number
  edges?: EdgeCalculation[]
  market_curve?: ProbabilityCurve
  model_curve?: ProbabilityCurve
  blended_curve?: ProbabilityCurve
}

export interface FMLConfig {
  book_weights: BookWeight[]
  blend_alpha: number  // Model vs market weight (0=all market, 1=all model)
  min_books: number    // Minimum books required for consensus
  line_range: { min: number, max: number, step: number }
  confidence_threshold: number
}

/**
 * Fair Market Line Service - Complete pipeline from odds to edges
 */
export class FMLService {
  private config: FMLConfig
  
  constructor(config: Partial<FMLConfig> = {}) {
    this.config = {
      book_weights: [
        { book: 'pinnacle', weight: 2.0, sharpness: 0.95, liquidity: 0.9 },
        { book: 'fanduel', weight: 1.5, sharpness: 0.85, liquidity: 0.95 },
        { book: 'draftkings', weight: 1.5, sharpness: 0.85, liquidity: 0.95 },
        { book: 'betmgm', weight: 1.2, sharpness: 0.80, liquidity: 0.85 },
        { book: 'caesars', weight: 1.2, sharpness: 0.78, liquidity: 0.80 },
        { book: 'pointsbet', weight: 1.0, sharpness: 0.75, liquidity: 0.75 }
      ],
      blend_alpha: 0.3, // 30% model, 70% market by default
      min_books: 2,
      line_range: { min: 0, max: 50, step: 0.25 },
      confidence_threshold: 0.1,
      ...config
    }
  }
  
  /**
   * Process a complete prop market and generate FML + edges
   */
  async processMarket(market: PropMarket): Promise<PropMarket> {
    try {
      // Step 1: Validate minimum data requirements
      if (market.books.length < this.config.min_books) {
        throw new Error(`Insufficient books: ${market.books.length} < ${this.config.min_books}`)
      }
      
      // Step 2: Devig odds and build market consensus
      const marketCurve = await this.buildMarketCurve(market.books)
      
      // Step 3: Generate model prediction
      const modelCurve = await this.buildModelCurve(market)
      
      // Step 4: Blend market and model
      const blendedCurve = this.blendCurves(marketCurve, modelCurve, market)
      
      // Step 5: Solve for Fair Market Line
      const fmlResult = solveFairMarketLine(blendedCurve, this.config.line_range)
      
      // Step 6: Calculate edges at quoted lines
      const edges = calculateEdges(
        market.books.map(b => ({
          book: b.book,
          line: b.line,
          overPrice: b.over_price,
          underPrice: b.under_price
        })),
        blendedCurve
      )
      
      // Return enhanced market with results
      return {
        ...market,
        fair_market_line: fmlResult.line,
        confidence: fmlResult.confidence,
        edges: edges.filter(e => Math.abs(e.edge) > 0.02), // Only meaningful edges
        market_curve: marketCurve,
        model_curve: modelCurve,
        blended_curve: blendedCurve
      }
      
    } catch (error) {
      console.error(`Error processing market for ${market.player_name} ${market.market}:`, error)
      throw error
    }
  }
  
  /**
   * Build market probability curve from book odds
   */
  private async buildMarketCurve(books: PropMarket['books']): Promise<ProbabilityCurve> {
    // Devig each book's odds
    const bookProbs = books.map(book => {
      const { pOver, pUnder } = devig(book.over_price, book.under_price)
      return {
        book: book.book,
        line: book.line,
        pOver,
        pUnder
      }
    })
    
    // Calculate weighted consensus
    const consensus = calculateConsensus(bookProbs, this.config.book_weights)
    
    // If all books quote the same line, create synthetic points around it
    const uniqueLines = [...new Set(books.map(b => b.line))]
    let curvePoints: Array<{ line: number, pOver: number }>
    
    if (uniqueLines.length === 1) {
      const line = uniqueLines[0]
      const pOver = consensus.pOverConsensus
      
      // Create synthetic curve around the single line
      curvePoints = [
        { line: line - 2, pOver: Math.min(0.99, pOver * 1.3) },
        { line: line - 1, pOver: Math.min(0.99, pOver * 1.15) },
        { line: line, pOver },
        { line: line + 1, pOver: Math.max(0.01, pOver * 0.85) },
        { line: line + 2, pOver: Math.max(0.01, pOver * 0.7) }
      ]
    } else {
      // Use actual quoted lines and consensus probabilities
      curvePoints = bookProbs.map(bp => ({
        line: bp.line,
        pOver: bp.pOver
      }))
    }
    
    return buildProbabilityCurve(curvePoints, this.config.line_range)
  }
  
  /**
   * Build model-based probability curve
   */
  private async buildModelCurve(market: PropMarket): Promise<ProbabilityCurve> {
    // Get predictive distribution for this player/market
    const distribution = predictPlayerOutcome(
      market.player_id,
      market.market,
      market.features,
      market.sport
    )
    
    // Generate probability curve over line range
    const lines: number[] = []
    const probabilities: number[] = []
    
    for (let line = this.config.line_range.min; line <= this.config.line_range.max; line += this.config.line_range.step) {
      lines.push(line)
      const pOver = calculateProbabilityOver(line, distribution)
      probabilities.push(Math.max(0.01, Math.min(0.99, pOver)))
    }
    
    return {
      evaluate: (line: number) => {
        const pOver = calculateProbabilityOver(line, distribution)
        return Math.max(0.01, Math.min(0.99, pOver))
      },
      lines,
      probabilities
    }
  }
  
  /**
   * Blend market and model curves using Bayesian approach
   */
  private blendCurves(
    marketCurve: ProbabilityCurve,
    modelCurve: ProbabilityCurve,
    market: PropMarket
  ): ProbabilityCurve {
    
    // Adaptive alpha based on market conditions
    let alpha = this.config.blend_alpha
    
    // Trust model more when:
    // 1. Injury/news uncertainty is high
    // 2. Market spread is wide (books disagree)
    // 3. Model confidence is high
    
    if (market.features.injury_probability && market.features.injury_probability > 0.5) {
      alpha += 0.2 // Trust model more with injury uncertainty
    }
    
    if (market.features.minutes_restriction && market.features.minutes_restriction > 0.4) {
      alpha += 0.15 // Trust model more with minutes restrictions
    }
    
    // Calculate market spread
    const marketLines = market.books.map(b => b.line)
    const lineSpread = Math.max(...marketLines) - Math.min(...marketLines)
    if (lineSpread > 2) {
      alpha += 0.1 // Trust model more when books disagree
    }
    
    // Cap alpha
    alpha = Math.max(0.05, Math.min(0.8, alpha))
    
    // Generate blended curve
    const lines: number[] = []
    const probabilities: number[] = []
    
    for (let line = this.config.line_range.min; line <= this.config.line_range.max; line += this.config.line_range.step) {
      lines.push(line)
      
      const pMarket = marketCurve.evaluate(line)
      const pModel = modelCurve.evaluate(line)
      const pBlended = alpha * pModel + (1 - alpha) * pMarket
      
      probabilities.push(Math.max(0.01, Math.min(0.99, pBlended)))
    }
    
    return {
      evaluate: (line: number) => {
        const pMarket = marketCurve.evaluate(line)
        const pModel = modelCurve.evaluate(line)
        const pBlended = alpha * pModel + (1 - alpha) * pMarket
        return Math.max(0.01, Math.min(0.99, pBlended))
      },
      lines,
      probabilities
    }
  }
  
  /**
   * Batch process multiple markets
   */
  async processMarkets(markets: PropMarket[]): Promise<PropMarket[]> {
    const results = await Promise.allSettled(
      markets.map(market => this.processMarket(market))
    )
    
    return results
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<PropMarket>).value)
  }
  
  /**
   * Get best edges across all processed markets
   */
  getBestEdges(markets: PropMarket[], minEdge: number = 0.03): EdgeCalculation[] {
    const allEdges = markets
      .flatMap(market => market.edges || [])
      .filter(edge => Math.abs(edge.edge) >= minEdge)
      .sort((a, b) => Math.abs(b.edge) - Math.abs(a.edge))
    
    return allEdges.slice(0, 20) // Top 20 edges
  }
  
  /**
   * Update configuration
   */
  updateConfig(config: Partial<FMLConfig>) {
    this.config = { ...this.config, ...config }
  }
  
  /**
   * Get current configuration
   */
  getConfig(): FMLConfig {
    return { ...this.config }
  }
}

// Export default configured instance
export const fmlService = new FMLService()