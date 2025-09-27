import { Router } from "express";
import { evidenceService, getMockVideoForDemo, isEvidenceAvailable } from "../services/evidence-service";
import { PropType } from "../types/twelve-labs";

const r = Router();

/**
 * GET /cfb/evidence/health
 * Health check for video intelligence services
 */
r.get("/health", async (req, res) => {
  try {
    const available = isEvidenceAvailable();
    const mockVideos = getMockVideoForDemo();
    
    res.json({
      videoIntelligence: available ? 'available' : 'disabled',
      mockVideosCount: mockVideos.length,
      status: 'ok',
      features: {
        momentPacks: true,
        freeformSearch: available,
        videoIndexing: available
      }
    });
  } catch (error) {
    console.error("Evidence health check error:", error);
    res.status(500).json({ error: "Health check failed" });
  }
});

/**
 * GET /cfb/evidence/prop/:propId
 * Get complete evidence summary for a specific prop
 */
r.get("/prop/:propId", async (req, res) => {
  try {
    const propId = req.params.propId;
    
    // Extract prop details from the prop service
    let propData: any = null;
    try {
      const propResponse = await fetch(`${req.protocol}://${req.get('host')}/cfb/props/${propId}`);
      if (propResponse.ok) {
        propData = await propResponse.json();
      }
    } catch (error) {
      console.warn("Could not fetch prop details for evidence:", error);
    }

    if (!propData) {
      return res.status(404).json({ error: "Prop not found" });
    }

    // Build evidence for this prop
    const evidence = await evidenceService.buildPropEvidence(
      propId,
      `cfb_${propData.playerName.toLowerCase().replace(/\s+/g, '_')}`,
      propData.playerName,
      propData.stat as PropType
    );

    if (!evidence) {
      return res.json({
        propId,
        momentPacks: [],
        features: [],
        summary: {
          totalMoments: 0,
          avgConfidence: 0,
          riskFactors: ['Video intelligence not available'],
          supportFactors: []
        },
        available: false
      });
    }

    res.json({
      ...evidence,
      available: true,
      propInfo: {
        playerName: propData.playerName,
        team: propData.team,
        stat: propData.stat,
        marketLine: propData.marketLine,
        fairLine: propData.fairLine
      }
    });

  } catch (error) {
    console.error("Prop evidence error:", error);
    res.status(500).json({ error: "Failed to fetch prop evidence" });
  }
});

/**
 * GET /cfb/evidence/moments/:playerId/:propType
 * Get moment pack for specific player and prop type
 */
r.get("/moments/:playerId/:propType", async (req, res) => {
  try {
    const playerId = req.params.playerId;
    const propType = req.params.propType as PropType;
    const gameId = req.query.gameId as string;

    // Get player name from player ID
    let playerName = playerId.replace(/^cfb_/, '').replace(/_/g, ' ');
    playerName = playerName.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');

    // Try to get actual player name from players API
    try {
      const playerResponse = await fetch(`${req.protocol}://${req.get('host')}/cfb/players/${playerId}`);
      if (playerResponse.ok) {
        const playerData = await playerResponse.json();
        playerName = playerData.name || playerName;
      }
    } catch (error) {
      console.warn("Could not fetch player name:", error);
    }

    // Build or get moment pack
    const momentPack = await evidenceService.buildMomentPack(
      playerId,
      playerName,
      propType,
      gameId
    );

    if (!momentPack) {
      return res.json({
        playerId,
        propType,
        moments: [],
        metadata: {
          totalMoments: 0,
          avgConfidence: 0,
          lastUpdated: new Date(),
          queries: []
        },
        available: false
      });
    }

    res.json({
      ...momentPack,
      available: true,
      playerInfo: {
        id: playerId,
        name: playerName
      }
    });

  } catch (error) {
    console.error("Moment pack error:", error);
    res.status(500).json({ error: "Failed to fetch moment pack" });
  }
});

/**
 * POST /cfb/evidence/search
 * Free-form search for video moments (Ask the Tape)
 */
