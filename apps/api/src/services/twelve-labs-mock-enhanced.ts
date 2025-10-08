/**
 * Enhanced TwelveLabs Mock Service for PropSage Webinar Demo
 * Phase 1 Day 2 - Integrated with Processed Video Library
 * 
 * This service creates realistic TwelveLabs API responses using our processed video metadata.
 * It dynamically loads from the video processing pipeline output.
 */

import type { TLMoment, TLSearchResponse, TLSearchResult } from '../types/twelve-labs.js';
import fs from 'fs';
import path from 'path';

// Dynamic video moments database loaded from processed data
let VIDEO_MOMENTS_DATABASE: any[] = []; // Use any[] for processed data flexibility
let PROP_MAPPINGS: any = {};
let VIDEO_LIBRARY: any[] = [];
let TL_MOMENTS_DATABASE: TLMoment[] = []; // Properly typed TL moments

/**
 * Load processed video data from the processing pipeline
 */
function loadProcessedVideoData() {
  try {
    const dataPath = path.join(__dirname, '../../../../data');
    
    // Load moment library
    const momentLibraryPath = path.join(dataPath, 'moment-library.json');
    if (fs.existsSync(momentLibraryPath)) {
      const momentData = JSON.parse(fs.readFileSync(momentLibraryPath, 'utf8'));
      VIDEO_MOMENTS_DATABASE = momentData;
      console.log(`🎥 Loaded ${VIDEO_MOMENTS_DATABASE.length} processed video moments`);
    } else {
      console.log('📁 No processed moment library found, using fallback data');
      VIDEO_MOMENTS_DATABASE = getFallbackMoments();
    }
    
    // Load prop mappings
    const propMappingsPath = path.join(dataPath, 'prop-mappings.json');
    if (fs.existsSync(propMappingsPath)) {
      PROP_MAPPINGS = JSON.parse(fs.readFileSync(propMappingsPath, 'utf8'));
      console.log(`🎯 Loaded prop mappings for ${Object.keys(PROP_MAPPINGS).length} categories`);
    }
    
    // Load full video library
    const videoLibraryPath = path.join(dataPath, 'video-library-processed.json');
    if (fs.existsSync(videoLibraryPath)) {
      VIDEO_LIBRARY = JSON.parse(fs.readFileSync(videoLibraryPath, 'utf8'));
      console.log(`📚 Loaded ${VIDEO_LIBRARY.length} processed video entries`);
    }
    
  } catch (error) {
    console.log('⚠️  Error loading processed data, using fallback:', error.message);
    VIDEO_MOMENTS_DATABASE = getFallbackMoments();
  }
}

/**
 * Fallback moments if processed files aren't available
 */
function getFallbackMoments(): TLMoment[] {
  return [
    {
      id: 'fallback_touchdown_1',
      videoId: 'gt_wf_game1',
      startTime: 2.1,
      endTime: 8.7,
      score: 0.95,
      label: 'touchdown, passing, haynes king',
      query: 'touchdown passing',
      confidence: 'high'
    },
    {
      id: 'fallback_touchdown_2',
      videoId: 'uga_bama_game1', 
      startTime: 4.3,
      endTime: 11.7,
      score: 0.92,
      label: 'passing touchdown, gunner stockton, colbie young',
      query: 'passing touchdown',
      confidence: 'high'
    }
  ];
}

/**
 * Smart search function that uses processed video data
 */
function searchMoments(query: string, options: any = {}): TLMoment[] {
  const queryLower = query.toLowerCase();
  const queryTerms = queryLower.split(/\s+/);
  
  console.log(`🔍 Searching ${VIDEO_MOMENTS_DATABASE.length} moments for: "${query}"`);
  
  const scoredMoments = VIDEO_MOMENTS_DATABASE.map(moment => {
    let score = 0;
    const searchableText = (moment.text || '').toLowerCase();
    const metadata = moment.metadata || {};
    
    // Direct text matching (highest weight)
    queryTerms.forEach(term => {
      if (searchableText.includes(term)) {
        score += 1.0;
      }
    });
    
    // Action matching
    if (metadata.actions) {
      metadata.actions.forEach((action: string) => {
        queryTerms.forEach(term => {
          if (action.toLowerCase().includes(term)) {
            score += 0.8;
          }
        });
      });
    }
    
    // Player matching
    if (metadata.players) {
      metadata.players.forEach((player: string) => {
        queryTerms.forEach(term => {
          if (player.toLowerCase().includes(term)) {
            score += 0.7;
          }
        });
      });
    }
    
    // Prop relevance matching
    if (metadata.propRelevance) {
      metadata.propRelevance.forEach((prop: string) => {
        queryTerms.forEach(term => {
          if (prop.toLowerCase().includes(term)) {
            score += 0.6;
          }
        });
      });
    }
    
    // Fuzzy matching bonuses
    if (query.includes('touchdown') && searchableText.includes('touchdown')) score += 0.5;
    if (query.includes('passing') && searchableText.includes('pass')) score += 0.4;
    if (query.includes('rushing') && searchableText.includes('rush')) score += 0.4;
    if (query.includes('fumble') && searchableText.includes('fumble')) score += 0.5;
    
    return { moment, score };
  }).filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);
  
  const results = scoredMoments.slice(0, options.maxResults || 10).map(({ moment, score }) => ({
    ...moment,
    searchScore: score
  }));
  
  console.log(`✅ Found ${results.length} relevant moments`);
  return results;
}

