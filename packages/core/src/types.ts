export interface PlayerPrior {
  playerId: string
  market: string
  mu: number
  sigma: number
  updatedAt: string
}

export interface NewsEvidence {
  id: string
  playerId: string
  market: string
  text: string
  source: string
  url: string
  weight: number // 0..1
  deltaMu: number // additive shift in mean if fully applied
  deltaSigma: number // fractional variance shift if fully applied
  timestamp: string
}

export interface PricingResult {
  marketLine: number
  fairLine: number
  edge: number
  mu: number
  sigma: number
  confidenceInterval: [number, number]
  evidenceApplied: NewsEvidence[]
  simulations: number
  pOver: number
}

// Real-time Data Types (Phase 0 Foundation)
export interface PropOffer {
  id: string;
  gameId: string;
  playerId: string;
  playerName: string;
  team: string;
  position: string;
  market: PropMarket;
  book: Sportsbook;
  line: number;
  overPrice: number; // American odds
  underPrice: number;
  impliedProb: number;
  fairLine?: number;
  edge?: number;
  confidence?: number;
  lastUpdated: string;
  isLive: boolean;
}

export interface OddsSnapshot {
  id: string;
  propOfferId: string;
  line: number;
  overPrice: number;
  underPrice: number;
  timestamp: string;
  volume?: number;
}

export interface LiveEvent {
  type: 'odds_update' | 'game_state' | 'prop_line_move' | 'market_suspension';
  gameId: string;
  data: any;
  timestamp: string;
}

export interface LineMovement {
  propOfferId: string;
  fromLine: number;
  toLine: number;
  fromOdds: number;
  toOdds: number;
  magnitude: number;
  velocity: number; // movement per minute
  direction: 'up' | 'down';
  timestamp: string;
}

export interface ConsensusMetrics {
  avgLine: number;
  lineSpread: number;
  avgPrice: number;
  priceSpread: number;
  outliers: PropOffer[];
  agreement: number; // 0-1 scale
}

export type PropMarket = 
  | 'passing_yards' | 'rushing_yards' | 'receiving_yards' 
  | 'passing_tds' | 'rushing_tds' | 'receptions'
  | 'points' | 'rebounds' | 'assists' // NBA
  | 'goals' | 'saves'; // Hockey

export type Sportsbook = 'draftkings' | 'fanduel' | 'caesars' | 'betmgm' | 'espnbet';

// Data Provider Interface
export interface GameLite {
  id: string;
  start: string;
  state: 'pre' | 'in' | 'post';
  home: { id: string; name: string; short: string; abbrev: string; };
  away: { id: string; name: string; short: string; abbrev: string; };
  homeScore?: number;
  awayScore?: number;
  period?: number;
  clock?: string;
}

export interface LiveDataProvider {
  getGames(params: GameQuery): Promise<GameLite[]>;
  getPropOffers(gameId: string): Promise<PropOffer[]>;
  getOddsSnapshots(gameId: string): Promise<OddsSnapshot[]>;
  subscribeGame(gameId: string, callback: (event: LiveEvent) => void): () => void;
}

export interface GameQuery {
  status?: 'pre' | 'in' | 'post' | 'all';
  leagues?: string[];
  date?: string;
  limit?: number;
}
