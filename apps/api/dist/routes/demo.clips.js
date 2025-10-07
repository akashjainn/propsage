import { Router } from "express";
import { LRUCache } from "lru-cache";
// Inline clips data to avoid file system issues in production
const clipsData = [
    // Narrative spotlight clips (GT vs Wake) – added first for prioritization
    {
        "id": "c_king_pass_td",
        "playerId": "haynes-king",
        "title": "Haynes King – Passing TD",
        "src": "/clips/gt_wf_king_pass_td.mp4",
        "start": 3,
        "end": 13,
        "tags": ["passing", "touchdown", "sideline", "explosive", "gt", "wake"],
        "thumbnail": "/thumbs/gt_wf_king_pass_td.jpg",
        "source": "Broadcast",
        "confidence": 0.92,
        "gameId": "game_gt_wf",
        "quarter": 1,
        "timeRemaining": "10:27",
        "description": "Explosive strike vs single-high — vertical threat established early."
    },
    {
        "id": "c_king_rush_td",
        "playerId": "haynes-king",
        "title": "Haynes King – Rushing TD",
        "src": "/clips/gt_wf_king_rush_td.mp4",
        "start": 4,
        "end": 12,
        "tags": ["rushing", "touchdown", "qb-keeper", "red-zone", "designed", "gt", "wake"],
        "thumbnail": "/thumbs/gt_wf_king_rush_td.jpg",
        "source": "Broadcast",
        "confidence": 0.90,
        "gameId": "game_gt_wf",
        "quarter": 2,
        "timeRemaining": "4:58",
        "description": "Designed keeper in tight red-zone lane – scheme-enabled rushing equity."
    },
    {
        "id": "c_haines_fumble",
        "playerId": "jamal_haines",
        "title": "Jamal Haines – Fumble",
        "src": "/clips/gt_wf_haines_fumble.mp4",
        "start": 2,
        "end": 11,
        "tags": ["fumble", "turnover", "rushing", "risk", "ball-security", "gt", "wake"],
        "thumbnail": "/thumbs/gt_wf_haines_fumble.jpg",
        "source": "Broadcast",
        "confidence": 0.88,
        "gameId": "game_gt_wf",
        "quarter": 2,
        "timeRemaining": "1:13",
        "description": "Costly turnover – potential snap-share volatility introduced."
    },
    {
        "id": "c_1972001536906777047",
        "playerId": "haynes-king",
        "title": "Sideline strike - LIVE",
        "src": "/clips/haynes_sideline_strike.mp4",
        "start": 0,
        "end": 12,
        "tags": ["passing", "sideline", "explosive", "GT"],
        "thumbnail": "/thumbs/haynes_sideline_strike.jpg",
        "source": "ESPN",
        "confidence": 0.94,
        "gameId": "gt_live_2025",
        "quarter": 2,
        "timeRemaining": "8:42",
        "description": "King threads the needle on a 22-yard sideline route, showcasing excellent ball placement under pressure in live action."
    },
    {
        "id": "c_1971995884251763023",
        "playerId": "haynes-king",
        "title": "3rd and long conversion - LIVE",
        "src": "/clips/haynes_third_down.mp4",
        "start": 0,
        "end": 8,
        "tags": ["third-down", "anticipation", "tight-window", "GT"],
        "thumbnail": "/thumbs/haynes_third_down.jpg",
        "source": "ESPN",
        "confidence": 0.91,
        "gameId": "gt_live_2025",
        "quarter": 3,
        "timeRemaining": "6:15",
        "description": "Perfect anticipation throw on 3rd & 9, finding his receiver in tight coverage for a crucial first down."
    },
    {
        "id": "c_1971989217506283847",
        "playerId": "haynes-king",
        "title": "Pocket mobility showcase",
        "src": "/clips/haynes_pocket_mobility.mp4",
        "start": 0,
        "end": 14,
        "tags": ["mobility", "scramble", "passing", "GT"],
        "thumbnail": "/thumbs/haynes_pocket_mobility.jpg",
        "source": "ESPN",
        "confidence": 0.88,
        "gameId": "gt_live_2025",
        "quarter": 1,
        "timeRemaining": "11:23",
        "description": "King shows excellent pocket mobility, extending the play before delivering a strike downfield for 28 yards."
    },
    {
        "id": "c_1971982341557291936",
        "playerId": "haynes-king",
        "title": "Red zone precision",
        "src": "/clips/haynes_redzone.mp4",
        "start": 0,
        "end": 6,
        "tags": ["redzone", "touchdown", "precision", "GT"],
        "thumbnail": "/thumbs/haynes_redzone.jpg",
        "source": "ESPN",
        "confidence": 0.93,
        "gameId": "gt_live_2025",
        "quarter": 4,
        "timeRemaining": "4:38",
        "description": "Picture-perfect red zone throw, placing the ball exactly where only his receiver can catch it for the TD."
    },
    {
        "id": "c_1971976433498872832",
        "playerId": "haynes-king",
        "title": "Deep ball accuracy",
        "src": "/clips/haynes_deep_ball.mp4",
        "start": 0,
        "end": 16,
        "tags": ["deep", "accuracy", "explosive", "GT"],
        "thumbnail": "/thumbs/haynes_deep_ball.jpg",
        "source": "ESPN",
        "confidence": 0.87,
        "gameId": "gt_live_2025",
        "quarter": 2,
        "timeRemaining": "2:11",
        "description": "45-yard bomb with perfect touch and timing, showcasing King's deep ball accuracy and arm strength."
    },
    {
        "id": "c_1971971245623847123",
        "playerId": "haynes-king",
        "title": "Quick release under pressure",
        "src": "/clips/haynes_quick_release.mp4",
        "start": 0,
        "end": 7,
        "tags": ["quick-release", "pressure", "slant", "GT"],
        "thumbnail": "/thumbs/haynes_quick_release.jpg",
        "source": "ESPN",
        "confidence": 0.90,
        "gameId": "gt_live_2025",
        "quarter": 4,
        "timeRemaining": "9:45",
        "description": "Lightning-fast release to beat the blitz, finding his slot receiver for a 12-yard gain and crucial first down."
    }
];
const r = Router();
// Cache clips for 30 minutes
const clipsCache = new LRUCache({
    max: 100,
    ttl: 1000 * 60 * 30
});
/**
 * GET /cfb/clips/player/:playerId
 * Simulate TwelveLabs video search for a specific player
 */
