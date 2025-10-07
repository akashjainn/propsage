import { Router } from "express";
import { LRUCache } from "lru-cache";
import { ClipSearchQuery, SocialClip, Platform } from "../types/social-clips.js";
import { mockTwelveLabsService } from "../services/twelvelabs.mock.js";

const r = Router();

// Cache aggregated search results for 30 minutes
const aggregatedCache = new LRUCache<string, SocialClip[]>({ 
  max: 100, 
  ttl: 1000 * 60 * 30 
});

// Cache individual clips for 24 hours
const clipCache = new LRUCache<string, SocialClip>({ 
  max: 500, 
  ttl: 1000 * 60 * 60 * 24 
});

/**
 * GET /cfb/clips
 * Search for clips by player, team, opponent, etc.
 * 
 * Query params:
 * - player: Player name (e.g., "Ryan Puglisi")
 * - team: Team name (e.g., "Georgia") 
 * - opponent: Opponent team (e.g., "Alabama")
 * - date: Game date (e.g., "2024-09-27")
 * - stat: Stat type (e.g., "passing", "rushing", "receiving")
 * - gameType: Game context (e.g., "highlights", "touchdown")
 * - limit: Max results (default: 12)
 */
r.get("/", async (req, res) => {
  try {
    const query: ClipSearchQuery = {
      player: req.query.player as string,
      team: req.query.team as string,
      opponent: req.query.opponent as string,
      date: req.query.date as string,
      stat: req.query.stat as string,
      gameType: req.query.gameType as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 12
    };

    // Create cache key from query parameters
    const cacheKey = JSON.stringify(query);
    const cached = aggregatedCache.get(cacheKey);
    if (cached) {
      return res.json({ clips: cached, cached: true });
    }

    // If no meaningful search criteria, return empty
    if (!query.player && !query.team) {
      return res.json({ clips: [], error: "Either player or team parameter required" });
    }

    const clips: SocialClip[] = [];

    // Use TwelveLabs "Video Brain" for intelligent clip search
    try {
      // Determine player ID from query
      const playerId = query.player ? `cfb_${query.player.toLowerCase().replace(/\s+/g, '_')}` : undefined;
      const searchQuery = [query.player, query.stat, query.gameType].filter(Boolean).join(' ');
      const tags = query.stat ? [query.stat.toLowerCase()] : undefined;

      const twelveLabsResults = await mockTwelveLabsService.search(searchQuery, playerId, tags);
      
      // Convert TwelveLabs results to SocialClip format
      for (const result of twelveLabsResults.results) {
        clips.push({
          id: `twelvelabs_${result.id}`,
          platform: 'twelvelabs' as Platform,
          externalId: result.id,
          title: result.title,
          description: result.clips?.[0]?.description || result.title,
          url: result.url,
          thumbnailUrl: result.thumbnail,
          author: result.metadata?.source || `${query.team || 'CFB'} Highlights`,
          authorUrl: result.url,
          duration: result.duration,
          publishedAt: result.metadata?.date || new Date().toISOString(),
          viewCount: Math.floor(Math.random() * 100000) + 10000,
          relevanceScore: result.confidence,
          tags: result.tags || ['highlights'],
          gameContext: {
            opponent: result.metadata?.opponent,
            date: result.metadata?.date,
            week: result.metadata?.week,
            season: 2025
          }
        });
      }

      console.log(`Found ${clips.length} TwelveLabs clips for query:`, query);
    } catch (error) {
      console.error("TwelveLabs search failed:", error);
    }

    // Remove duplicates and sort by confidence
    const uniqueClips = deduplicateClips(clips);
    const sortedClips = uniqueClips
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      .slice(0, query.limit || 12);

    // Cache results
    aggregatedCache.set(cacheKey, sortedClips);

    res.json({
      clips: sortedClips,
      total: sortedClips.length,
      cached: false,
      providers: ['twelvelabs'],
      indexStatus: 'ready',
      poweredBy: 'TwelveLabs Video Intelligence'
    });

  } catch (error) {
    console.error("Clips search error:", error);
    res.status(500).json({ error: "Failed to search clips" });
  }
});

