/**
 * League-Aware Context System for Multi-League TwelveLabs Index
 * 
 * Provides robust filtering and query construction to prevent cross-league
 * contamination when both CFB and NFL clips exist in the same TL index.
 */

export type League = 'nfl' | 'cfb';

export interface LeagueContext {
  league: League;
  season: string;
  week?: number;
  team?: string;
  opponent?: string;
  player?: string;
  propType?: string;
}

export interface LeagueFilter {
  league: League;
  teams?: string[];  // Valid team names/codes for this league
  excludeTeams?: string[];  // Teams from other leagues to exclude
  metadata?: Record<string, any>;
}

/**
 * NFL Team Database (2024-2025 season)
 */
const NFL_TEAMS = new Set([
  // AFC East
  'Bills', 'Dolphins', 'Patriots', 'Jets',
  // AFC North
  'Ravens', 'Bengals', 'Browns', 'Steelers',
  // AFC South
  'Texans', 'Colts', 'Jaguars', 'Titans',
  // AFC West
  'Broncos', 'Chiefs', 'Raiders', 'Chargers',
  // NFC East
  'Cowboys', 'Giants', 'Eagles', 'Commanders',
  // NFC North
  'Bears', 'Lions', 'Packers', 'Vikings',
  // NFC South
  'Falcons', 'Panthers', 'Saints', 'Buccaneers',
  // NFC West
  'Cardinals', '49ers', 'Seahawks', 'Rams'
]);

/**
 * College Football Power 5 + Top G5 Teams (sample)
 * Expand this based on your index contents
 */
const CFB_TEAMS = new Set([
  // SEC
  'Georgia', 'Alabama', 'LSU', 'Florida', 'Tennessee', 'Texas', 'Oklahoma', 
  'Texas A&M', 'Auburn', 'Ole Miss', 'Mississippi State', 'Arkansas', 
  'South Carolina', 'Kentucky', 'Vanderbilt', 'Missouri',
  // Big Ten
  'Ohio State', 'Michigan', 'Penn State', 'Wisconsin', 'Iowa', 'Nebraska',
  'Minnesota', 'Illinois', 'Northwestern', 'Purdue', 'Indiana', 'Michigan State',
  'Maryland', 'Rutgers', 'Oregon', 'Washington', 'USC', 'UCLA',
  // ACC
  'Clemson', 'Florida State', 'Miami', 'North Carolina', 'NC State',
  'Virginia Tech', 'Pittsburgh', 'Louisville', 'Wake Forest', 'Duke',
  'Virginia', 'Georgia Tech', 'Boston College', 'Syracuse',
  // Big 12
  'TCU', 'Baylor', 'Oklahoma State', 'Kansas State', 'Texas Tech',
  'West Virginia', 'Kansas', 'Iowa State', 'Cincinnati', 'UCF', 'BYU', 'Houston',
  // Pac-12 (remaining)
  'Utah', 'Arizona State', 'Arizona', 'Colorado', 'Stanford', 'Cal',
  'Washington State', 'Oregon State',
  // Top G5
  'Boise State', 'Memphis', 'Tulane', 'SMU', 'Fresno State', 'San Diego State',
  'Liberty', 'Coastal Carolina', 'App State'
]);

/**
 * Detect league from team name
 */
export function detectLeague(team?: string): League | null {
  if (!team) return null;
  const normalized = normalizeTeamName(team);
  if (NFL_TEAMS.has(normalized)) return 'nfl';
  if (CFB_TEAMS.has(normalized)) return 'cfb';
  return null;
}

/**
 * Normalize team name for comparison (handles abbreviations/variants)
 */
export function normalizeTeamName(team: string): string {
  const trim = team.trim();
  
  // NFL abbreviation map
  const nflAbbrMap: Record<string, string> = {
    'BAL': 'Ravens', 'BUF': 'Bills', 'CIN': 'Bengals', 'CLE': 'Browns',
    'DEN': 'Broncos', 'HOU': 'Texans', 'IND': 'Colts', 'JAX': 'Jaguars',
    'KC': 'Chiefs', 'LV': 'Raiders', 'LAC': 'Chargers', 'MIA': 'Dolphins',
    'NE': 'Patriots', 'NYJ': 'Jets', 'PIT': 'Steelers', 'TEN': 'Titans',
    'ATL': 'Falcons', 'CAR': 'Panthers', 'CHI': 'Bears', 'DAL': 'Cowboys',
    'DET': 'Lions', 'GB': 'Packers', 'LAR': 'Rams', 'MIN': 'Vikings',
    'NO': 'Saints', 'NYG': 'Giants', 'PHI': 'Eagles', 'SF': '49ers',
    'SEA': 'Seahawks', 'TB': 'Buccaneers', 'WSH': 'Commanders', 'ARI': 'Cardinals'
  };
  
  if (nflAbbrMap[trim.toUpperCase()]) {
    return nflAbbrMap[trim.toUpperCase()];
  }
  
  // CFB common abbreviations
  const cfbAbbrMap: Record<string, string> = {
    'OSU': 'Ohio State', 'UM': 'Michigan', 'PSU': 'Penn State',
    'UGA': 'Georgia', 'BAMA': 'Alabama', 'LSU': 'LSU',
    'FSU': 'Florida State', 'USC': 'USC', 'UCLA': 'UCLA',
    'OU': 'Oklahoma', 'UT': 'Texas', 'TAMU': 'Texas A&M'
  };
  
  if (cfbAbbrMap[trim.toUpperCase()]) {
    return cfbAbbrMap[trim.toUpperCase()];
  }
  
  return trim;
}

