// API Service for Prop/Play Alignment
// Express routes that integrate the prop/play alignment system
import { Router } from 'express';
import { PropPlayIngestionService, MarketKey, PbP, PropLine } from '@propsage/core';

const router = Router();

// Initialize the ingestion service
const ingestionService = new PropPlayIngestionService(
  process.env.SPORTSDATAIO_API_KEY || '',
  (play: PbP, delta: any, line: PropLine) => {
    console.log(`🚨 Real-time impact: ${delta.playerId} ${delta.market} moved by ${delta.delta}`);
    // Here you could emit WebSocket events, update caches, etc.
  }
);

/**
 * POST /api/alignment/ingest/:gameId
 * Trigger ingestion for a specific game
 */
router.post('/ingest/:gameId', async (req, res) => {
  try {
    const gameId = parseInt(req.params.gameId);
    
    // Ingest prop lines and PBP events
    await Promise.all([
      ingestionService.ingestPropLines(gameId),
      ingestionService.ingestPBPEvents(gameId)
    ]);

    res.json({
      success: true,
      gameId,
      message: 'Ingestion completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Ingestion error:', error);
    res.status(500).json({
      error: 'Ingestion failed',
      message: (error as Error).message
    });
  }
});

/**
 * GET /api/alignment/progress/:gameId/:playerId/:marketKey
 * Get current stat progress for a player/market
 */
router.get('/progress/:gameId/:playerId/:marketKey', async (req, res) => {
  try {
    const { gameId, playerId, marketKey } = req.params;
    
    const progress = ingestionService.getStatProgress(
      parseInt(gameId), 
      playerId, 
      marketKey as MarketKey
    );

    if (!progress) {
      return res.status(404).json({ error: 'Progress not found' });
    }

    // Get current lines from all books
    const books = ['draftkings', 'fanduel', 'caesars']; // Add more as needed
    const lines = books.map(book => ({
      book,
      line: ingestionService.getCurrentLine(parseInt(gameId), playerId, marketKey as MarketKey, book)
    })).filter(l => l.line);

    res.json({
      progress,
      lines,
      edge: lines.map(l => ({
        book: l.book,
        line: l.line?.line,
        edge: progress.current - (l.line?.line || 0)
      }))
    });
  } catch (error) {
    console.error('Progress fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch progress',
      message: (error as Error).message
    });
  }
});

/**
 * GET /api/alignment/evidence/:playerId/:marketKey
 * Get video evidence for plays that moved a prop
 */
router.get('/evidence/:playerId/:marketKey', async (req, res) => {
  try {
    const { playerId, marketKey } = req.params;
    
    const evidenceLinks = ingestionService.getEvidenceLinks(playerId, marketKey as MarketKey);

    res.json({
      playerId,
      marketKey,
      evidence: evidenceLinks,
      totalPlays: evidenceLinks.length
    });
  } catch (error) {
    console.error('Evidence fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch evidence',
      message: (error as Error).message
    });
  }
});

/**
 * GET /api/alignment/health
 * Health check for the alignment system
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'prop-play-alignment',
    timestamp: new Date().toISOString(),
    config: {
      sportsDataIO: !!process.env.SPORTSDATAIO_API_KEY,
      videoEnabled: !!process.env.VIDEO_ENABLED
    }
  });
});

export { router as alignmentRoutes };