/**
 * GET /cfb/clips/:clipId
 * Get detailed information about a specific clip
 */
r.get("/:clipId", async (req, res) => {
  try {
    const clipId = req.params.clipId;
    
    if (!clipId) {
      return res.status(400).json({ error: "Clip ID required" });
    }

    // Check cache first
    const cached = clipCache.get(clipId);
    if (cached) {
      return res.json({ clip: cached, cached: true });
    }

    let clip: SocialClip | null = null;

    // Parse platform from clip ID (format: platform_externalId)
    const [platform, externalId] = clipId.split('_', 2);
    
    if (platform === 'twelvelabs' && externalId) {
      // Mock TwelveLabs clip lookup
      const searchResult = await mockTwelveLabsService.search(externalId, undefined, undefined);
      const foundClip = searchResult.results.find(r => r.id === externalId);
      if (foundClip) {
        // Convert to SocialClip format
        clip = {
          id: clipId,
          platform: 'twelvelabs' as Platform,
          externalId: foundClip.id,
          title: foundClip.title,
          description: foundClip.clips?.[0]?.description || foundClip.title,
          url: foundClip.url,
          thumbnailUrl: foundClip.thumbnail,
          author: foundClip.metadata?.source || 'CFB Highlights',
          authorUrl: foundClip.url,
          duration: foundClip.duration,
          publishedAt: foundClip.metadata?.date || new Date().toISOString(),
          viewCount: Math.floor(Math.random() * 100000) + 10000,
          relevanceScore: foundClip.confidence,
          tags: foundClip.tags || ['highlights'],
          gameContext: {
            opponent: foundClip.metadata?.opponent,
            date: foundClip.metadata?.date,
            week: foundClip.metadata?.week,
            season: 2025
          }
        };
      }
    }
    // TODO: Add other platform lookups here

    if (!clip) {
      return res.status(404).json({ error: "Clip not found" });
    }

    // Cache the result
    clipCache.set(clipId, clip);

    res.json({ clip, cached: false });

  } catch (error) {
    console.error("Clip fetch error:", error);
    res.status(500).json({ error: "Failed to fetch clip details" });
  }
});

/**
 * GET /cfb/clips/:clipId/embed
 * Get embeddable HTML for a clip
 */
r.get("/:clipId/embed", async (req, res) => {
  try {
    const clipId = req.params.clipId;
    
    // First get the clip details
    const clipResponse = await fetch(`${req.protocol}://${req.get('host')}/cfb/clips/${clipId}`);
    
    if (!clipResponse.ok) {
      return res.status(404).json({ error: "Clip not found" });
    }

    const { clip }: { clip: SocialClip } = await clipResponse.json();
    
    let embedHtml = '';
    
    // Generate platform-specific embed
    if (clip.platform === 'twelvelabs') {
      // Mock TwelveLabs embed HTML
      embedHtml = `
        <div class="twelvelabs-embed" style="position: relative; width: 100%; height: 0; padding-bottom: 56.25%;">
          <iframe 
            src="${clip.url}?autoplay=1&start=${clip.startTime || 0}&end=${clip.endTime || clip.duration}"
            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;"
            allowfullscreen
            title="${clip.title}"
          ></iframe>
          <div class="powered-by" style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.8); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
            Powered by TwelveLabs
          </div>
        </div>
      `;
    }
    // TODO: Add other platform embed generation

    if (!embedHtml) {
      return res.status(501).json({ error: "Embed not supported for this platform" });
    }

    // Return as JSON for API usage
    if (req.accepts('json')) {
      return res.json({ 
        html: embedHtml,
        clip: {
          id: clip.id,
          platform: clip.platform,
          title: clip.title,
          author: clip.author,
          url: clip.url
        }
      });
    }

    // Return raw HTML for direct embedding
    res.setHeader('Content-Type', 'text/html');
    res.send(embedHtml);

  } catch (error) {
    console.error("Embed generation error:", error);
    res.status(500).json({ error: "Failed to generate embed" });
  }
});

