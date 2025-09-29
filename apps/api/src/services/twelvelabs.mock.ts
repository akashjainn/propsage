// Mock TwelveLabs Video Intelligence Service
// Simulates the TwelveLabs API workflow for demo purposes
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

// ESM-safe __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TwelveLabsSearchResult {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  duration: number;
  confidence: number;
  tags: string[];
  metadata: any;
  clips: Array<{
    start_time: number;
    end_time: number;
    description: string;
  }>;
}

interface TwelveLabsSearchResponse {
  query: string;
  total_results: number;
  processing_time_ms: number;
  results: TwelveLabsSearchResult[];
  index_id: string;
  status: "ready" | "processing" | "indexing";
}

interface TwelveLabsIndexStatus {
  id: string;
  name: string;
  status: "ready" | "processing" | "indexing";
  total_videos: number;
  last_updated: string;
}

class MockTwelveLabsService {
  private mockData: any = null;
  private loadMockData() {
    if (!this.mockData) {
      const candidatePaths = [
        path.join(__dirname, '../../data/twelvelabs.mock.json'),
        path.join(process.cwd(), 'apps/api/data/twelvelabs.mock.json'),
        path.join(process.cwd(), 'data/twelvelabs.mock.json'),
        '/app/apps/api/data/twelvelabs.mock.json'
      ];
      for (const p of candidatePaths) {
        try {
          if (fs.existsSync(p)) {
            this.mockData = JSON.parse(fs.readFileSync(p, 'utf8'));
            return this.mockData;
          }
        } catch {}
      }
      console.warn('TwelveLabs mock data not found in candidates, using empty fallback');
      this.mockData = { players: {}, search_queries: {} };
    }
    return this.mockData;
  }

  /**
   * Simulates TwelveLabs search API with realistic delays and responses
   */
  async search(query: string, playerId?: string, tags?: string[]): Promise<TwelveLabsSearchResponse> {
    // Simulate API processing delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));

    const data = this.loadMockData();
    const results: TwelveLabsSearchResult[] = [];

    // If searching for specific player
    if (playerId && data.players[playerId]) {
      const playerVideos = data.players[playerId].videos;
      for (const video of playerVideos) {
        // Filter by tags if provided
        if (tags && tags.length > 0) {
          const hasMatchingTag = tags.some(tag => video.tags.includes(tag));
          if (!hasMatchingTag) continue;
        }

        // Simple query matching
        const queryMatch = this.calculateQueryMatch(query, video);
        if (queryMatch > 0.3) { // Threshold for relevance
          results.push({
            ...video,
            confidence: Math.min(video.confidence * queryMatch, 1.0)
          });
        }
      }
    }

    // Sort by confidence score
    results.sort((a, b) => b.confidence - a.confidence);

    return {
      query,
      total_results: results.length,
      processing_time_ms: Math.floor(800 + Math.random() * 400),
      results: results.slice(0, 6), // Limit to top 6 results
      index_id: "idx_cfb_2025_highlights",
      status: "ready"
    };
  }

  /**
   * Get index status (for "indexing new footage" UI)
   */
  async getIndexStatus(indexId: string = "idx_cfb_2025_highlights"): Promise<TwelveLabsIndexStatus> {
    const data = this.loadMockData();
    const index = data.indexes?.cfb_highlights_2025 || {
      id: indexId,
      name: "College Football 2025 Highlights",
      status: "ready",
      total_videos: 1847,
      last_updated: new Date().toISOString()
    };

    return index;
  }

  /**
   * Simulate video upload/indexing (for demo purposes)
   */
  async indexVideo(videoUrl: string, metadata: any): Promise<{ status: string; video_id: string }> {
    // Simulate indexing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      status: "indexed",
      video_id: `vid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  /**
   * Get available tags for filtering
   */
  getAvailableTags(): string[] {
    return [
      "passing", "rushing", "receiving", "touchdown", "sack", "interception",
      "injury", "news", "highlights", "clutch", "deep_ball", "scramble",
      "mobility", "breakaway", "arm_strength", "status_update"
    ];
  }

  private calculateQueryMatch(query: string, video: any): number {
    const queryLower = query.toLowerCase();
    const titleMatch = video.title.toLowerCase().includes(queryLower) ? 0.8 : 0;
    const tagMatch = video.tags.some((tag: string) => queryLower.includes(tag)) ? 0.6 : 0;
    const descMatch = video.clips?.some((clip: any) => 
      clip.description.toLowerCase().includes(queryLower)
    ) ? 0.4 : 0;

    return Math.max(titleMatch, tagMatch, descMatch);
  }
}

export const mockTwelveLabsService = new MockTwelveLabsService();
export type { TwelveLabsSearchResult, TwelveLabsSearchResponse, TwelveLabsIndexStatus };