/**
 * Validate if team belongs to specified league
 */
export function isValidTeamForLeague(team: string, league: League): boolean {
  const normalized = normalizeTeamName(team);
  if (league === 'nfl') return NFL_TEAMS.has(normalized);
  if (league === 'cfb') return CFB_TEAMS.has(normalized);
  return false;
}

/**
 * Build league-specific query with disambiguation terms
 */
export function buildLeagueAwareQuery(ctx: LeagueContext): string {
  const parts: string[] = [];
  
  // Add league identifier for disambiguation
  if (ctx.league === 'nfl') {
    parts.push('NFL');
    if (ctx.week) parts.push(`Week ${ctx.week}`);
  } else {
    parts.push('College Football', 'NCAA');
  }
  
  // Add team context (strongest signal)
  if (ctx.team) {
    parts.push(ctx.team);
  }
  if (ctx.opponent) {
    parts.push(`vs ${ctx.opponent}`);
  }
  
  // Add player
  if (ctx.player) {
    parts.push(ctx.player);
  }
  
  // Add prop type context
  if (ctx.propType) {
    parts.push(ctx.propType.replace(/_/g, ' '));
  }
  
  return parts.join(' ');
}

/**
 * Build metadata filters for TwelveLabs search
 */
export function buildMetadataFilter(ctx: LeagueContext): Record<string, any> {
  const metadata: Record<string, any> = {
    league: ctx.league.toUpperCase()
  };
  
  if (ctx.season) metadata.season = ctx.season;
  if (ctx.week) metadata.week = ctx.week;
  if (ctx.team) metadata.team = normalizeTeamName(ctx.team);
  if (ctx.opponent) metadata.opponent = normalizeTeamName(ctx.opponent);
  
  return metadata;
}

/**
 * Post-search filter to remove cross-league contamination
 */
export function filterByLeague(results: any[], league: League, strictTeamMatch?: string): any[] {
  return results.filter(result => {
    const meta = result.metadata || {};
    
    // Check explicit league tag
    if (meta.league && meta.league.toLowerCase() !== league) {
      return false;
    }
    
    // Check team membership
    if (meta.team) {
      if (!isValidTeamForLeague(meta.team, league)) {
        return false;
      }
      
      // If strict team provided, must match
      if (strictTeamMatch && normalizeTeamName(meta.team) !== normalizeTeamName(strictTeamMatch)) {
        return false;
      }
    }
    
    if (meta.opponent && !isValidTeamForLeague(meta.opponent, league)) {
      return false;
    }
    
    // Title/transcript heuristics (backup)
    const text = [result.title, result.transcription, result.description].join(' ').toLowerCase();
    
    // NFL indicators
    const hasNflIndicators = /\b(nfl|week \d+|afc|nfc|super bowl)\b/i.test(text);
    // CFB indicators
    const hasCfbIndicators = /\b(college|ncaa|cfb|bowl game|conference)\b/i.test(text);
    
    if (league === 'nfl' && hasCfbIndicators && !hasNflIndicators) return false;
    if (league === 'cfb' && hasNflIndicators && !hasCfbIndicators) return false;
    
    return true;
  });
}

/**
 * Rank results by relevance to context
 */
export function rankByLeagueContext(results: any[], ctx: LeagueContext): any[] {
  return results.map(r => {
    let score = r.score || 0;
    const meta = r.metadata || {};
    
    // Boost for exact team match
    if (ctx.team && meta.team && normalizeTeamName(meta.team) === normalizeTeamName(ctx.team)) {
      score *= 1.5;
    }
    
    // Boost for opponent match
    if (ctx.opponent && meta.opponent && normalizeTeamName(meta.opponent) === normalizeTeamName(ctx.opponent)) {
      score *= 1.3;
    }
    
    // Boost for week match (NFL)
    if (ctx.league === 'nfl' && ctx.week && meta.week === ctx.week) {
      score *= 1.2;
    }
    
    // Boost for season match
    if (ctx.season && meta.season === ctx.season) {
      score *= 1.1;
    }
    
    return { ...r, adjustedScore: score };
  }).sort((a, b) => b.adjustedScore - a.adjustedScore);
}

/**
 * Helper: Get all teams for a league (for validation/autocomplete)
 */
export function getTeamsForLeague(league: League): string[] {
  return Array.from(league === 'nfl' ? NFL_TEAMS : CFB_TEAMS).sort();
}

/**
 * Helper: Validate context before search
 */
export function validateContext(ctx: LeagueContext): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!ctx.league) errors.push('League is required');
  if (ctx.league && !['nfl', 'cfb'].includes(ctx.league)) {
    errors.push(`Invalid league: ${ctx.league}`);
  }
  
  if (ctx.team && !isValidTeamForLeague(ctx.team, ctx.league)) {
    errors.push(`Team "${ctx.team}" not valid for ${ctx.league.toUpperCase()}`);
  }
  
  if (ctx.opponent && !isValidTeamForLeague(ctx.opponent, ctx.league)) {
    errors.push(`Opponent "${ctx.opponent}" not valid for ${ctx.league.toUpperCase()}`);
  }
  
  return { valid: errors.length === 0, errors };
}
