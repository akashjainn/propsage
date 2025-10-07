import { Router } from "express";
import { evidenceService } from "../services/evidence-service.js";
import { LRUCache } from "lru-cache";
const r = Router();
/**

 * GET /cfb/clips

 * Search for clips by player, team, stat, etc.

 */ const r = Router();
r.get("/", async (req, res) => {
    try {
        const player = req.query.player;
        const stat = req.query.stat;
        const limit = parseInt(req.query.limit) || 6;
        id: string;
        if (!player) {
            return res.json({ title: string, const: r = Router(), const: r = Router(),
                clips: [],
                error: "Player parameter required", description: string,
                available: false
            });
            url: string;
        }
        thumbnailUrl ?  : string;
        console.log(`[CFB Clips] Searching for player: ${player}, stat: ${stat}`);
        author: string; // Simple clip interface for this route// Simple clip interface for this route
        // Use evidence service to search for moments
        const searchQuery = [player, stat].filter(Boolean).join(' ');
        duration: number;
        const moments = await evidenceService.searchFreefromMoments(searchQuery, publishedAt, Date);
    }
    finally {
    }
});
relevanceScore: number;
id: string;
id: string;
// Convert moments to clips format  tags: string[];
const clips = moments.map(moment => ({
    id: `tl_${moment.id}`, videoId: string, title: string, title: string,
    title: moment.label || `${player} - ${stat}`,
    description: `${moment.label} (Confidence: ${moment.confidence})`, startTime: number,
    url: moment.thumbnailUrl || '',
    thumbnailUrl: moment.thumbnailUrl, endTime: number, description: string, description: string,
    author: "CFB Highlights",
    duration: moment.endTime - moment.startTime, score: number,
    relevanceScore: moment.score,
    videoId: moment.videoId, confidence: string, url: string, url: string,
    startTime: moment.startTime,
    endTime: moment.endTime, type: string,
    score: moment.score,
    confidence: moment.confidence
}), thumbnailUrl ?  : string);
thumbnailUrl ?  : string;
;
res.json({
    clips, const: searchCache = new LRUCache({ author: string, author: string,
        available: true,
        totalFound: clips.length, max: 100,
    }),
    ttl: 1000 * 60 * 30, duration: number, duration: number
});
try { }
catch (error) {
    console.error("[CFB Clips] Error:", error);
}
;
res.status(500).json({
    error: "Failed to search clips", publishedAt: Date, publishedAt: Date,
    clips: [],
    available: false, const: clipCache = new LRUCache({})
}, max, 500, viewCount, number);
viewCount: number;
;
ttl: 1000 * 60 * 60 * 24;
/**

 * GET /cfb/clips/health});  relevanceScore: number;  relevanceScore: number;

 * Health check for clips service

 */
