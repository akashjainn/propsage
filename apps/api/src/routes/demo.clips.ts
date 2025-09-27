import { Router } from "express";
import { LRUCache } from "lru-cache";

// Inline clips data to avoid file system issues in production
const clipsData: ClipData[] = [
  {
    "id": "c_1972001536906777047",
    "playerId": "gunner",
    "title": "Sideline strike vs Alabama",
    "src": "/clips/seg_1972001536906777047.mp4",
    "start": 0,
    "end": 10,
    "tags": ["passing", "sideline", "explosive", "UGA"],
    "thumbnail": "/thumbs/seg_1972001536906777047.jpg",
    "source": "X",
    "confidence": 0.88,
    "gameId": "uga_bama_2024",
    "quarter": 2,
    "timeRemaining": "8:42",
    "description": "Stockton threads the needle on a 15-yard sideline route, showcasing excellent ball placement under pressure."
  },
  {
    "id": "c_1971995884251763023",
    "playerId": "gunner",
    "title": "3rd and long conversion",
    "src": "/clips/seg_1971995884251763023.mp4",
    "start": 0,
    "end": 10,
    "tags": ["third-down", "anticipation", "tight-window", "UGA"],
    "thumbnail": "/thumbs/seg_1971995884251763023.jpg",
    "source": "X",
    "confidence": 0.84,
    "gameId": "uga_bama_2024",
    "quarter": 3,
    "timeRemaining": "12:15",
    "description": "Clutch 3rd and 8 conversion with pinpoint accuracy to the slot receiver in traffic."
  },
  {
    "id": "c_1972003245789123456",
    "playerId": "gunner",
    "title": "Red zone touchdown",
    "src": "/clips/seg_1972003245789123456.mp4",
    "start": 0,
    "end": 8,
    "tags": ["touchdown", "red-zone", "pressure", "UGA"],
    "thumbnail": "/thumbs/seg_1972003245789123456.jpg",
    "source": "X",
    "confidence": 0.92,
    "gameId": "uga_bama_2024",
    "quarter": 1,
    "timeRemaining": "3:28",
    "description": "Perfect red zone execution as Stockton finds the back corner of the end zone under heavy pressure."
  },
  {
    "id": "c_1971998765432198765",
    "playerId": "gunner",
    "title": "Deep ball accuracy",
    "src": "/clips/seg_1971998765432198765.mp4",
    "start": 0,
    "end": 12,
    "tags": ["deep-pass", "accuracy", "explosive", "UGA"],
    "thumbnail": "/thumbs/seg_1971998765432198765.jpg",
    "source": "X",
    "confidence": 0.91,
    "gameId": "uga_bama_2024",
    "quarter": 4,
    "timeRemaining": "6:33",
    "description": "35-yard bomb perfectly placed in stride, demonstrating exceptional arm strength and accuracy."
  },
  {
    "id": "c_1972000987654321098",
    "playerId": "gunner",
    "title": "Pocket presence showcase",
    "src": "/clips/seg_1972000987654321098.mp4",
    "start": 0,
    "end": 9,
    "tags": ["pocket-presence", "mobility", "composure", "UGA"],
    "thumbnail": "/thumbs/seg_1972000987654321098.jpg",
    "source": "X",
    "confidence": 0.86,
    "gameId": "uga_bama_2024",
    "quarter": 2,
    "timeRemaining": "14:52",
    "description": "Stockton steps up in the pocket, evades rush, and delivers a strike for 18 yards."
  },
  {
    "id": "c_1971997123456789012",
    "playerId": "gunner",
    "title": "Quick slant precision",
    "src": "/clips/seg_1971997123456789012.mp4",
    "start": 0,
    "end": 6,
    "tags": ["quick-game", "precision", "timing", "UGA"],
    "thumbnail": "/thumbs/seg_1971997123456789012.jpg",
    "source": "X",
    "confidence": 0.89,
    "gameId": "uga_bama_2024",
    "quarter": 1,
    "timeRemaining": "9:17",
    "description": "Lightning-quick release on a slant route, showcasing excellent timing and precision."
  }
];

interface ClipData {
  id: string;
  playerId: string;
  title: string;
  src: string;
  start: number;
  end: number;
  tags: string[];
  thumbnail: string;
  source: string;
  confidence: number;
  gameId: string;
  quarter: number;
  timeRemaining: string;
  description: string;
}

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
    filteredClips = filteredClips.filter(clip => 
      clip.tags.some(tag => tagArray.includes(tag.toLowerCase()))
    );
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
    results = results.filter(clip => 
      clip.tags.some(tag => tagArray.includes(tag.toLowerCase()))
    );
  }

  // Simple text search in title and description
  if (q) {
    const query = q.toString().toLowerCase();
    results = results.filter(clip => 
      clip.title.toLowerCase().includes(query) ||
      clip.description.toLowerCase().includes(query) ||
      clip.tags.some(tag => tag.toLowerCase().includes(query))
    );
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