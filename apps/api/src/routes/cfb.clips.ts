import { Router } from 'express';
import { evidenceService, isEvidenceAvailable } from '../services/evidence-service.js';
import { PROP_INTENT_LIBRARY, PropType, buildMomentQuery } from '../types/twelve-labs.js';
import { twelveLabsClient } from '../services/twelve-labs-client.js';

const r = Router();

// Map loose stat labels to PropType
const STAT_TO_PROP: Record<string, PropType> = {
  'pass yards': 'PASS_YDS',
  'passing yards': 'PASS_YDS',
  'pass yds': 'PASS_YDS',
  'pass tds': 'PASS_TDS',
  'passing tds': 'PASS_TDS',
  'rush yards': 'RUSH_YDS',
  'rushing yards': 'RUSH_YDS',
  'rush tds': 'RUSH_TDS',
  'rushing tds': 'RUSH_TDS',
  'rec yards': 'REC_YDS',
  'receiving yards': 'REC_YDS',
  'rec tds': 'REC_TDS',
  'receptions': 'RECEPTIONS',
  'ints': 'INTERCEPTIONS',
  'interceptions': 'INTERCEPTIONS',
  'sacks': 'SACKS'
};

function normalizeStat(stat?: string | null): PropType | undefined {
  if (!stat) return undefined;
  const key = stat.toLowerCase().trim();
  return STAT_TO_PROP[key];
}

// GET /cfb/clips?player=Haynes%20King&stat=Passing%20Yards&limit=6
r.get('/', async (req, res) => {
  try {
    const player = (req.query.player as string) || '';
    const statLabel = (req.query.stat as string) || '';
    const limit = Math.min(parseInt((req.query.limit as string) || '6', 10), 12);

    const propType = normalizeStat(statLabel);

    // If TL not available, return empty set (avoid mock cross-team contamination)
    if (!isEvidenceAvailable()) {
      return res.json({ clips: [], total: 0, source: 'disabled' });
    }

    if (!player || !propType) {
      return res.json({ clips: [], total: 0, source: 'invalid-params' });
    }

    // Build queries for this player/prop
    const intent = PROP_INTENT_LIBRARY[propType];
    const queries = buildMomentQuery(intent, player);

    console.log(`[CFB Clips] Searching for player="${player}", stat="${statLabel}", propType=${propType}`);
    console.log(`[CFB Clips] Query: "${queries[0]}"`);
    
    // Known video IDs for specific players (temporary mapping until we have proper metadata)
    const KNOWN_VIDEOS: Record<string, string[]> = {
      'gunner stockton': ['68d88739dd044d81bd8b08c0'],
      'colbie young': ['68d88739dd044d81bd8b08c0']
    };
    
    const playerKey = player.toLowerCase().trim();
    const knownVideoIds = KNOWN_VIDEOS[playerKey];
    
    // Search TL - use direct client with video filtering if we have known videos
    let moments;
    if (knownVideoIds && knownVideoIds.length > 0) {
      console.log(`[CFB Clips] Using known video IDs: ${knownVideoIds.join(', ')}`);
      moments = await twelveLabsClient.searchMoments([queries[0]], knownVideoIds, limit);
    } else {
      console.log(`[CFB Clips] Searching entire index (no known videos)`);
      moments = await evidenceService.searchFreefromMoments(queries[0], player, undefined, limit);
    }
    
    console.log(`[CFB Clips] Found ${moments.length} moments from TwelveLabs`);

    // Transform to clip DTO expected by web route
    const clips = moments.map(m => ({
      id: m.id,
      title: `${player} — ${statLabel}`,
      description: m.label,
      url: m.thumbnailUrl || '', // Use thumbnail URL as fallback
      thumbnailUrl: m.thumbnailUrl,
      startTime: m.startTime,
      endTime: m.endTime,
      relevanceScore: m.score,
      gameContext: { 
        videoId: m.videoId,
        team: undefined, 
        opponent: undefined 
      }
    }));

    // Return all clips (removed URL filter)
    return res.json({ clips, total: clips.length, source: 'twelvelabs' });
  } catch (err) {
    console.error('[CFB Clips] error:', err);
    return res.status(500).json({ clips: [], total: 0, error: 'Failed to fetch clips' });
  }
});

export default r;