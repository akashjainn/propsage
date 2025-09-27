const BASE = process.env.NEXT_PUBLIC_API_URL!;

export type CfbPlayer = {
  id: string;
  name: string;
  team?: string;
  teamColor?: string;
  position?: string;
  class?: string;
  jersey?: number;
  height?: number;
  weight?: number;
  externalIds: { cfbd: number };
};

export type CfbProp = {
  propId: string;
  playerId: string;
  playerName: string;
  team?: string;
  teamColor?: string;
  position?: string;
  stat: string;
  book: string;
  marketLine: number;
  fairLine: number;
  edgePct: number;
  updatedAt: string;
};

export type NewsItem = {
  title: string;
  source: string;
  url: string;
  publishedAt?: string;
  snippet?: string;
};

export type PropHistoryPoint = {
  t: string;
  market: number;
  fair: number;
};

export type VideoMoment = {
  videoId: string;
  start: number;
  end: number;
  score: number;
  thumbnail?: string;
  title?: string;
  description?: string;
};

// Player search
export const searchCfbPlayers = async (q: string): Promise<CfbPlayer[]> => {
  const response = await fetch(`${BASE}/cfb/players?q=${encodeURIComponent(q)}`);
  if (!response.ok) throw new Error('Failed to search CFB players');
  return response.json();
};

// Props
export const getCfbProps = async (playerId: string): Promise<CfbProp[]> => {
  const response = await fetch(`${BASE}/cfb/props?playerId=${encodeURIComponent(playerId)}`);
  if (!response.ok) throw new Error('Failed to get CFB props');
  return response.json();
};

export const getCfbPropDetail = async (propId: string): Promise<CfbProp> => {
  const response = await fetch(`${BASE}/cfb/props/${encodeURIComponent(propId)}`);
  if (!response.ok) throw new Error('Failed to get CFB prop detail');
  return response.json();
};

export const getCfbPropHistory = async (propId: string): Promise<PropHistoryPoint[]> => {
  const response = await fetch(`${BASE}/cfb/props/${encodeURIComponent(propId)}/history`);
  if (!response.ok) throw new Error('Failed to get CFB prop history');
  return response.json();
};

