import { Router } from 'express'
import { config } from '../config.js'

const router = Router()

// Cache for FML results
const fmlCache = new Map<string, any>()
const FML_CACHE_DURATION = 2 * 60 * 1000 // 2 minutes

// Simple FML implementation for PropSage
interface BookOdds {
  book: string
  line: number
  over_price: number
  under_price: number
}

interface FMLResult {
  player_id: string
  player_name: string
  market: string
  fair_market_line: number
  confidence: number
  edges: EdgeResult[]
  books_analyzed: number
}

interface EdgeResult {
  book: string
  side: 'over' | 'under'
  line: number
  price: number
  fair_prob: number
  edge_percent: number
  kelly_fraction: number
}

// Simple devigging function
function devigOdds(overPrice: number, underPrice: number): { overProb: number, underProb: number } {
  const overImplied = 1 / overPrice
  const underImplied = 1 / underPrice
  const totalImplied = overImplied + underImplied
  
  // Multiplicative method
  const adjustment = 1 / totalImplied
  return {
    overProb: overImplied * adjustment,
    underProb: underImplied * adjustment
  }
}

// Calculate fair market line using weighted average
function calculateFairLine(books: BookOdds[]): { fairLine: number, confidence: number } {
  if (books.length === 0) return { fairLine: 0, confidence: 0 }
  
  let totalWeight = 0
  let weightedSum = 0
  
  for (const book of books) {
    const { overProb, underProb } = devigOdds(book.over_price, book.under_price)
    const weight = Math.min(book.over_price, book.under_price) // Higher weight for tighter lines
    
    totalWeight += weight
    weightedSum += book.line * weight
  }
  
  const fairLine = weightedSum / totalWeight
  const confidence = Math.min(0.95, books.length * 0.15) // More books = higher confidence
  
  return { fairLine, confidence }
}

// Find edges by comparing book lines to fair line
function findEdges(books: BookOdds[], fairLine: number): EdgeResult[] {
  const edges: EdgeResult[] = []
  
  for (const book of books) {
    const { overProb, underProb } = devigOdds(book.over_price, book.under_price)
    
    // Check over edge
    if (book.line < fairLine) {
      const expectedWinRate = overProb
      const edgePercent = (expectedWinRate * book.over_price - 1) * 100
      
      if (edgePercent > 2) { // Only report edges > 2%
        edges.push({
          book: book.book,
          side: 'over',
          line: book.line,
          price: book.over_price,
          fair_prob: overProb,
          edge_percent: edgePercent,
          kelly_fraction: Math.max(0.01, (expectedWinRate * book.over_price - 1) / (book.over_price - 1))
        })
      }
    }
    
    // Check under edge
    if (book.line > fairLine) {
      const expectedWinRate = underProb
      const edgePercent = (expectedWinRate * book.under_price - 1) * 100
      
      if (edgePercent > 2) {
        edges.push({
          book: book.book,
          side: 'under',
          line: book.line,
          price: book.under_price,
          fair_prob: underProb,
          edge_percent: edgePercent,
          kelly_fraction: Math.max(0.01, (expectedWinRate * book.under_price - 1) / (book.under_price - 1))
        })
      }
    }
  }
  
  return edges.sort((a, b) => b.edge_percent - a.edge_percent)
}

// POST /fml/analyze - Analyze a single prop market for fair market line and edges
router.post('/analyze', async (req, res) => {
  try {
    const { player_id, player_name, market, event_id, books } = req.body

    if (!books || !Array.isArray(books) || books.length === 0) {
      return res.status(400).json({ error: 'Books array is required' })
    }

    // Check cache first
    const cacheKey = `${player_id}-${market}-${event_id}-${books.map((b: any) => `${b.book}:${b.line}`).join(',')}`
    
    const cached = fmlCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < FML_CACHE_DURATION) {
      return res.json(cached.data)
    }

    // Calculate fair market line
    const { fairLine, confidence } = calculateFairLine(books)
    
    // Find edges
    const edges = findEdges(books, fairLine)

    const result: FMLResult = {
      player_id,
      player_name,
      market,
      fair_market_line: Math.round(fairLine * 10) / 10, // Round to 1 decimal
      confidence: Math.round(confidence * 100) / 100,
      edges,
      books_analyzed: books.length
    }

    // Cache the result
    fmlCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    })

    res.json(result)
  } catch (error) {
    console.error('FML analyze error:', error)
    res.status(500).json({ error: 'Failed to analyze FML' })
  }
})