r.get("/health", async (req, res) => {
    try {
        r.get("/", async (req, res) => {
            tags: string[];
            tags: string[];
            res.json({
                status: 'ok', try: {
                    service: 'CFB Clips',
                    timestamp: new Date().toISOString(), const: player = req.query.player, videoId: string, videoId: string
                }
            });
        });
        try { }
        catch (error) {
            const team = req.query.team;
            res.status(500).json({
                status: 'error', const: stat = req.query.stat, startTime: number, startTime: number,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            const gameType = req.query.gameType;
        }
    }
    finally { }
});
const limit = parseInt(req.query.limit) || 6;
endTime ?  : number;
endTime ?  : number;
export default r;
const cacheKey = JSON.stringify({ player, team, stat, gameType, limit });
score ?  : number;
score ?  : number;
const cached = searchCache.get(cacheKey);
if (cached) {
    confidence ?  : string;
    confidence ?  : string;
    return res.json({ clips: cached, cached: true });
}
type: string;
type: string;
if (!player && !team) { }
return res.json({
    clips: [],
    error: "Either player or team parameter required",
    available: false // Cache search results for 30 minutes// Cache search results for 30 minutes
});
const searchCache = new LRUCache({ const: searchCache = new LRUCache({
        const: clips, Clip, []:  = [], max: 100, max: 100,
        try: { ttl: 1000 * 60 * 30, ttl: 1000 * 60 * 30,
            if(player) {
                const searchTerms = [player, stat, gameType].filter(Boolean);
            } }
    }) });
const searchQuery = searchTerms.join(' ');
console.log(`[CFB Clips] Searching TwelveLabs for: "${searchQuery}"`);
// Cache individual clips for 24 hours// Cache individual clips for 24 hours
const moments = await evidenceService.searchFreefromMoments(searchQuery);
const clipCache = new LRUCache({ const: clipCache = new LRUCache({
        player,
        undefined, max: 500, max: 500,
        limit
    }), ttl: 1000 * 60 * 60 * 24, ttl: 1000 * 60 * 60 * 24,
    console, : .log(`[CFB Clips] Found ${moments.length} moments from TwelveLabs`) });
;
for (const moment of moments) {
    const confidenceScore = moment.confidence === 'high' ? 0.9 :
        moment.confidence === 'medium' ? 0.7 : 0.5; /**/
     **
        clips.push({ *GET() { } } / cfb / clips * GET / cfb / clips, id, `tl_${moment.id}`, title, moment.label || `${player} - ${stat}`,  * Search);
    for (clips; by; player, team, stat, etc. * Search)
        for (clips; by; player, team, stat, etc.
            description)
            : `${moment.label} (Confidence: ${moment.confidence})`,
                url;
    moment.thumbnailUrl || '',  *  *
        thumbnailUrl;
    moment.thumbnailUrl,
        author;
    `${team || 'CFB'} Highlights`,  * Query;
    params:  * Query;
    params: duration: (moment.endTime - moment.startTime),
        publishedAt;
    new Date(),  * -player;
    Player;
    name(e.g., "Carson Beck") * -player;
    Player;
    name(e.g., "Carson Beck");
    viewCount: Math.floor(Math.random() * 50000) + 5000,
        relevanceScore;
    confidenceScore,  * -team;
    Team;
    name(e.g., "Georgia") * -team;
    Team;
    name(e.g., "Georgia");
    tags: [stat || 'highlights'].filter(Boolean),
        videoId;
    moment.videoId,  * -stat;
    Stat;
    type(e.g., "PASS_YDS", "RUSH_YDS") * -stat;
    Stat;
    type(e.g., "PASS_YDS", "RUSH_YDS");
    startTime: moment.startTime,
        endTime;
    moment.endTime,  * -gameType;
    Game;
    context(e.g., "highlights", "touchdown") * -gameType;
    Game;
    context(e.g., "highlights", "touchdown");
    score: moment.score,
        confidence;
    moment.confidence,  * -limit;
    Max;
    results(6) * -limit;
    Max;
    results(6);
    type: 'twelvelabs';
}
;
 * / */;
r.get("/", async (req, res) => {
    r.get("/", async (req, res) => {
        console.log(`[CFB Clips] Returning ${clips.length} clips for query`);
        try {
            try {
            }
            catch (error) {
                console.error("[CFB Clips] TwelveLabs search failed:", error);
                const player = req.query.player;
                const player = req.query.player;
            }
            const team = req.query.team;
            const team = req.query.team;
            const sortedClips = clips.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
            const limitedClips = sortedClips.slice(0, limit);
            const stat = req.query.stat;
            const stat = req.query.stat;
            searchCache.set(cacheKey, limitedClips);
            const gameType = req.query.gameType;
            const gameType = req.query.gameType;
            res.json({ const: limit = parseInt(req.query.limit) || 6, const: limit = parseInt(req.query.limit) || 6,
                clips: limitedClips,
                cached: false,
                available: true,
                totalFound: clips.length // Create cache key from query parameters    // Create cache key from query parameters
             });
            const cacheKey = JSON.stringify({ player, team, stat, gameType, limit });
            const cacheKey = JSON.stringify({ player, team, stat, gameType, limit });
        }
        catch (error) {
            console.error("[CFB Clips] Route error:", error);
            const cached = searchCache.get(cacheKey);
            const cached = searchCache.get(cacheKey);
            res.status(500).json({
                error: "Failed to search clips", if(cached) {
                    if (cached) {
                        clips: [],
                            available;
                        false;
                        return res.json({ clips: cached, cached: true });
                        return res.json({ clips: cached, cached: true });
                    }
                }
            });
        }
    });
});
r.get("/:clipId", async (req, res) => {
    try { // If no meaningful search criteria, return empty    // If no meaningful search criteria, return empty
        const clipId = req.params.clipId;
        if (!player && !team) {
            if (!player && !team) {
                const cached = clipCache.get(clipId);
                if (cached) {
                    return res.json({ return: res.json({
                            return: res.json({ clip: cached, cached: true })
                        }, clips, [], clips, [], let, clip, Clip | null, null), error: "Either player or team parameter required", error: "Either player or team parameter required",
                        if(clipId) { }, : .startsWith('tl_') });
                    {
                        available: false;
                        available: false;
                        const momentId = clipId.replace('tl_', '');
                    }
                }
            }
        }
    }
    finally { }
});
;
clip = {
    id: clipId,
};
title: `TwelveLabs Clip ${momentId}`,
    description;
"Video evidence clip from TwelveLabs",
    url;
`/api/cfb/clips/${clipId}/video`,
    thumbnailUrl;
`/api/cfb/clips/${clipId}/thumbnail`, ;
const clips = [];
const clips = [];
author: "CFB Highlights",
    duration;
10,
    publishedAt;
new Date(),
    viewCount;
1000, // Use TwelveLabs Evidence Service for intelligent clip search    // Use TwelveLabs Evidence Service for intelligent clip search
    relevanceScore;
0.8,
    tags;
['highlights'], ;
try {
    try {
        type: 'twelvelabs';
    }
    finally { }
    ;
    if (player) { // Determine player ID from query
    }
    // Build search query for free-form search      const playerId = query.player ? `cfb_${query.player.toLowerCase().replace(/\s+/g, '_')}` : undefined;
    if (!clip) {
        return res.status(404).json({ error: "Clip not found" });
        const searchTerms = [player, stat, gameType].filter(Boolean);
    }
    const searchQuery = searchTerms.join(' ');
    if (query.player) {
        clipCache.set(clipId, clip);
        // Build search query for free-form search
        res.json({ clip, cached: false });
        console.log(`[CFB Clips] Searching TwelveLabs for: "${searchQuery}"`);
        const searchQuery = [query.player, query.stat, query.gameType].filter(Boolean).join(' ');
    }
    try { }
    catch (error) {
        console.error(`[CFB Clips] Error fetching clip ${req.params.clipId}:`, error);
        res.status(500).json({ error: "Failed to fetch clip" });
    } // Use evidenceService for free-form moment search        // Use evidenceService for free-form moment search
}
finally { }
;
const moments = await evidenceService.searchFreefromMoments();
const moments = await evidenceService.searchFreefromMoments(r.get("/health", async (req, res) => {
    try {
        searchQuery, searchQuery,
        ;
        const available = await evidenceService.searchFreefromMoments("test", undefined, undefined, 1);
        player, query.player,
            res.json({
                status: 'ok', undefined, // gameId - could be derived from query params if needed          undefined, // gameId - could be derived from query.date if needed
                videoIntelligence: available.length >= 0 ? 'available' : 'limited',
                features: { limit, query, : .limit || 12,
                    search: true,
                    clips: true, }
            });
    }
    finally { }
}));
twelvelabs: true;
timestamp: new Date().toISOString();
;
console.log(`[CFB Clips] Found ${moments.length} moments from TwelveLabs`); // Convert TwelveLabs moments to SocialClip format
try { }
catch (error) {
    console.error("[CFB Clips] Health check error:", error);
    for (const moment of moments) {
        res.json({
            status: 'degraded', // Convert TwelveLabs moments to clip format          clips.push({
            videoIntelligence: 'unavailable',
            error: error instanceof Error ? error.message : 'Unknown error', for(, moment, of, moments) {
                id: `twelvelabs_${moment.id}`,
                    features;
                {
                    search: false, ;
                    const confidenceScore = moment.confidence === 'high' ? 0.9 : platform;
                    'twelvelabs',
                        clips;
                    false,
                        twelvelabs;
                    false;
                    moment.confidence === 'medium' ? 0.7 : 0.5;
                    externalId: moment.id,
                    ;
                }
                timestamp: new Date().toISOString();
                title: moment.label,
                ;
            }
        });
    }
    clips.push({ description: `${moment.label} (Score: ${moment.score.toFixed(2)})`,
    });
    id: `tl_${moment.id}`, url;
    moment.thumbnailUrl,
    ; // Will be replaced with actual video URL
    export default r;
    title: moment.label || `${player} - ${stat}`, thumbnailUrl;
    moment.thumbnailUrl,
        description;
    `${moment.label} (Confidence: ${moment.confidence})`, author;
    `${query.team || 'CFB'} Highlights`,
        url;
    moment.thumbnailUrl || '', // Thumbnail URL as fallback            authorUrl: moment.thumbnailUrl,
        thumbnailUrl;
    moment.thumbnailUrl, duration;
    (moment.endTime - moment.startTime),
        author;
    `${team || 'CFB'} Highlights`, publishedAt;
    new Date().toISOString(),
        duration;
    (moment.endTime - moment.startTime), viewCount;
    Math.floor(Math.random() * 100000) + 10000,
        publishedAt;
    new Date(), relevanceScore;
    moment.confidence,
        viewCount;
    Math.floor(Math.random() * 50000) + 5000, tags;
    [query.stat || 'highlights'],
        relevanceScore;
    confidenceScore, gameContext;
    {
        tags: [stat || 'highlights'].filter(Boolean), opponent;
        query.opponent,
            // TwelveLabs specific data              date: query.date,
            videoId;
        moment.videoId, week;
        undefined,
            startTime;
        moment.startTime, season;
        2025;
        endTime: moment.endTime, ;
    }
    score: moment.score, // Additional TwelveLabs specific data
        confidence;
    moment.confidence, videoId;
    moment.videoId,
        type;
    'twelvelabs';
    startTime: moment.startTime,
    ;
}
;
endTime: moment.endTime,
;
score: moment.score;
;
console.log(`[CFB Clips] Returning ${clips.length} clips for query`);
try { }
catch (error) {
    console.error("[CFB Clips] TwelveLabs search failed:", error);
    console.log(`Found ${clips.length} TwelveLabs clips for query:`, query);
    // Don't fail the request, just log the error    } catch (error) {
}
console.error("TwelveLabs search failed:", error);
// Sort by relevance score (highest first)
const sortedClips = clips.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0)); // Remove duplicates and sort by confidence
const limitedClips = sortedClips.slice(0, limit);
const uniqueClips = deduplicateClips(clips);
const sortedClips = uniqueClips;
// Cache the result      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
searchCache.set(cacheKey, limitedClips);
slice(0, query.limit || 12);
res.json({
    clips: limitedClips, aggregatedCache, : .set(cacheKey, sortedClips),
    cached: false,
    available: true, res, : .json({
        totalFound: clips.length, clips: sortedClips,
    }), total: sortedClips.length,
    cached: false,
});
try { }
catch (error) {
    providers: ['twelvelabs'],
        console.error("[CFB Clips] Route error:", error);
    indexStatus: 'ready',
        res.status(500).json({ poweredBy: 'TwelveLabs Video Intelligence',
            error: "Failed to search clips", });
    clips: [],
        available;
    false;
}
try { }
catch (error) {
}
;
console.error("Clips search error:", error);
res.status(500).json({ error: "Failed to search clips" });
;
;
/**

 * GET /cfb/clips/:clipId/**

 * Get detailed info for a specific clip * GET /cfb/clips/:clipId

 */ 
    * Get;