/**
 * GET /cfb/clips/player/:playerId
 * Get clips for a specific CFB player by their ID
 */
r.get("/player/:playerId", async (req, res) => {
  try {
    const playerId = req.params.playerId;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 8;
    
    // Extract player name from ID if possible
    // Format: cfb_ryan_puglisi -> "Ryan Puglisi"
    let playerName = playerId.replace(/^cfb_/, '').replace(/_/g, ' ');
    playerName = playerName.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');

    // Try to get additional context from player data
    let team: string | undefined;
    try {
      const playerResponse = await fetch(`${req.protocol}://${req.get('host')}/cfb/players/${playerId}`);
      if (playerResponse.ok) {
        const playerData = await playerResponse.json();
        team = playerData.team;
        playerName = playerData.name || playerName; // Use actual name if available
      }
    } catch (error) {
      console.warn("Could not fetch player details:", error);
    }

    // Search TwelveLabs Video Brain for player clips
    const searchQuery = `${playerName} highlights`;
    // Try real TwelveLabs first, fallback to mock
    let clips: SocialClip[] = [];
    
    if (process.env.TL_API_KEY && process.env.TWELVELABS_INDEX_ID) {
      try {
        console.log(`[CFB Clips] Using TwelveLabs search for: ${searchQuery}`);
        
        // Use the enhanced search service
        const { tlSearchService } = await import('../services/twelvelabs-search.js');
        const result = await tlSearchService.searchClips({
          player: playerName,
          stat: 'highlights',
          limit: limit
        });
        
        clips = result.clips.map((clip: any) => ({
          id: clip.id,
          platform: 'twelvelabs' as Platform,
          externalId: clip.externalId,
          title: clip.title,
          description: clip.description,
          url: clip.url,
          thumbnailUrl: clip.thumbnailUrl,
          author: clip.author || 'TwelveLabs Highlights',
          authorUrl: clip.url,
          duration: clip.duration,
          publishedAt: clip.publishedAt,
          viewCount: Math.floor(Math.random() * 100000) + 10000,
          relevanceScore: clip.relevanceScore,
          tags: clip.tags || ['highlights'],
          gameContext: clip.gameContext || {}
        }));
        
        console.log(`[CFB Clips] TwelveLabs returned ${clips.length} clips`);
        
      } catch (error) {
        console.error(`[CFB Clips] TwelveLabs error:`, error);
        console.log(`[CFB Clips] Falling back to mock service`);
      }
    }
    
    // Fallback to mock if no TwelveLabs results
    if (clips.length === 0) {
      console.log(`[CFB Clips] Using mock TwelveLabs service`);
      const twelveLabsResults = await mockTwelveLabsService.search(searchQuery, playerId);
      
      clips = twelveLabsResults.results.map(result => ({
        id: `mock_${result.id}`,
        platform: 'twelvelabs' as Platform,
        externalId: result.id,
        title: result.title,
        description: result.clips?.[0]?.description || result.title,
        url: result.url,
        thumbnailUrl: result.thumbnail,
        author: result.metadata?.source || `${team || 'CFB'} Highlights`,
        authorUrl: result.url,
        duration: result.duration,
        publishedAt: result.metadata?.date || new Date().toISOString(),
        viewCount: Math.floor(Math.random() * 100000) + 10000,
        relevanceScore: result.confidence,
        tags: result.tags || ['highlights'],
        gameContext: {
          opponent: result.metadata?.opponent,
          date: result.metadata?.date,
          week: result.metadata?.week,
          season: 2025
        }
      }));
    }

    res.json({
      clips,
      player: {
        id: playerId,
        name: playerName,
        team
      },
      total: clips.length
    });

  } catch (error) {
    console.error("Player clips search error:", error);
    res.status(500).json({ error: "Failed to fetch player clips" });
  }
});

/**
 * GET /cfb/clips/prop/:propId
 * Get clips relevant to a specific prop bet
 */
