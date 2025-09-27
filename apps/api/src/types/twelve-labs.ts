export interface TwelveLabsConfig {
  apiKey: string;
  indexId?: string;
  baseUrl?: string;
}

export interface VideoIndexRequest {
  gameId: string;
  s3Url: string;
  title: string;
  metadata?: {
    team1?: string;
    team2?: string;
    date?: string;
    week?: number;
    season?: number;
  };
}

export interface TLVideo {
  id: string;
  gameId: string;
  s3Url: string;
  tlVideoId: string;
  title: string;
  status: 'indexing' | 'ready' | 'failed';
  duration?: number;
  thumbnailUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TLMoment {
  id: string;
  videoId: string;
  startTime: number;    // seconds
  endTime: number;      // seconds
  score: number;        // 0-1 relevance score from TL
  label: string;        // human-readable description
  query: string;        // original search query that found this
  thumbnailUrl?: string;
  confidence: 'low' | 'medium' | 'high';
}

export interface MomentPack {
  id: string;
  playerId: string;
  propType: PropType;
  gameId?: string;
  moments: TLMoment[];
  metadata: {
    totalMoments: number;
    avgConfidence: number;
    lastUpdated: Date;
    queries: string[];
  };
}

export type PropType = 
  | 'PASS_YDS' 
  | 'PASS_TDS' 
  | 'RUSH_YDS' 
  | 'RUSH_TDS' 
  | 'REC_YDS' 
  | 'REC_TDS' 
  | 'RECEPTIONS'
  | 'INTERCEPTIONS'
  | 'SACKS';

export interface PropIntent {
  propType: PropType;
  queries: string[];
  label: string;
  description: string;
  chipColor: string;
}

// TwelveLabs API response types
export interface TLSearchResponse {
  data: TLSearchResult[];
  page_info: {
    limit_per_page: number;
    page_expired_at: string;
    total_results: number;
  };
}

export interface TLSearchResult {
  video_id: string;
  score: number;
  start: number;
  end: number;
  metadata: TLSearchMetadata[];
  modules: TLSearchModule[];
}

export interface TLSearchMetadata {
  type: string;
  text?: string;
  start?: number;
  end?: number;
}

export interface TLSearchModule {
  type: 'visual' | 'conversation' | 'text_in_video' | 'logo';
  confidence: number;
}

export interface TLIndexResponse {
  _id: string;
  created_at: string;
  updated_at: string;
  estimated_time: string;
  metadata: {
    duration: number;
    filename: string;
    height: number;
    width: number;
  };
  status: string;
  video_id: string;
}

// Evidence features for props
export interface EvidenceFeature {
  name: string;
  value: number;
  unit: string;
  description: string;
  confidence: 'low' | 'medium' | 'high';
}

export interface PropEvidence {
  propId: string;
  momentPacks: MomentPack[];
  features: EvidenceFeature[];
  summary: {
    totalMoments: number;
    avgConfidence: number;
    riskFactors: string[];
    supportFactors: string[];
  };
}

// Query building utilities
export const PROP_INTENT_LIBRARY: Record<PropType, PropIntent> = {
  PASS_YDS: {
    propType: 'PASS_YDS',
    queries: [
      'quarterback {player} throws deep completion',
      '{player} intermediate passing plays',
      'QB {player} throwing under pressure',
      '{player} red zone passes'
    ],
    label: 'Passing Moments',
    description: 'Deep completions, intermediate routes, pressure situations',
    chipColor: '#3B82F6'
  },
  PASS_TDS: {
    propType: 'PASS_TDS', 
    queries: [
      '{player} touchdown pass',
      'QB {player} red zone touchdown',
      '{player} passing touchdown in end zone',
      '{player} scoring throws'
    ],
    label: 'TD Passes',
    description: 'Red zone efficiency, touchdown throws',
    chipColor: '#10B981'
  },
  RUSH_YDS: {
    propType: 'RUSH_YDS',
    queries: [
      '{player} running outside zone rush',
      '{player} inside zone carry with broken tackle', 
      'running back {player} explosive run',
      '{player} rushing between tackles'
    ],
    label: 'Rushing Plays',
    description: 'Zone schemes, broken tackles, explosive runs',
    chipColor: '#F59E0B'
  },
  RUSH_TDS: {
    propType: 'RUSH_TDS',
    queries: [
      '{player} rushing touchdown',
      'running back {player} goal line touchdown',
      '{player} red zone rushing score',
      '{player} short yardage touchdown run'
    ],
    label: 'Rushing TDs',
    description: 'Goal line carries, red zone success',
    chipColor: '#EF4444'
  },
  REC_YDS: {
    propType: 'REC_YDS',
    queries: [
      'receiver {player} seam route with YAC',
      '{player} slant route with yards after catch',
      'wide receiver {player} crossing route',
      '{player} deep reception downfield'
    ],
    label: 'Receiving',
    description: 'Route running, YAC ability, deep targets',
    chipColor: '#8B5CF6'
  },
  REC_TDS: {
    propType: 'REC_TDS',
    queries: [
      '{player} receiving touchdown',
      'receiver {player} end zone catch',
      '{player} touchdown reception',
      '{player} red zone receiving score'
    ],
    label: 'Receiving TDs', 
    description: 'End zone targets, red zone usage',
    chipColor: '#F97316'
  },
  RECEPTIONS: {
    propType: 'RECEPTIONS',
    queries: [
      '{player} catching passes underneath',
      'receiver {player} short route completions',
      '{player} check down receptions',
      '{player} volume catching'
    ],
    label: 'Receptions',
    description: 'Target share, underneath routes, volume',
    chipColor: '#06B6D4'
  },
  INTERCEPTIONS: {
    propType: 'INTERCEPTIONS',
    queries: [
      'quarterback {player} throws interception',
      '{player} intercepted pass under pressure',
      'QB {player} turnover throwing',
      '{player} picked off by defense'
    ],
    label: 'Turnovers',
    description: 'Pressure situations, risky throws',
    chipColor: '#DC2626'
  },
  SACKS: {
    propType: 'SACKS',
    queries: [
      'quarterback {player} gets sacked',
      '{player} pressured behind offensive line',
      'QB {player} hit while throwing',
      '{player} hurried in pocket'
    ],
    label: 'Pressure',
    description: 'Pass protection, pocket presence',
    chipColor: '#7C2D12'
  }
};

// Helper functions
export function buildMomentQuery(intent: PropIntent, playerName: string): string[] {
  return intent.queries.map(query => query.replace('{player}', playerName));
}

export function calculateConfidence(score: number): 'low' | 'medium' | 'high' {
  if (score >= 0.8) return 'high';
  if (score >= 0.6) return 'medium';
  return 'low';
}

export function formatMomentDuration(startTime: number, endTime: number): string {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return `${formatTime(startTime)} → ${formatTime(endTime)}`;
}