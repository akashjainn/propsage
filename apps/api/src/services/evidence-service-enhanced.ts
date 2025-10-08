/**
 * Enhanced Evidence Service Integration - Phase 1 Day 2
 * 
 * Integrates processed video library with evidence-driven pricing adjustments
 */

import fs from 'fs';
import path from 'path';

// Load processed video data
let PROCESSED_VIDEO_LIBRARY: any[] = [];
let PROP_MAPPINGS: any = {};
let MOMENT_LIBRARY: any[] = [];

try {
  const dataPath = path.join(__dirname, '../../../data');
  
  const videoLibraryPath = path.join(dataPath, 'video-library-processed.json');
  if (fs.existsSync(videoLibraryPath)) {
    PROCESSED_VIDEO_LIBRARY = JSON.parse(fs.readFileSync(videoLibraryPath, 'utf8'));
  }
  
  const propMappingsPath = path.join(dataPath, 'prop-mappings.json');
  if (fs.existsSync(propMappingsPath)) {
    PROP_MAPPINGS = JSON.parse(fs.readFileSync(propMappingsPath, 'utf8'));
  }
  
  const momentLibraryPath = path.join(dataPath, 'moment-library.json');
  if (fs.existsSync(momentLibraryPath)) {
    MOMENT_LIBRARY = JSON.parse(fs.readFileSync(momentLibraryPath, 'utf8'));
  }
  
  console.log(`📚 Enhanced Evidence Service: Loaded ${PROCESSED_VIDEO_LIBRARY.length} videos, ${Object.keys(PROP_MAPPINGS).length} prop categories`);
  
} catch (error) {
  console.log('⚠️  Enhanced Evidence Service: Using fallback data');
}

/**
 * Get video evidence for specific prop categories
 */
export function getVideoEvidenceForProps(propCategories: string[], playerId?: string) {
  const evidencePacks: any = {};
  
  for (const category of propCategories) {
    if (PROP_MAPPINGS[category]) {
      const categoryMoments = PROP_MAPPINGS[category];
      
      // Find corresponding video library entries
      const evidenceEntries = categoryMoments.map((mapping: any) => {
        const videoEntry = PROCESSED_VIDEO_LIBRARY.find(video => 
          video.filename === mapping.filename
        );
        
        if (videoEntry) {
          return {
            momentId: mapping.momentId,
            filename: mapping.filename,
            actions: videoEntry.actions || [],
            players: videoEntry.playerNames || [],
            teams: videoEntry.teams,
            yardage: videoEntry.yardage,
            evidenceWeight: mapping.evidenceWeight,
            deltaMu: mapping.deltaMu,
            deltaSigma: mapping.deltaSigma,
            confidence: videoEntry.tlMoment?.confidence || 'medium',
            description: videoEntry.tlMoment?.text || 'Video moment'
          };
        }
        return null;
      }).filter(Boolean);
      
      if (evidenceEntries.length > 0) {
        evidencePacks[category] = {
          propCategory: category,
          evidenceCount: evidenceEntries.length,
          moments: evidenceEntries,
          overallImpact: {
            avgWeight: evidenceEntries.reduce((sum: number, e: any) => sum + e.evidenceWeight, 0) / evidenceEntries.length,
            avgDeltaMu: evidenceEntries.reduce((sum: number, e: any) => sum + e.deltaMu, 0) / evidenceEntries.length,
            avgDeltaSigma: evidenceEntries.reduce((sum: number, e: any) => sum + e.deltaSigma, 0) / evidenceEntries.length
          }
        };
      }
    }
  }
  
  return evidencePacks;
}

/**
 * Search for evidence moments by query
 */