r.get("/player/:playerId", async (req, res) => {
    const { playerId } = req.params;
    const { tags, confidence, limit = 10 } = req.query;
    const cacheKey = `clips_${playerId}_${tags || 'all'}_${confidence || 'any'}`;
    if (clipsCache.has(cacheKey)) {
        return res.json(clipsCache.get(cacheKey));
    }
    // Simulate TwelveLabs processing delay
    const delay = Math.random() * 800 + 800; // 800-1600ms
    await new Promise(resolve => setTimeout(resolve, delay));
    let filteredClips = clipsData.filter(clip => clip.playerId === playerId);
    // Filter by tags if provided
    if (tags) {
        const tagArray = tags.toString().split(',').map(t => t.trim().toLowerCase());
        filteredClips = filteredClips.filter(clip => clip.tags.some(tag => tagArray.includes(tag.toLowerCase())));
    }
    // Filter by minimum confidence if provided
    if (confidence) {
        const minConfidence = parseFloat(confidence.toString());
        filteredClips = filteredClips.filter(clip => clip.confidence >= minConfidence);
    }
    // Limit results
    const limitNum = parseInt(limit.toString());
    filteredClips = filteredClips.slice(0, limitNum);
    // Add some randomness to confidence scores for demo realism
    const enhancedClips = filteredClips.map(clip => ({
        ...clip,
        confidence: Math.min(0.95, clip.confidence + (Math.random() - 0.5) * 0.05),
        searchRelevance: Math.random() * 0.2 + 0.8 // 0.8-1.0 relevance score
    }));
    // Sort by confidence desc
    enhancedClips.sort((a, b) => b.confidence - a.confidence);
    const response = {
        indexId: "idx_demo_uga_bama_2024",
        tookMs: Math.round(delay),
        matchedTags: tags ? tags.toString().split(',') : ["passing", "sideline", "explosive"],
        totalResults: enhancedClips.length,
        page: 1,
        pageSize: limitNum,
        query: {
            playerId,
            tags: tags || "all",
            confidence: confidence || "any"
        },
        items: enhancedClips,
        metadata: {
            provider: "TwelveLabs",
            model: "video-understanding-v2",
            processed: new Date().toISOString(),
            demoMode: true
        }
    };
    clipsCache.set(cacheKey, response);
    res.json(response);
});
/**
 * GET /cfb/clips/search
 * General clip search endpoint
 */
r.get("/search", async (req, res) => {
    const { q, tags, player, confidence, limit = 10 } = req.query;
    const cacheKey = `search_${q || ''}_${tags || ''}_${player || ''}_${confidence || ''}`;
    if (clipsCache.has(cacheKey)) {
        return res.json(clipsCache.get(cacheKey));
    }
    // Simulate processing delay
    const delay = Math.random() * 600 + 1000; // 1000-1600ms
    await new Promise(resolve => setTimeout(resolve, delay));
    let results = [...clipsData];
    // Filter by player if specified
    if (player) {
        results = results.filter(clip => clip.playerId === player.toString());
    }
    // Filter by tags if provided
    if (tags) {
        const tagArray = tags.toString().split(',').map(t => t.trim().toLowerCase());
        results = results.filter(clip => clip.tags.some(tag => tagArray.includes(tag.toLowerCase())));
    }
    // Simple text search in title and description
    if (q) {
        const query = q.toString().toLowerCase();
        results = results.filter(clip => clip.title.toLowerCase().includes(query) ||
            clip.description.toLowerCase().includes(query) ||
            clip.tags.some(tag => tag.toLowerCase().includes(query)));
    }
    // Filter by confidence
    if (confidence) {
        const minConfidence = parseFloat(confidence.toString());
        results = results.filter(clip => clip.confidence >= minConfidence);
    }
    // Limit results
    const limitNum = parseInt(limit.toString());
    results = results.slice(0, limitNum);
    const response = {
        indexId: "idx_demo_uga_bama_2024",
        tookMs: Math.round(delay),
        query: q || "",
        totalResults: results.length,
        items: results.map(clip => ({
            ...clip,
            searchRelevance: Math.random() * 0.3 + 0.7 // 0.7-1.0 relevance
        })),
        metadata: {
            provider: "TwelveLabs",
            model: "video-understanding-v2",
            processed: new Date().toISOString(),
            demoMode: true
        }
    };
    clipsCache.set(cacheKey, response);
    res.json(response);
});
/**
 * GET /cfb/clips/status
 * TwelveLabs indexing status
 */
r.get("/status", (_req, res) => {
    res.json({
        indexId: "idx_demo_uga_bama_2024",
        status: "ready",
        totalVideos: 847,
        processedVideos: 847,
        indexedDuration: "12h 34m 18s",
        lastUpdated: "2024-09-27T10:30:00Z",
        confidence: {
            avg: 0.87,
            min: 0.72,
            max: 0.95
        },
        tags: {
            passing: 234,
            "red-zone": 89,
            "third-down": 156,
            explosive: 112,
            sideline: 78,
            touchdown: 45
        },
        demoMode: true
    });
});
export default r;
