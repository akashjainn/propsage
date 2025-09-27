export interface InsightBullet { title: string; detail?: string; weight?: number }
export interface ClipRef { id: string; start: number; end: number; tags: string[]; confidence?: number }
export interface PropInsights {
  propId: string;
  playerId: string;
  propType: 'passing_yds' | 'rushing_yds' | 'pass_tds' | 'rush_tds' | 'receptions' | 'points';
  marketLine: number;
  fairLine: number;
  edgePct: number; // +10 means 10% value vs market
  confidence: 'low' | 'med' | 'high';
  bullets: InsightBullet[];
  supportingClips: ClipRef[];
  updatedAt: string;
}