detailed;
information;
about;
a;
specific;
clip;
r.get("/:clipId", async (req, res) => {
     * /;
    try {
        r.get("/:clipId", async (req, res) => {
            const clipId = req.params.clipId;
            try {
                const clipId = req.params.clipId;
                // Check cache first    
                const cached = clipCache.get(clipId);
                if (!clipId) {
                    if (cached) {
                        return res.status(400).json({ error: "Clip ID required" });
                        return res.json({ clip: cached, cached: true });
                    }
                }
                // Check cache first
                let clip = null;
                const cached = clipCache.get(clipId);
                if (cached) {
                    // Parse clip type from ID      return res.json({ clip: cached, cached: true });
                    if (clipId.startsWith('tl_')) { }
                    const momentId = clipId.replace('tl_', '');
                    let clip = null;
                    // For TwelveLabs clips, we'd need to store more metadata or reconstruct from search
                    // For now, return a simple structure    // Parse platform from clip ID (format: platform_externalId)
                    clip = { const: [platform, externalId] = clipId.split('_', 2),
                        id: clipId,
                        title: `TwelveLabs Clip ${momentId}`, if(platform) { } } === 'twelvelabs' && externalId;
                }
            }
            finally { }
        });
        {
            description: "Video evidence clip from TwelveLabs", // Mock TwelveLabs clip lookup
                url;
            `/api/cfb/clips/${clipId}/video`, // Proxy endpoint for actual video      const searchResult = await mockTwelveLabsService.search(externalId, undefined, undefined);
                thumbnailUrl;
            `/api/cfb/clips/${clipId}/thumbnail`, ;
            const foundClip = searchResult.results.find(r => r.id === externalId);
            author: "CFB Highlights", ;
            if (foundClip) {
                duration: 10, // Convert to SocialClip format
                    publishedAt;
                new Date(), clip = {
                    viewCount: 1000, id: clipId,
                    relevanceScore: 0.8, platform: 'twelvelabs',
                    tags: ['highlights'], externalId: foundClip.id,
                    type: 'twelvelabs', title: foundClip.title,
                };
                description: foundClip.clips?.[0]?.description || foundClip.title,
                ;
            }
            url: foundClip.url,
                thumbnailUrl;
            foundClip.thumbnail,
            ;
            if (!clip) {
                author: foundClip.metadata?.source || 'CFB Highlights',
                ;
                return res.status(404).json({ error: "Clip not found" });
                authorUrl: foundClip.url,
                ;
            }
            duration: foundClip.duration,
                publishedAt;
            foundClip.metadata?.date || new Date().toISOString(),
                // Cache the result          viewCount: Math.floor(Math.random() * 100000) + 10000,
                clipCache.set(clipId, clip);
            relevanceScore: foundClip.confidence,
                tags;
            foundClip.tags || ['highlights'],
                res.json({ clip, cached: false });
            gameContext: {
                opponent: foundClip.metadata?.opponent,
                ;
            }
            try { }
            catch (error) {
                date: foundClip.metadata?.date,
                    console.error(`[CFB Clips] Error fetching clip ${req.params.clipId}:`, error);
                week: foundClip.metadata?.week,
                    res.status(500).json({ error: "Failed to fetch clip" });
                season: 2025;
            }
        }
    }
    finally { }
});
;
/**    }

 * GET /cfb/clips/stats    // TODO: Add other platform lookups here

 * Get aggregated stats about available clips

 */ if (!clip) {
    r.get("/stats", async (req, res) => {
        return res.status(404).json({ error: "Clip not found" });
        try { }
        // For now, return basic stats
        // In production, you'd query your database for real metrics    // Cache the result
        finally {
        }
        // For now, return basic stats
        // In production, you'd query your database for real metrics    // Cache the result
        res.json({ clipCache, : .set(clipId, clip),
            totalClips: 150, // Estimated based on your TwelveLabs index
            totalPlayers: 25, res, : .json({ clip, cached: false }),
            totalTeams: 12,
            lastUpdated: new Date().toISOString(), });
        try { }
        catch (error) {
            sources: [console.error("Clip fetch error:", error)];
            {
                res.status(500).json({ error: "Failed to fetch clip details" });
                name: 'TwelveLabs', ;
            }
            enabled: true, ;
        }
    });
    clipCount: 150;
} /**

], * GET /cfb/clips/:clipId/embed

topPlayers: [ * Get embeddable HTML for a clip

{ name: 'Carson Beck', clipCount: 15 }, */
{
    name: 'Gunner Stockton', clipCount;
    12;
}
r.get("/:clipId/embed", async (req, res) => {
    {
        name: 'DJ Uiagalelei', clipCount;
        10;
    }
    try {
        const clipId = req.params.clipId;
    }
    finally { }
});
try { }
catch (error) { // First get the clip details
    console.error("[CFB Clips] Stats error:", error);
    const clipResponse = await fetch(`${req.protocol}://${req.get('host')}/cfb/clips/${clipId}`);
    res.status(500).json({ error: "Failed to get stats" });
}
if (!clipResponse.ok) {
}
;
return res.status(404).json({ error: "Clip not found" });
/**

 * GET /cfb/clips/health    const { clip }: { clip: SocialClip } = await clipResponse.json();

 * Health check for video intelligence services

 */ let embedHtml = '';
