import type { PropInsights } from '@/types/insights';

export const getInsights = async (propId: string): Promise<PropInsights> => ({
  propId,
  playerId: 'haynes-king',
  propType: 'pass_tds',
  marketLine: 1.5,
  fairLine: 2.1,
  edgePct: 40,
  confidence: 'med',
  bullets: [
    { title: 'Red zone usage up 18% last 3 games', weight: 0.6 },
    { title: 'Opp. pass D ranks 78th EPA/play allowed', weight: 0.25 },
    { title: 'OL pressure rate trending down 6%' }
  ],
  supportingClips: [
    { id: 'c_king_pass_td', start: 5, end: 17, tags:['RZ','Play-action'] },
    { id: 'c_king_rush_td', start: 0, end: 12, tags:['QB Draw','Score'] }
  ],
  updatedAt: new Date().toISOString(),
});
