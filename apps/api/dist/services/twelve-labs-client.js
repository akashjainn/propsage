import { LRUCache } from "lru-cache";
import { calculateConfidence } from "../types/twelve-labs.js";
// Environment configuration
const TL_CONFIG = {
    apiKey: process.env.TL_API_KEY || process.env.TWELVELABS_API_KEY || '',
    indexId: process.env.TWELVELABS_INDEX_ID || 'default_cfb_index',
    baseUrl: process.env.TWELVELABS_BASE_URL || 'https://api.twelvelabs.io/v1.2'
};
// Cache for search results (30 minutes)
const searchCache = new LRUCache({
    max: 200,
    ttl: 1000 * 60 * 30
});
// Cache for video status (5 minutes) 
const statusCache = new LRUCache({
    max: 100,
    ttl: 1000 * 60 * 5
});
export class TwelveLabsClient {
    config;
    constructor(config) {
        this.config = { ...TL_CONFIG, ...config };
        if (!this.config.apiKey) {
            console.warn('TwelveLabs API key not configured - video intelligence features will be disabled');
        }
    }
    /**
     * Index a video file from S3 URL
     */
    async indexClip(request) {
        if (!this.config.apiKey) {
            console.warn('TwelveLabs not configured - skipping video indexing');
            return null;
        }
        try {
            const response = await fetch(`${this.config.baseUrl}/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.config.apiKey
                },
                body: JSON.stringify({
                    index_id: this.config.indexId,
                    url: request.s3Url,
                    metadata: {
                        filename: request.title,
                        game_id: request.gameId,
                        ...request.metadata
                    },
                    transcription_file: null, // Auto-transcription
                    provide_transcription: true
                })
            });
            if (!response.ok) {
                const error = await response.text();
                throw new Error(`TwelveLabs indexing failed: ${response.status} - ${error}`);
            }
            const result = await response.json();
            console.log(`TwelveLabs indexing started for ${request.title}: ${result._id}`);
            return {
                taskId: result._id,
                videoId: result.video_id
            };
        }
        catch (error) {
            console.error('TwelveLabs indexing error:', error);
            return null;
        }
    }
    /**
     * Check indexing status of a video
     */
    async getIndexingStatus(taskId) {
        if (!this.config.apiKey)
            return 'failed';
        const cached = statusCache.get(taskId);
        if (cached)
            return cached;
        try {
            const response = await fetch(`${this.config.baseUrl}/tasks/${taskId}`, {
                headers: {
                    'x-api-key': this.config.apiKey
                }
            });
            if (!response.ok) {
                throw new Error(`Status check failed: ${response.status}`);
            }
            const result = await response.json();
            const status = result.status === 'ready' ? 'ready' :
                result.status === 'failed' ? 'failed' : 'indexing';
            // Cache successful results longer
            const ttl = status === 'ready' ? 1000 * 60 * 60 : 1000 * 60 * 2; // 1h vs 2m
            statusCache.set(taskId, status, { ttl });
            return status;
        }
        catch (error) {
            console.error('Status check error:', error);
            return 'failed';
        }
    }
    /**
     * Search for moments across indexed videos
     */
    async searchMoments(queries, videoIds, limit = 10) {
        if (!this.config.apiKey || queries.length === 0) {
            return [];
        }
        const cacheKey = JSON.stringify({ queries, videoIds, limit });
        const cached = searchCache.get(cacheKey);
        if (cached)
            return cached;
        try {
            const allMoments = [];
            for (const query of queries) {
                const searchBody = {
                    query: query.trim(),
                    index_id: this.config.indexId,
                    search_options: ['visual', 'conversation', 'text_in_video'],
                    sort_option: 'score',
                    page_limit: Math.min(limit, 5) // Limit per query to get diverse results
                };
                // Filter by specific video IDs if provided
                if (videoIds && videoIds.length > 0) {
                    searchBody.filter = {
                        video_id: videoIds
                    };
                }
                const response = await fetch(`${this.config.baseUrl}/search`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': this.config.apiKey
                    },
                    body: JSON.stringify(searchBody)
                });
                if (!response.ok) {
                    console.warn(`Search failed for query "${query}": ${response.status}`);
                    continue;
                }
                const result = await response.json();
                // Convert TL results to our moment format
                const moments = result.data.map((item, index) => ({
                    id: `tl_${item.video_id}_${item.start}_${index}`,
                    videoId: item.video_id,
                    startTime: item.start,
                    endTime: item.end,
                    score: item.score,
                    label: this.generateMomentLabel(query, item),
                    query: query,
                    thumbnailUrl: this.generateThumbnailUrl(item.video_id, item.start),
                    confidence: calculateConfidence(item.score)
                }));
                allMoments.push(...moments);
            }
            // Remove duplicates and sort by score
            const uniqueMoments = this.deduplicateMoments(allMoments);
            const topMoments = uniqueMoments
                .sort((a, b) => b.score - a.score)
                .slice(0, limit);
            searchCache.set(cacheKey, topMoments);
            return topMoments;
        }
        catch (error) {
            console.error('TwelveLabs search error:', error);
            return [];
        }
    }
    /**
     * Get video metadata and thumbnail
     */
    async getVideoMetadata(videoId) {
        if (!this.config.apiKey)
            return null;
        try {
            const response = await fetch(`${this.config.baseUrl}/indexes/${this.config.indexId}/videos/${videoId}`, {
                headers: {
                    'x-api-key': this.config.apiKey
                }
            });
            if (!response.ok)
                return null;
            return await response.json();
        }
        catch (error) {
            console.error('Video metadata fetch error:', error);
            return null;
        }
    }
    /**
     * Generate thumbnail URL for a specific moment
     */
    generateThumbnailUrl(videoId, timestamp) {
        // TwelveLabs provides thumbnail generation via API
        return `${this.config.baseUrl}/indexes/${this.config.indexId}/videos/${videoId}/thumbnail?time=${timestamp}&width=320&height=180`;
    }
    /**
     * Generate human-readable label from query and result
     */
    generateMomentLabel(query, result) {
        // Extract key terms from query for labeling
        const keyTerms = query
            .replace(/{player}/g, '')
            .split(' ')
            .filter(term => !['the', 'a', 'an', 'and', 'or', 'with', 'by'].includes(term.toLowerCase()))
            .slice(0, 3);
        const duration = Math.round(result.end - result.start);
        return `${keyTerms.join(' ')} (${duration}s)`.trim();
    }
    /**
     * Remove duplicate moments based on video + time overlap
     */
    deduplicateMoments(moments) {
        const unique = [];
        for (const moment of moments) {
            const isDuplicate = unique.some(existing => existing.videoId === moment.videoId &&
                Math.abs(existing.startTime - moment.startTime) < 5 // 5 second overlap threshold
            );
            if (!isDuplicate) {
                unique.push(moment);
            }
        }
        return unique;
    }
    /**
     * Batch search for multiple player-query combinations
     */
    async batchSearch(searchRequests) {
        const results = new Map();
        for (const request of searchRequests) {
            const playerQueries = request.queries.map(q => q.replace('{player}', request.player));
            const moments = await this.searchMoments(playerQueries, request.videoIds, 5);
            results.set(request.player, moments);
        }
        return results;
    }
    /**
     * Health check for TL service
     */
    async healthCheck() {
        if (!this.config.apiKey) {
            return { status: 'error', details: 'API key not configured' };
        }
        try {
            const response = await fetch(`${this.config.baseUrl}/indexes/${this.config.indexId}`, {
                headers: { 'x-api-key': this.config.apiKey }
            });
            if (response.ok) {
                return { status: 'ok', details: 'TwelveLabs connection successful' };
            }
            else {
                return { status: 'error', details: `API returned ${response.status}` };
            }
        }
        catch (error) {
            return { status: 'error', details: `Connection failed: ${error}` };
        }
    }
}
// Export singleton instance
export const twelveLabsClient = new TwelveLabsClient();
// Export utility functions for use in other modules
export function isVideoIntelligenceAvailable() {
    return Boolean(TL_CONFIG.apiKey);
}