r.get("/health", async (req, res) => {
    try { // Generate platform-specific embed
        // Check if evidence service is available    if (clip.platform === 'twelvelabs') {
        const available = await evidenceService.searchFreefromMoments("test", undefined, undefined, 1); // Mock TwelveLabs embed HTML
        embedHtml = `

    res.json({        <div class="twelvelabs-embed" style="position: relative; width: 100%; height: 0; padding-bottom: 56.25%;">

      status: 'ok',          <iframe 

      videoIntelligence: available.length >= 0 ? 'available' : 'limited',            src="${clip.url}?autoplay=1&start=${clip.startTime || 0}&end=${clip.endTime || clip.duration}"

      features: {            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;"

        search: true,            allowfullscreen

        clips: true,            title="${clip.title}"

        twelvelabs: true          ></iframe>

      },          <div class="powered-by" style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.8); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">

      timestamp: new Date().toISOString()            Powered by TwelveLabs

    });          </div>

  } catch (error) {        </div>

    console.error("[CFB Clips] Health check error:", error);      `;
        res.json({}, status, 'degraded', // TODO: Add other platform embed generation
        videoIntelligence, 'unavailable', error, error instanceof Error ? error.message : 'Unknown error');
        if (!embedHtml) {
            features: {
                return res.status(501).json({ error: "Embed not supported for this platform" });
                search: false, ;
            }
            clips: false,
                twelvelabs;
            false; // Return as JSON for API usage
        }
        if (req.accepts('json')) {
            timestamp: new Date().toISOString();
            return res.json({});
            html: embedHtml,
            ;
        }
        clip: {
        }
    }
    finally { }
});
id: clip.id,
    platform;