r.get("/prop/:propId", async (req, res) => {
  try {
    const propId = req.params.propId;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 6;

    // Get prop details to extract search context
    let propData: any = null;
    try {
      const propResponse = await fetch(`${req.protocol}://${req.get('host')}/cfb/props/${propId}`);
      if (propResponse.ok) {
        propData = await propResponse.json();
      }
    } catch (error) {
      console.warn("Could not fetch prop details:", error);
    }

    if (!propData) {
      return res.status(404).json({ error: "Prop not found" });
    }

    // Map prop stat to search terms
    const statMapping: Record<string, string> = {
      'PASS_YDS': 'passing',
      'PASS_TDS': 'passing touchdown',
      'RUSH_YDS': 'rushing',
      'RUSH_TDS': 'rushing touchdown',
      'REC_YDS': 'receiving',
      'REC': 'receiving',
      'REC_TDS': 'receiving touchdown'
    };

    const query: ClipSearchQuery = {
      player: propData.playerName,
      team: propData.team,
      stat: statMapping[propData.stat] || propData.stat.toLowerCase(),
      gameType: 'highlights',
      limit
    };

    // Use TwelveLabs mock service for prop-specific clips
    const twelveLabsResults = await mockTwelveLabsService.search(query.stat || '', query.player ? `cfb_${query.player.toLowerCase().replace(/\s+/g, '_')}` : undefined, query.stat ? [query.stat.toLowerCase()] : undefined);
    
    const clips: SocialClip[] = twelveLabsResults.results.map(result => ({
      id: `twelvelabs_${result.id}`,
      platform: 'twelvelabs' as Platform,
      externalId: result.id,
      title: result.title,
      description: result.clips?.[0]?.description || result.title,
      url: result.url,
      thumbnailUrl: result.thumbnail,
      author: result.metadata?.source || `${propData.team || 'CFB'} Highlights`,
      authorUrl: result.url,
      duration: result.duration,
      publishedAt: result.metadata?.date || new Date().toISOString(),
      viewCount: Math.floor(Math.random() * 100000) + 10000,
      relevanceScore: result.confidence,
      tags: result.tags || ['highlights'],
      gameContext: {
        opponent: result.metadata?.opponent,
        date: result.metadata?.date,
        week: result.metadata?.week,
        season: 2025
      }
    }));

    res.json({
      clips,
      prop: {
        id: propId,
        playerName: propData.playerName,
        team: propData.team,
        stat: propData.stat,
        marketLine: propData.marketLine
      },
      total: clips.length
    });

  } catch (error) {
    console.error("Prop clips search error:", error);
    res.status(500).json({ error: "Failed to fetch prop clips" });
  }
});

/**
 * GET /cfb/clips/twelvelabs/status
 * Get TwelveLabs index status for demo UI
 */
r.get("/twelvelabs/status", async (req, res) => {
  try {
    const status = await mockTwelveLabsService.getIndexStatus();
    res.json({
      ...status,
      poweredBy: 'TwelveLabs Video Intelligence',
      features: {
        semantic_search: true,
        auto_tagging: true,
        real_time_indexing: true,
        confidence_scoring: true
      }
    });
  } catch (error) {
    console.error("TwelveLabs status error:", error);
    res.status(500).json({ error: "Failed to fetch index status" });
  }
});

/**
 * GET /cfb/clips/tags
 * Get available video tags for filtering
 */
r.get("/tags", async (req, res) => {
  try {
    const tags = mockTwelveLabsService.getAvailableTags();
    res.json({
      tags: tags.map(tag => ({
        name: tag,
        displayName: tag.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        count: Math.floor(Math.random() * 100) + 10 // Mock count
      })),
      total: tags.length,
      poweredBy: 'TwelveLabs Video Intelligence'
    });
  } catch (error) {
    console.error("Tags fetch error:", error);
    res.status(500).json({ error: "Failed to fetch available tags" });
  }
});

// Helper function to remove duplicate clips
function deduplicateClips(clips: SocialClip[]): SocialClip[] {
  const seen = new Set<string>();
  return clips.filter(clip => {
    const key = `${clip.platform}_${clip.externalId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default r;