// News
export const getCfbNews = async (playerName: string, team?: string): Promise<NewsItem[]> => {
  const params = new URLSearchParams();
  params.set('playerName', playerName);
  if (team) params.set('team', team);
  
  const response = await fetch(`${BASE}/cfb/news?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to get CFB news');
  return response.json();
};

// Video clips
export const searchCfbClips = async (q: string): Promise<VideoMoment[]> => {
  const response = await fetch(`${BASE}/cfb/video/search?q=${encodeURIComponent(q)}`);
  if (!response.ok) throw new Error('Failed to search CFB video clips');
  return response.json();
};

export const getCfbPropClips = async (playerName: string, stat: string, team?: string) => {
  const params = new URLSearchParams();
  params.set('playerName', playerName);
  params.set('stat', stat);
  if (team) params.set('team', team);
  
  const response = await fetch(`${BASE}/cfb/video/prop-clips?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to get CFB prop clips');
  return response.json();
};

// Stat mapping utilities
export function statToHuman(stat: string): string {
  const mapping: Record<string, string> = {
    'PASS_YDS': 'passing yards',
    'PASS_TDS': 'passing touchdowns',
    'RUSH_YDS': 'rushing yards', 
    'RUSH_TDS': 'rushing touchdowns',
    'REC_YDS': 'receiving yards',
    'REC': 'receptions',
    'REC_TDS': 'receiving touchdowns',
    'INTERCEPTIONS': 'interceptions',
    'TACKLES': 'tackles',
    'SACKS': 'sacks',
    'FUMBLES': 'fumbles'
  };
  
  return mapping[stat] || stat.toLowerCase().replace('_', ' ');
}

export function statToShortLabel(stat: string): string {
  const mapping: Record<string, string> = {
    'PASS_YDS': 'Pass Yds',
    'PASS_TDS': 'Pass TDs',
    'RUSH_YDS': 'Rush Yds',
    'RUSH_TDS': 'Rush TDs',
    'REC_YDS': 'Rec Yds',
    'REC': 'Receptions',
    'REC_TDS': 'Rec TDs',
    'INTERCEPTIONS': 'INTs',
    'TACKLES': 'Tackles',
    'SACKS': 'Sacks',
    'FUMBLES': 'Fumbles'
  };
  
  return mapping[stat] || stat;
}

export function getStatIcon(stat: string): string {
  // College football stat icons
  if (stat.includes('PASS')) return '🏈';
  if (stat.includes('RUSH')) return '🏃';
  if (stat.includes('REC')) return '🙌';
  if (stat.includes('TACKLE')) return '🛡️';
  if (stat.includes('SACK')) return '💥';
  if (stat.includes('INT')) return '✋';
  if (stat.includes('TD')) return '🎯';
  return '📊';
}

// Generate video search query for a prop
export function generateClipQuery(playerName: string, stat: string, team?: string): string {
  const humanStat = statToHuman(stat);
  if (team) {
    return `${playerName} ${team} ${humanStat} highlights`;
  }
  return `${playerName} ${humanStat} highlights`;
}

// Format edge percentage with colors
export function formatEdge(edgePct: number): { text: string; color: string } {
  const text = `${edgePct > 0 ? '+' : ''}${edgePct.toFixed(1)}%`;
  
  if (Math.abs(edgePct) < 3) {
    return { text, color: 'text-gray-500' };
  } else if (edgePct > 0) {
    return { text, color: 'text-green-600' };
  } else {
    return { text, color: 'text-red-600' };
  }
}

// Get team colors (college football teams)
export function getTeamColor(team?: string): string {
  const colors: Record<string, string> = {
    'Georgia': '#BA0C2F',
    'Florida State': '#782F40', 
    'Virginia': '#232D4B',
    'Boston College': '#8B0000',
    'Iowa': '#FFCD00',
    'Notre Dame': '#0C2340',
    'Washington': '#4B2E83',
    'USC': '#990000',
    'Ohio State': '#BB0000',
    'Alabama': '#9E1B32',
    'Texas': '#BF5700',
    'Michigan': '#00274C',
    'Penn State': '#041E42',
    'Auburn': '#0C2340',
    'Florida': '#0021A5',
    'Tennessee': '#FF8200',
    'LSU': '#461D7C',
    'Oregon': '#154733',
    'Clemson': '#F56600',
    'Miami': '#F47321'
  };
  
  return colors[team || ''] || '#374151'; // Default gray
}

// Get conference for context
export function getConference(team?: string): string {
  const conferences: Record<string, string> = {
    'Georgia': 'SEC',
    'Florida State': 'ACC',
    'Virginia': 'ACC', 
    'Boston College': 'ACC',
    'Iowa': 'Big Ten',
    'Notre Dame': 'Independent',
    'Washington': 'Big Ten',
    'USC': 'Big Ten',
    'Ohio State': 'Big Ten',
    'Alabama': 'SEC',
    'Texas': 'SEC',
    'Michigan': 'Big Ten',
    'Penn State': 'Big Ten',
    'Auburn': 'SEC',
    'Florida': 'SEC',
    'Tennessee': 'SEC',
    'LSU': 'SEC',
    'Oregon': 'Big Ten',
    'Clemson': 'ACC',
    'Miami': 'ACC'
  };
  
  return conferences[team || ''] || '';
}

// Format player class/year
export function formatPlayerClass(playerClass?: string): string {
  if (!playerClass) return '';
  
  const mapping: Record<string, string> = {
    'FR': 'Freshman',
    'SO': 'Sophomore', 
    'JR': 'Junior',
    'SR': 'Senior',
    'RS-FR': 'Redshirt Freshman',
    'RS-SO': 'Redshirt Sophomore',
    'RS-JR': 'Redshirt Junior', 
    'RS-SR': 'Redshirt Senior'
  };
  
  return mapping[playerClass] || playerClass;
}

// Generate context for prop analysis
export function generatePropContext(prop: CfbProp): string {
  const edgeDirection = prop.edgePct > 0 ? 'favorable' : 'unfavorable';
  const edgeMagnitude = Math.abs(prop.edgePct) > 5 ? 'significant' : 'moderate';
  
  return `${prop.playerName} (${prop.team}) ${statToHuman(prop.stat)}: ${prop.book} market at ${prop.marketLine}, fair line suggests ${edgeMagnitude} ${edgeDirection} edge of ${formatEdge(prop.edgePct).text}`;
}