/**
 * Get moments by prop category
 */
function getMomentsForPropCategory(category: string): TLMoment[] {
  if (!PROP_MAPPINGS[category]) {
    console.log(`⚠️  No moments found for prop category: ${category}`);
    return [];
  }
  
  const mappings = PROP_MAPPINGS[category];
  const moments = mappings.map((mapping: any) => {
    const moment = VIDEO_MOMENTS_DATABASE.find(m => m.id === mapping.momentId);
    return moment ? {
      ...moment,
      evidenceWeight: mapping.evidenceWeight,
      deltaMu: mapping.deltaMu,
      deltaSigma: mapping.deltaSigma
    } : null;
  }).filter(Boolean);
  
  console.log(`🎯 Found ${moments.length} moments for prop category: ${category}`);
  return moments;
}

/**
 * Enhanced TwelveLabs Mock Service
 */
export const twelveLabsMockService = {
  /**
   * Health check
   */
  async health() {
    return {
      status: 'ok',
      details: `TwelveLabs Mock Service ready with ${VIDEO_MOMENTS_DATABASE.length} videos`,
      processedData: {
        moments: VIDEO_MOMENTS_DATABASE.length,
        propCategories: Object.keys(PROP_MAPPINGS).length,
        videoLibrary: VIDEO_LIBRARY.length
      }
    };
  },

  /**
   * Search for video moments
   */
  async searchMoments(query: string, options: any = {}): Promise<TLSearchResponse> {
    console.log(`🎥 DATA SOURCE: Using TwelveLabs Mock Service (Demo Mode)`);
    
    try {
      const moments = searchMoments(query, options);
      
      // Add realistic timing variations
      const processedMoments = moments.map(moment => ({
        ...moment,
        // Add slight timing variations for realism
        start: moment.start + (Math.random() - 0.5) * 0.2,
        end: moment.end + (Math.random() - 0.5) * 0.2
      }));

      return {
        data: processedMoments,
        page_info: {
          limit_per_page: options.maxResults || 10,
          total_results: moments.length,
          page_expired_at: new Date(Date.now() + 300000).toISOString() // 5 minutes
        }
      };
    } catch (error) {
      console.error('❌ Mock search error:', error);
      return {
        data: [],
        page_info: {
          limit_per_page: 10,
          total_results: 0,
          page_expired_at: new Date(Date.now() + 300000).toISOString()
        }
      };
    }
  },

  /**
   * Get moments for specific prop categories
   */
  async getMomentsForProps(propCategories: string[]): Promise<any> {
    const allMoments: any = {};
    
    for (const category of propCategories) {
      const moments = getMomentsForPropCategory(category);
      if (moments.length > 0) {
        allMoments[category] = moments;
      }
    }
    
    console.log(`🎯 Retrieved moments for ${Object.keys(allMoments).length} prop categories`);
    return allMoments;
  },

  /**
   * Get video library stats
   */
  async getLibraryStats() {
    return {
      totalVideos: VIDEO_LIBRARY.length,
      totalMoments: VIDEO_MOMENTS_DATABASE.length,
      propCategories: Object.keys(PROP_MAPPINGS),
      actionTypes: [...new Set(VIDEO_LIBRARY.flatMap(v => v.actions || []))],
      players: [...new Set(VIDEO_LIBRARY.flatMap(v => v.playerNames || []))],
      teams: [...new Set(VIDEO_LIBRARY.map(v => v.teams))].filter(Boolean)
    };
  },

  /**
   * Reload data from processing pipeline
   */
  async reloadData() {
    loadProcessedVideoData();
    return this.health();
  }
};

// Initialize data on module load
loadProcessedVideoData();

// Export for testing
export { VIDEO_MOMENTS_DATABASE, PROP_MAPPINGS, VIDEO_LIBRARY };