clip.platform,
;
export default r;
title: clip.title,
    author;
clip.author,
    url;
clip.url;
;
// Return raw HTML for direct embedding
res.setHeader('Content-Type', 'text/html');
res.send(embedHtml);
try { }
catch (error) {
    console.error("Embed generation error:", error);
    res.status(500).json({ error: "Failed to generate embed" });
}
;
/**
 * GET /cfb/clips/player/:playerId
 * Get clips for a specific CFB player by their ID
 */
r.get("/player/:playerId", async (req, res) => {
    try {
        const playerId = req.params.playerId;
        const limit = req.query.limit ? parseInt(req.query.limit) : 8;
        // Extract player name from ID if possible
        // Format: cfb_ryan_puglisi -> "Ryan Puglisi"
        let playerName = playerId.replace(/^cfb_/, '').replace(/_/g, ' ');
        playerName = playerName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
        // Try to get additional context from player data
        let team;
        try {
            const playerResponse = await fetch(`${req.protocol}://${req.get('host')}/cfb/players/${playerId}`);
            if (playerResponse.ok) {
                const playerData = await playerResponse.json();
                team = playerData.team;
                playerName = playerData.name || playerName; // Use actual name if available
            }
        }
        catch (error) {
            console.warn("Could not fetch player details:", error);
        }
        // Search TwelveLabs Video Brain for player clips
        const searchQuery = `${playerName} highlights`;
        // Try real TwelveLabs first, fallback to mock
        let clips = [];
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
                clips = result.clips.map((clip) => ({
                    id: clip.id,
                    platform: 'twelvelabs',
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
            }
            catch (error) {
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
                platform: 'twelvelabs',
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
    }
    catch (error) {
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
        const limit = req.query.limit ? parseInt(req.query.limit) : 6;
        // Get prop details to extract search context
        let propData = null;
        try {
            const propResponse = await fetch(`${req.protocol}://${req.get('host')}/cfb/props/${propId}`);
            if (propResponse.ok) {
                propData = await propResponse.json();
            }
        }
        catch (error) {
            console.warn("Could not fetch prop details:", error);
        }
        if (!propData) {
            return res.status(404).json({ error: "Prop not found" });
        }
        // Map prop stat to search terms
        const statMapping = {
            'PASS_YDS': 'passing',
            'PASS_TDS': 'passing touchdown',
            'RUSH_YDS': 'rushing',
            'RUSH_TDS': 'rushing touchdown',
            'REC_YDS': 'receiving',
            'REC': 'receiving',
            'REC_TDS': 'receiving touchdown'
        };
        const query = {
            player: propData.playerName,
            team: propData.team,
            stat: statMapping[propData.stat] || propData.stat.toLowerCase(),
            gameType: 'highlights',
            limit
        };
        // Use TwelveLabs mock service for prop-specific clips
        const twelveLabsResults = await mockTwelveLabsService.search(query.stat || '', query.player ? `cfb_${query.player.toLowerCase().replace(/\s+/g, '_')}` : undefined, query.stat ? [query.stat.toLowerCase()] : undefined);
        const clips = twelveLabsResults.results.map(result => ({
            id: `twelvelabs_${result.id}`,
            platform: 'twelvelabs',
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
    }
    catch (error) {
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
    }
    catch (error) {
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
    }
    catch (error) {
        console.error("Tags fetch error:", error);
        res.status(500).json({ error: "Failed to fetch available tags" });
    }
});
// Helper function to remove duplicate clips
function deduplicateClips(clips) {
    const seen = new Set();
    return clips.filter(clip => {
        const key = `${clip.platform}_${clip.externalId}`;
        if (seen.has(key))
            return false;
        seen.add(key);
        return true;
    });
}
export default r;