// POST /fml/batch - Analyze multiple prop markets in batch
router.post('/batch', async (req, res) => {
  try {
    const { markets } = req.body

    if (!markets || !Array.isArray(markets)) {
      return res.status(400).json({ error: 'Markets array is required' })
    }

    const results: FMLResult[] = []

    for (const market of markets) {
      const { player_id, player_name, market: marketType, event_id, books } = market
      
      if (!books || !Array.isArray(books) || books.length === 0) {
        continue
      }

      // Calculate fair market line
      const { fairLine, confidence } = calculateFairLine(books)
      
      // Find edges
      const edges = findEdges(books, fairLine)

      results.push({
        player_id,
        player_name,
        market: marketType,
        fair_market_line: Math.round(fairLine * 10) / 10,
        confidence: Math.round(confidence * 100) / 100,
        edges,
        books_analyzed: books.length
      })
    }

    // Sort by best edge percentage
    results.sort((a, b) => {
      const aMaxEdge = Math.max(...a.edges.map(e => e.edge_percent), 0)
      const bMaxEdge = Math.max(...b.edges.map(e => e.edge_percent), 0)
      return bMaxEdge - aMaxEdge
    })

    res.json({
      success: true,
      markets_analyzed: results.length,
      avg_confidence: results.reduce((sum, r) => sum + r.confidence, 0) / results.length,
      total_edges_found: results.reduce((sum, r) => sum + r.edges.length, 0),
      results
    })
  } catch (error) {
    console.error('FML batch error:', error)
    res.status(500).json({ error: 'Failed to analyze batch FML' })
  }
})

// GET /fml/edges - Get best edges from recent analysis
router.get('/edges', async (req, res) => {
  try {
    const { min_edge = '3', limit = '20' } = req.query
    const minEdgeThreshold = parseFloat(min_edge as string)
    const resultLimit = parseInt(limit as string)

    // Get all cached results and extract edges
    const allEdges: (EdgeResult & { player_name: string, market: string })[] = []
    
    for (const [key, cached] of fmlCache.entries()) {
      if (Date.now() - cached.timestamp < FML_CACHE_DURATION) {
        const result = cached.data as FMLResult
        for (const edge of result.edges) {
          if (edge.edge_percent >= minEdgeThreshold) {
            allEdges.push({
              ...edge,
              player_name: result.player_name,
              market: result.market
            })
          }
        }
      }
    }

    // Sort by edge percentage and limit results
    allEdges.sort((a, b) => b.edge_percent - a.edge_percent)
    const topEdges = allEdges.slice(0, resultLimit)

    res.json({
      success: true,
      min_edge_threshold: minEdgeThreshold,
      total_edges_found: allEdges.length,
      edges_returned: topEdges.length,
      edges: topEdges
    })
  } catch (error) {
    console.error('FML edges error:', error)
    res.status(500).json({ error: 'Failed to get FML edges' })
  }
})

// DELETE /fml/cache - Clear FML cache
router.delete('/cache', (req, res) => {
  const cacheSize = fmlCache.size
  fmlCache.clear()
  
  res.json({
    success: true,
    cleared_entries: cacheSize,
    meta: {
      cleared_at: new Date().toISOString()
    }
  })
})

// GET /fml/health - Health check for FML service
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    cache_size: fmlCache.size,
    service: 'PropSage FML Engine',
    version: '1.0.0'
  })
})

export default router