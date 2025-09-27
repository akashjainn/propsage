export type GameState = 'pre' | 'in' | 'post';

export interface TeamLite {
  id: string; // espn or cfbd id
  name: string; // Full name e.g. "Georgia Tech Yellow Jackets"
  short: string; // School name e.g. "Georgia Tech"
  abbrev: string; // e.g. "GT"
  logo?: string;
  color?: string; // hex without '#'
  rank?: number | null;
}

export interface VenueLite { name?: string; city?: string; state?: string; }
export interface BroadcastLite { network?: string; }

export interface GameLite {
  id: string;
  start: string;          // ISO
  state: GameState;       // pre/in/post
  home: TeamLite;
  away: TeamLite;
  venue?: VenueLite;
  broadcast?: BroadcastLite;
  period?: number;        // quarter when live
  clock?: string;         // display clock
  homeScore?: number;
  awayScore?: number;
}

export interface GamesForTeamResponse { games: GameLite[]; }