r.post("/search", async (req, res) => {
  try {
    const { query, playerName, gameId, limit = 6 } = req.body;

    if (!query) {
      return res.status(400).json({ error: "Search query required" });
    }

    const moments = await evidenceService.searchFreefromMoments(
      query,
      playerName,
      gameId,
      limit
    );

    res.json({
      query,
      moments,
      total: moments.length,
      context: {
        playerName,
        gameId
      },
      available: isEvidenceAvailable()
    });

  } catch (error) {
    console.error("Free-form search error:", error);
    res.status(500).json({ error: "Search failed" });
  }
});

/**
 * POST /cfb/evidence/index
 * Index a new video clip (for Saturday night processing)
 */
r.post("/index", async (req, res) => {
  try {
    const { gameId, s3Url, title, teams, players } = req.body;

    if (!gameId || !s3Url || !title) {
      return res.status(400).json({ 
        error: "Required fields: gameId, s3Url, title" 
      });
    }

    const videoId = await evidenceService.indexVideoClip(
      gameId,
      s3Url,
      title,
      teams || [],
      players || []
    );

    if (!videoId) {
      return res.status(503).json({ 
        error: "Video indexing service unavailable" 
      });
    }

    res.json({
      success: true,
      videoId,
      status: 'indexing',
      message: `Started indexing: ${title}`
    });

  } catch (error) {
    console.error("Video indexing error:", error);
    res.status(500).json({ error: "Indexing failed" });
  }
});

/**
 * POST /cfb/evidence/batch-build
 * Build moment packs for multiple players (nightly batch job)
 */
r.post("/batch-build", async (req, res) => {
  try {
    const { players } = req.body;

    if (!Array.isArray(players)) {
      return res.status(400).json({ 
        error: "Players array required" 
      });
    }

    const results = await evidenceService.batchBuildMomentPacks(players);

    res.json({
      success: true,
      processedPlayers: results.size,
      totalMomentPacks: Array.from(results.values()).reduce((sum, packs) => sum + packs.length, 0),
      results: Array.from(results.entries()).map(([playerId, packs]) => ({
        playerId,
        momentPacks: packs.length,
        propTypes: packs.map(p => p.propType)
      }))
    });

  } catch (error) {
    console.error("Batch build error:", error);
    res.status(500).json({ error: "Batch processing failed" });
  }
});

/**
 * GET /cfb/evidence/videos
 * Get available demo videos for testing
 */
r.get("/videos", async (req, res) => {
  try {
    const mockVideos = getMockVideoForDemo();
    
    res.json({
      videos: mockVideos.map(video => ({
        id: video.id,
        title: video.title,
        teams: video.teams,
        players: video.players,
        status: video.status,
        createdAt: video.createdAt
      })),
      total: mockVideos.length
    });
  } catch (error) {
    console.error("Videos list error:", error);
    res.status(500).json({ error: "Failed to fetch videos" });
  }
});

/**
 * GET /cfb/evidence/demo
 * Get demo data for testing evidence features
 */
r.get("/demo", async (req, res) => {
  try {
    // Create demo moment pack for Carson Beck passing yards
    const demoMomentPack = await evidenceService.buildMomentPack(
      'cfb_carson_beck',
      'Carson Beck',
      'PASS_YDS'
    );

    // Create demo evidence for a sample prop
    const demoEvidence = await evidenceService.buildPropEvidence(
      'prop_cfb_beck_pass_yds_dk',
      'cfb_carson_beck',
      'Carson Beck', 
      'PASS_YDS'
    );

    res.json({
      momentPack: demoMomentPack,
      evidence: demoEvidence,
      mockVideos: getMockVideoForDemo(),
      available: isEvidenceAvailable(),
      message: 'Demo data for Evidence-Backed Props system'
    });

  } catch (error) {
    console.error("Demo data error:", error);
    res.status(500).json({ error: "Failed to generate demo data" });
  }
});

export default r;