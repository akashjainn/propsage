const BASE = process.env.NEXT_PUBLIC_API_URL!;

export type NflPlayer = {
  id: string;
  name: string;
  team?: string;
  position?: string;
  externalIds: { sleeper: string };
};

export type NflProp = {
  propId: string;
  playerId: string;
  playerName: string;
  team?: string;
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

// Player search
export const searchNflPlayers = async (q: string): Promise<NflPlayer[]> => {
  const response = await fetch(`${BASE}/nfl/players?q=${encodeURIComponent(q)}`);
  if (!response.ok) throw new Error('Failed to search NFL players');
  return response.json();
};

// Props
export const getNflProps = async (playerId: string): Promise<NflProp[]> => {
  const response = await fetch(`${BASE}/nfl/props?playerId=${encodeURIComponent(playerId)}`);
  if (!response.ok) throw new Error('Failed to get NFL props');
  return response.json();
};

export const getNflPropDetail = async (propId: string): Promise<NflProp> => {
  const response = await fetch(`${BASE}/nfl/props/${encodeURIComponent(propId)}`);
  if (!response.ok) throw new Error('Failed to get NFL prop detail');
  return response.json();
};

export const getNflPropHistory = async (propId: string): Promise<PropHistoryPoint[]> => {
  const response = await fetch(`${BASE}/nfl/props/${encodeURIComponent(propId)}/history`);
  if (!response.ok) throw new Error('Failed to get NFL prop history');
  return response.json();
};

// News
export const getNflNews = async (playerName: string, team?: string): Promise<NewsItem[]> => {
  const params = new URLSearchParams();
  params.set('playerName', playerName);
  if (team) params.set('team', team);
  
  const response = await fetch(`${BASE}/nfl/news?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to get NFL news');
  return response.json();
};

// Video clips (reuse existing endpoint)
export const searchClips = async (q: string) => {
  const response = await fetch(`${BASE}/video/search?q=${encodeURIComponent(q)}`);
  if (!response.ok) throw new Error('Failed to search video clips');
  return response.json();
};

// Stat mapping utilities
export function statToHuman(stat: string): string {
  const mapping: Record<string, string> = {
    'REC_YDS': 'receiving yards',
    'RUSH_YDS': 'rushing yards', 
    'PASS_YDS': 'passing yards',
    'REC': 'receptions',
    'RUSH_ATT': 'rushing attempts',
    'PASS_TDS': 'passing touchdowns',
    'RUSH_TDS': 'rushing touchdowns',
    'REC_TDS': 'receiving touchdowns',
    'TACKLES': 'tackles',
    'SACKS': 'sacks',
    'INT': 'interceptions',
    'FG_MADE': 'field goals made',
    'LONG_SNAP': 'long snaps'
  };
  
  return mapping[stat] || stat.toLowerCase().replace('_', ' ');
}

export function statToShortLabel(stat: string): string {
  const mapping: Record<string, string> = {
    'REC_YDS': 'Rec Yds',
    'RUSH_YDS': 'Rush Yds',
    'PASS_YDS': 'Pass Yds', 
    'REC': 'Receptions',
    'RUSH_ATT': 'Rush Att',
    'PASS_TDS': 'Pass TDs',
    'RUSH_TDS': 'Rush TDs',
    'REC_TDS': 'Rec TDs',
    'TACKLES': 'Tackles',
    'SACKS': 'Sacks', 
    'INT': 'Interceptions',
    'FG_MADE': 'FG Made',
    'LONG_SNAP': 'Long Snaps'
  };
  
  return mapping[stat] || stat;
}

export function getStatIcon(stat: string): string {
  // Simple icons/emojis for different stat types
  if (stat.includes('PASS')) return '🏈';
  if (stat.includes('RUSH')) return '🏃';
  if (stat.includes('REC')) return '🙌';
  if (stat.includes('TACKLE')) return '🛡️';
  if (stat.includes('SACK')) return '💥';
  if (stat.includes('INT')) return '✋';
  if (stat.includes('FG')) return '⚽';
  return '📊';
}

// Generate video search query for a prop
export function generateClipQuery(playerName: string, stat: string): string {
  return `${playerName} ${statToHuman(stat)} highlights`;
}

// Format edge percentage with colors
export function formatEdge(edgePct: number): { text: string; color: string } {
  const text = `${edgePct > 0 ? '+' : ''}${edgePct.toFixed(1)}%`;
  
  if (Math.abs(edgePct) < 2) {
    return { text, color: 'text-gray-500' };
  } else if (edgePct > 0) {
    return { text, color: 'text-green-600' };
  } else {
    return { text, color: 'text-red-600' };
  }
}

// Get team colors (basic mapping for major NFL teams)
export function getTeamColor(team?: string): string {
  const colors: Record<string, string> = {
    'DAL': '#041E42', // Cowboys navy
    'TB': '#D50A0A',  // Bucs red  
    'CLE': '#311D00', // Browns brown
    'JAX': '#101820', // Jaguars teal
    'IND': '#002C5F', // Colts blue
    'CIN': '#FB4F14', // Bengals orange
    'CHI': '#0B162A', // Bears navy
    'NE': '#002244',  // Patriots navy
    'CAR': '#0085CA', // Panthers blue
  };
  
  return colors[team || ''] || '#374151'; // Default gray
}