export function searchEvidenceMoments(query: string, maxResults = 5) {
  const queryLower = query.toLowerCase();
  const queryTerms = queryLower.split(/\s+/);
  
  const scoredMoments = PROCESSED_VIDEO_LIBRARY.map((video: any) => {
    let score = 0;
    
    // Action matching
    if (video.actions) {
      video.actions.forEach((action: string) => {
        queryTerms.forEach((term: string) => {
          if (action.toLowerCase().includes(term)) {
            score += 1.0;
          }
        });
      });
    }
    
    // Player matching
    if (video.playerNames) {
      video.playerNames.forEach((player: string) => {
        queryTerms.forEach((term: string) => {
          if (player.toLowerCase().includes(term)) {
            score += 0.8;
          }
        });
      });
    }
    
    // Team matching
    if (video.teams) {
      queryTerms.forEach((term: string) => {
        if (video.teams.toLowerCase().includes(term)) {
          score += 0.6;
        }
      });
    }
    
    // Prop category matching
    if (video.propCategories) {
      video.propCategories.forEach((prop: string) => {
        queryTerms.forEach((term: string) => {
          if (prop.toLowerCase().includes(term)) {
            score += 0.7;
          }
        });
      });
    }
    
    return { video, score };
  }).filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
  
  return scoredMoments.map(({ video, score }) => ({
    ...video,
    searchScore: score
  }));
}

/**
 * Get evidence summary statistics
 */
export function getEvidenceStats() {
  return {
    totalVideos: PROCESSED_VIDEO_LIBRARY.length,
    totalMoments: MOMENT_LIBRARY.length,
    propCategories: Object.keys(PROP_MAPPINGS),
    actionTypes: [...new Set(PROCESSED_VIDEO_LIBRARY.flatMap(v => v.actions || []))],
    players: [...new Set(PROCESSED_VIDEO_LIBRARY.flatMap(v => v.playerNames || []))],
    teams: [...new Set(PROCESSED_VIDEO_LIBRARY.map(v => v.teams))].filter(Boolean),
    evidenceDistribution: {
      touchdownMoments: PROCESSED_VIDEO_LIBRARY.filter(v => v.actions?.includes('touchdown')).length,
      fumbleMoments: PROCESSED_VIDEO_LIBRARY.filter(v => v.actions?.includes('fumble')).length,
      interceptionMoments: PROCESSED_VIDEO_LIBRARY.filter(v => v.actions?.includes('interception')).length,
      passingMoments: PROCESSED_VIDEO_LIBRARY.filter(v => v.actions?.includes('passing')).length,
      rushingMoments: PROCESSED_VIDEO_LIBRARY.filter(v => v.actions?.includes('rushing')).length
    }
  };
}

/**
 * Enhanced integration for existing evidence service
 */
export const enhancedEvidenceService = {
  getVideoEvidenceForProps,
  searchEvidenceMoments,
  getEvidenceStats,
  
  // Direct integration points for existing code
  async buildMomentPack(playerId: string, propType: string) {
    console.log(`🎥 Building enhanced moment pack for ${playerId} - ${propType}`);
    
    const relevantCategories = [propType, 'anytime_touchdown', 'passing_touchdowns', 'rushing_touchdowns'];
    const evidencePacks = getVideoEvidenceForProps(relevantCategories, playerId);
    
    return {
      id: `enhanced_pack_${playerId}_${propType}`,
      playerId,
      propType,
      evidencePacks,
      totalMoments: Object.values(evidencePacks).reduce((sum: number, pack: any) => sum + pack.evidenceCount, 0),
      createdAt: new Date().toISOString(),
      source: 'enhanced_video_processing_pipeline'
    };
  },
  
  async getMockVideoForDemo() {
    // Return a sample processed moment for demo
    if (PROCESSED_VIDEO_LIBRARY.length > 0) {
      const sample = PROCESSED_VIDEO_LIBRARY[0];
      return {
        filename: sample.filename,
        actions: sample.actions,
        players: sample.playerNames,
        evidenceWeight: sample.evidenceWeight,
        deltaMu: sample.deltaMu,
        deltaSigma: sample.deltaSigma
      };
    }
    return null;
  }
};

export default enhancedEvidenceService;