/**
 * NFL Evidence API Routes
 * 
 * Routes for querying Week 5 NFL highlights and converting them to PropSage evidence
 */

import { Router } from 'express';
import { nflEvidenceService } from '../services/nfl-evidence-service.js';

const router = Router();

/**
 * GET /nfl/evidence/search
 * Search NFL highlights with a custom query
 */
router.get('/search', async (req, res) => {
  try {
    const { q: query, limit = 10, minScore = 0.6 } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'Query parameter "q" is required'
      });
    }

    const evidence = await nflEvidenceService.searchHighlights(query, {
      limit: parseInt(limit as string, 10),
      minScore: parseFloat(minScore as string)
    });

    res.json({
      query,
      totalResults: evidence.length,
      evidence,
      week: 5,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('NFL evidence search error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

/**
 * GET /nfl/evidence/player/:playerId
 * Get evidence for a specific player's props
 */
router.get('/player/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    const { 
      propType = 'rushing_attempts',
      team,
      limit = 8,
      minScore = 0.6
    } = req.query;

    if (!playerId) {
      return res.status(400).json({
        error: 'Player ID is required'
      });
    }

    const playerEvidence = await nflEvidenceService.getPlayerPropEvidence(
      playerId,
      propType as string,
      {
        team: team as string,
        limit: parseInt(limit as string, 10),
        minScore: parseFloat(minScore as string)
      }
    );

    res.json(playerEvidence);

  } catch (error) {
    console.error('NFL player evidence error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

/**
 * GET /nfl/evidence/props/:propType
 * Get evidence for a specific prop type (league-wide)
 */
router.get('/props/:propType', async (req, res) => {
  try {
    const { propType } = req.params;
    const { 
      player,
      team,
      limit = 15,
      minScore = 0.6
    } = req.query;

    const evidence = await nflEvidenceService.getEvidenceForProp(
      propType,
      player as string,
      team as string,
      {
        limit: parseInt(limit as string, 10),
        minScore: parseFloat(minScore as string)
      }
    );

    // Aggregate stats
    const totalClips = evidence.length;
    const avgConfidence = totalClips > 0 
      ? evidence.reduce((sum, e) => sum + e.confidence, 0) / totalClips 
      : 0;
    const topTags = [...new Set(evidence.flatMap(e => e.tags))]
      .slice(0, 10);

    res.json({
      propType,
      player,
      team,
      evidence,
      stats: {
        totalClips,
        avgConfidence: Math.round(avgConfidence * 100) / 100,
        topTags,
        week: 5
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('NFL prop evidence error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

/**
 * GET /nfl/evidence/batch
 * Get evidence for multiple prop queries in one request
 */
router.post('/batch', async (req, res) => {
  try {
    const { queries, options = {} } = req.body;

    if (!Array.isArray(queries) || queries.length === 0) {
      return res.status(400).json({
        error: 'Queries array is required'
      });
    }

    if (queries.length > 10) {
      return res.status(400).json({
        error: 'Maximum 10 queries per batch request'
      });
    }

    const results = await Promise.all(
      queries.map(async (query: string) => {
        const evidence = await nflEvidenceService.searchHighlights(query, {
          limit: options.limit || 5,
          minScore: options.minScore || 0.6
        });

        return {
          query,
          evidence: evidence.slice(0, 3), // Top 3 per query
          count: evidence.length
        };
      })
    );

    // Aggregate all evidence and remove duplicates
    const allEvidence = results.flatMap(r => r.evidence);
    const uniqueEvidence = nflEvidenceService['deduplicateClips'](allEvidence);

    res.json({
      queries,
      results,
      aggregated: {
        totalEvidence: uniqueEvidence.length,
        evidence: uniqueEvidence.slice(0, options.limit || 10),
        avgConfidence: uniqueEvidence.length > 0
          ? uniqueEvidence.reduce((sum, e) => sum + e.confidence, 0) / uniqueEvidence.length
          : 0
      },
      week: 5,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('NFL batch evidence error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

/**
 * GET /nfl/evidence/patterns
 * Get available query patterns for different prop types
 */
router.get('/patterns', (req, res) => {
  const patterns = {
    propTypes: [
      'rushing_attempts', 'rushing_yards', 'rushing_touchdowns',
      'passing_attempts', 'passing_yards', 'passing_touchdowns', 
      'receptions', 'receiving_yards', 'receiving_touchdowns'
    ],
    contexts: [
      'red_zone', 'fourth_quarter', 'third_down'
    ],
    examples: {
      'rushing_touchdowns': 'rushing touchdown goal line',
      'passing_yards': 'explosive pass 20+ yards', 
      'red_zone': 'red zone attempt goal line',
      'fourth_quarter': 'fourth quarter drive'
    },
    usage: {
      player: '/nfl/evidence/player/Lamar%20Jackson?propType=rushing_touchdowns',
      search: '/nfl/evidence/search?q=touchdown%20pass%20red%20zone&limit=5',
      props: '/nfl/evidence/props/rushing_attempts?team=Ravens&limit=10'
    }
  };

  res.json(patterns);
});

/**
 * GET /nfl/evidence/health
 * Health check for TwelveLabs integration
 */
router.get('/health', async (req, res) => {
  try {
    // Test with simple query
    const testResult = await nflEvidenceService.searchHighlights('touchdown', { limit: 1 });
    
    res.json({
      status: 'healthy',
      twelvelabs: process.env.TWELVELABS_API_KEY ? 'configured' : 'missing',
      indexId: process.env.TWELVELABS_INDEX_ID ? 'configured' : 'missing',
      testQuery: testResult.length > 0 ? 'success' : 'no_results',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    });
  }
});

export { router as nflEvidenceRoutes };