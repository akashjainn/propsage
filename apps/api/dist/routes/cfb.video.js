import { Router } from "express";
import { LRUCache } from "lru-cache";
const r = Router();
const momentCache = new LRUCache({ max: 100, ttl: 1000 * 60 * 10 }); // 10min
const videoCache = new LRUCache({ max: 10, ttl: 1000 * 60 * 60 }); // 1h
// Mock TwelveLabs integration until we have real indexed videos
const MOCK_INDEXED_VIDEOS = [
    {
        videoId: "tl_georgia_highlights_2025",
        title: "Georgia Bulldogs vs Florida State - Game Highlights",
        url: "https://example-s3.com/cfb/georgia-fsu-highlights.mp4",
        duration: 180,
        status: 'ready',
        metadata: {
            team: 'Georgia',
            opponent: 'Florida State',
            date: '2025-01-25',
            game: 'Week 5'
        }
    },
    {
        videoId: "tl_virginia_upset_2025",
        title: "Virginia Cavaliers Upset Victory - Key Plays",
        url: "https://example-s3.com/cfb/virginia-upset-keyplays.mp4",
        duration: 120,
        status: 'ready',
        metadata: {
            team: 'Virginia',
            opponent: 'Florida State',
            date: '2025-01-25',
            game: 'Week 5'
        }
    },
    {
        videoId: "tl_ohio_state_2025",
        title: "Ohio State Buckeyes Offensive Highlights",
        url: "https://example-s3.com/cfb/ohio-state-offense.mp4",
        duration: 240,
        status: 'ready',
        metadata: {
            team: 'Ohio State',
            date: '2025-01-25',
            game: 'Week 5'
        }
    }
];
// Mock video moments for demo
function generateMockMoments(query, videoIds) {
    const availableVideos = videoIds ?
        MOCK_INDEXED_VIDEOS.filter(v => videoIds.includes(v.videoId)) :
        MOCK_INDEXED_VIDEOS;
    if (availableVideos.length === 0)
        return [];
    const moments = [];
    for (const video of availableVideos.slice(0, 2)) {
        // Generate 2-3 moments per video based on query
        const momentCount = Math.floor(Math.random() * 2) + 2;
        for (let i = 0; i < momentCount; i++) {
            const startTime = Math.floor(Math.random() * (video.duration - 10));
            const duration = Math.floor(Math.random() * 8) + 3; // 3-10 second clips
            moments.push({
                videoId: video.videoId,
                start: startTime,
                end: startTime + duration,
                score: Math.random() * 0.4 + 0.6, // 0.6-1.0 relevance
                title: `${video.metadata?.team || 'Team'} - ${getRelevantClipTitle(query)}`,
                description: `Found in ${video.title}`,
                thumbnail: `https://example-s3.com/thumbnails/${video.videoId}_${startTime}.jpg`
            });
        }
    }
    return moments.sort((a, b) => b.score - a.score);
}
function getRelevantClipTitle(query) {
    const q = query.toLowerCase();
    if (q.includes('pass') || q.includes('throwing')) {
        return Math.random() > 0.5 ? 'Deep Passing Play' : 'Accurate Downfield Strike';
    }
    if (q.includes('rush') || q.includes('running')) {
        return Math.random() > 0.5 ? 'Explosive Rush Attempt' : 'Consistent Ground Gain';
    }
    if (q.includes('rec') || q.includes('catch')) {
        return Math.random() > 0.5 ? 'Key Reception' : 'Clutch Catch in Traffic';
    }
    if (q.includes('touchdown') || q.includes('td')) {
        return Math.random() > 0.5 ? 'Touchdown Play' : 'Red Zone Score';
    }
    return 'Key Play Highlight';
}
// Search video moments
r.get("/search", async (req, res) => {
    try {
        const query = String(req.query.q ?? "").trim();
        const videoIds = req.query.videoIds ? String(req.query.videoIds).split(',') : undefined;
        if (!query) {
            return res.json([]);
        }
        const cacheKey = `search:${query}:${videoIds?.join(',') || 'all'}`;
        const hit = momentCache.get(cacheKey);
        if (hit)
            return res.json(hit);
        // In real implementation, this would call TwelveLabs Search API
        const moments = generateMockMoments(query, videoIds);
        momentCache.set(cacheKey, moments);
        res.json(moments);
    }
    catch (error) {
        console.error("CFB video search error:", error);
        res.status(500).json({ error: "Failed to search video moments" });
    }
});
// List indexed videos
r.get("/videos", async (req, res) => {
    try {
        const team = req.query.team ? String(req.query.team).toLowerCase() : undefined;
        const cacheKey = `videos:${team || 'all'}`;
        const hit = videoCache.get(cacheKey);
        if (hit)
            return res.json(hit);
        let videos = MOCK_INDEXED_VIDEOS;
        if (team) {
            videos = videos.filter(v => (v.metadata?.team || '').toLowerCase().includes(team) ||
                (v.metadata?.opponent || '').toLowerCase().includes(team));
        }
        videoCache.set(cacheKey, videos);
        res.json(videos);
    }
    catch (error) {
        console.error("CFB video list error:", error);
        res.status(500).json({ error: "Failed to list videos" });
    }
});
// Get video details
r.get("/videos/:videoId", async (req, res) => {
    try {
        const videoId = String(req.params.videoId);
        const video = MOCK_INDEXED_VIDEOS.find(v => v.videoId === videoId);
        if (!video) {
            return res.status(404).json({ error: "Video not found" });
        }
        res.json(video);
    }
    catch (error) {
        console.error("CFB video detail error:", error);
        res.status(500).json({ error: "Failed to get video details" });
    }
});
// Generate prop-specific search queries
r.get("/prop-clips", async (req, res) => {
    try {
        const playerName = String(req.query.playerName ?? "");
        const stat = String(req.query.stat ?? "");
        const team = req.query.team ? String(req.query.team) : undefined;
        if (!playerName || !stat) {
            return res.status(400).json({ error: "playerName and stat are required" });
        }
        // Generate intelligent search queries based on the prop
        const queries = generatePropQueries(playerName, stat, team);
        const allMoments = [];
        for (const query of queries) {
            const moments = generateMockMoments(query);
            allMoments.push(...moments);
        }
        // Dedupe and sort by relevance
        const uniqueMoments = allMoments
            .filter((moment, index, arr) => arr.findIndex(m => m.videoId === moment.videoId && m.start === moment.start) === index)
            .sort((a, b) => b.score - a.score)
            .slice(0, 8);
        res.json({
            player: playerName,
            stat,
            team,
            queries,
            moments: uniqueMoments
        });
    }
    catch (error) {
        console.error("CFB prop clips error:", error);
        res.status(500).json({ error: "Failed to get prop clips" });
    }
});
function generatePropQueries(playerName, stat, team) {
    const queries = [];
    const firstName = playerName.split(' ')[0];
    const lastName = playerName.split(' ').slice(1).join(' ');
    switch (stat.toUpperCase()) {
        case 'PASS_YDS':
        case 'PASSING_YARDS':
            queries.push(`${playerName} passing plays`);
            queries.push(`${firstName} ${lastName} deep pass completion`);
            queries.push(`${lastName} quarterback throwing downfield`);
            if (team)
                queries.push(`${team} passing offense ${lastName}`);
            break;
        case 'PASS_TDS':
        case 'PASSING_TOUCHDOWNS':
            queries.push(`${playerName} touchdown pass`);
            queries.push(`${lastName} passing TD`);
            queries.push(`${firstName} ${lastName} red zone pass`);
            break;
        case 'RUSH_YDS':
        case 'RUSHING_YARDS':
            queries.push(`${playerName} rushing plays`);
            queries.push(`${lastName} running with ball`);
            queries.push(`${firstName} ${lastName} ground game`);
            if (team)
                queries.push(`${team} rushing attack ${lastName}`);
            break;
        case 'REC_YDS':
        case 'RECEIVING_YARDS':
            queries.push(`${playerName} receiving plays`);
            queries.push(`${lastName} catching passes`);
            queries.push(`${firstName} ${lastName} reception`);
            if (team)
                queries.push(`${team} passing game ${lastName}`);
            break;
        case 'REC':
        case 'RECEPTIONS':
            queries.push(`${playerName} catches`);
            queries.push(`${lastName} reception targets`);
            queries.push(`${firstName} ${lastName} ball in hands`);
            break;
        default:
            queries.push(`${playerName} highlights`);
            queries.push(`${lastName} key plays`);
            if (team)
                queries.push(`${team} ${lastName}`);
    }
    return queries;
}
export default r;
