import { Router } from 'express';
import { evidenceService, isEvidenceAvailable } from '../services/evidence-service.js';
import { PROP_INTENT_LIBRARY, PropType, buildMomentQuery } from '../types/twelve-labs.js';

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

    // Search TL for moments scoped to this player
    const moments = await evidenceService.searchFreefromMoments(queries[0], player, undefined, limit);

    // Transform to clip DTO expected by web route
    const clips = moments.map(m => ({
      id: m.id,
      title: `${player} — ${statLabel}`,
      description: m.label,
      url: '', // TL playback URL not wired yet
      thumbnailUrl: m.thumbnailUrl,
      startTime: m.startTime,
      endTime: m.endTime,
      relevanceScore: m.score,
      gameContext: { team: undefined, opponent: undefined }
    }));

    // For now, omit url to prevent broken playback; web will suppress empty-URL clips
    const playable = clips.filter(c => c.url);
    return res.json({ clips: playable, total: playable.length, source: 'twelvelabs' });
  } catch (err) {
    console.error('[CFB Clips] error:', err);
    return res.status(500).json({ clips: [], total: 0, error: 'Failed to fetch clips' });
  }
});

export default r;