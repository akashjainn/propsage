# PropSage Real-Time Enhancement Plan
## From Mock Data to Live Sports Betting Analytics Platform

**Current State**: 3 mock games with static data  
**Target State**: Real-time multi-league prop analysis with live odds, line movement, and AI-powered edge detection

---

## 🎯 **Phase 0: Foundations & Architecture** *(Week 1)*

### 1. Feature Flag System
```typescript
// apps/web/src/lib/features.ts - ENHANCED
export const FEATURES = {
  // Existing
  TWELVELABS_ENABLED: process.env.NEXT_PUBLIC_FEATURE_TL === 'true',
  
  // New Real-time Features
  REALTIME_ENABLED: process.env.NEXT_PUBLIC_RT_ENABLED === 'true',
  LIVE_ODDS_ENABLED: process.env.NEXT_PUBLIC_LIVE_ODDS === 'true',
  WEBSOCKET_ENABLED: process.env.NEXT_PUBLIC_WS_ENABLED === 'true',
  
  // Data Sources
  ODDS_PROVIDERS: (process.env.NEXT_PUBLIC_ODDS_PROVIDERS || 'draftkings,fanduel').split(','),
  SUPPORTED_LEAGUES: (process.env.NEXT_PUBLIC_LEAGUES || 'cfb,nfl,nba').split(','),
  
  // Performance & Limits
  MAX_CONCURRENT_GAMES: parseInt(process.env.NEXT_PUBLIC_MAX_GAMES || '10'),
  UPDATE_INTERVAL_MS: parseInt(process.env.NEXT_PUBLIC_UPDATE_INTERVAL || '5000'),
} as const;
```

### 2. Enhanced Type System
```typescript
// packages/core/src/types/realtime.ts - NEW
export interface LiveDataProvider {
  getGames(params: GameQuery): Promise<GameLite[]>;
  getPropOffers(gameId: string): Promise<PropOffer[]>;
  getOddsSnapshots(gameId: string): Promise<OddsSnapshot[]>;
  subscribeGame(gameId: string, callback: (event: LiveEvent) => void): () => void;
}

export interface PropOffer {
  id: string;
  gameId: string;
  playerId: string;
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

export type PropMarket = 
  | 'passing_yards' | 'rushing_yards' | 'receiving_yards' 
  | 'passing_tds' | 'rushing_tds' | 'receptions'
  | 'points' | 'rebounds' | 'assists'; // NBA

export type Sportsbook = 'draftkings' | 'fanduel' | 'caesars' | 'betmgm' | 'espnbet';
```

### 3. Data Provider Architecture
```typescript
// packages/core/src/providers/LiveDataProvider.ts - NEW
export abstract class BaseLiveDataProvider implements LiveDataProvider {
  protected rateLimiter: RateLimiter;
  protected cache: Map<string, any> = new Map();
  
  abstract getGames(params: GameQuery): Promise<GameLite[]>;
  abstract getPropOffers(gameId: string): Promise<PropOffer[]>;
  abstract getOddsSnapshots(gameId: string): Promise<OddsSnapshot[]>;
  abstract subscribeGame(gameId: string, callback: (event: LiveEvent) => void): () => void;
  
  protected withCache<T>(key: string, fetcher: () => Promise<T>, ttl: number): Promise<T> {
    // Cache implementation with TTL
  }
}

// Mock Provider (current)
export class MockDataProvider extends BaseLiveDataProvider {
  // Your existing mock data logic
}

// The Odds API Provider
export class TheOddsAPIProvider extends BaseLiveDataProvider {
  private apiKey: string;
  private baseUrl = 'https://api.the-odds-api.com/v4';
  
  async getGames(params: GameQuery): Promise<GameLite[]> {
    // Fetch from The Odds API
  }
  
  async getPropOffers(gameId: string): Promise<PropOffer[]> {
    // Fetch prop odds
  }
}
```

---

## 📊 **Phase 1: Live Data Ingestion** *(Week 2)*

### 1. Database Schema Enhancement
```sql
-- db/migrations/002_realtime_schema.sql - NEW
CREATE TABLE IF NOT EXISTS games_live (
  id VARCHAR PRIMARY KEY,
  league VARCHAR NOT NULL,
  status VARCHAR NOT NULL, -- 'scheduled', 'live', 'final'
  start_time TIMESTAMP NOT NULL,
  home_team_id VARCHAR NOT NULL,
  away_team_id VARCHAR NOT NULL,
  home_score INTEGER,
  away_score INTEGER,
  period INTEGER,
  clock VARCHAR,
  provider_game_id VARCHAR,
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prop_offers (
  id VARCHAR PRIMARY KEY,
  game_id VARCHAR NOT NULL REFERENCES games_live(id),
  player_id VARCHAR NOT NULL,
  market VARCHAR NOT NULL,
  book VARCHAR NOT NULL,
  line_numeric DECIMAL(10,2) NOT NULL,
  over_price INTEGER NOT NULL, -- American odds
  under_price INTEGER NOT NULL,
  implied_prob DECIMAL(5,4),
  fair_line DECIMAL(10,2),
  edge DECIMAL(5,4),
  confidence_score DECIMAL(3,2),
  is_live BOOLEAN DEFAULT TRUE,
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(game_id, player_id, market, book)
);

CREATE TABLE IF NOT EXISTS odds_snapshots (
  id SERIAL PRIMARY KEY,
  prop_offer_id VARCHAR NOT NULL REFERENCES prop_offers(id),
  line_numeric DECIMAL(10,2) NOT NULL,
  over_price INTEGER NOT NULL,
  under_price INTEGER NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  volume INTEGER DEFAULT 0,
  
  INDEX idx_snapshots_prop_time (prop_offer_id, timestamp)
);

CREATE TABLE IF NOT EXISTS line_movements (
  id SERIAL PRIMARY KEY,
  prop_offer_id VARCHAR NOT NULL REFERENCES prop_offers(id),
  from_line DECIMAL(10,2) NOT NULL,
  to_line DECIMAL(10,2) NOT NULL,
  from_odds INTEGER NOT NULL,
  to_odds INTEGER NOT NULL,
  movement_size DECIMAL(5,4) NOT NULL, -- abs(to_line - from_line)
  velocity DECIMAL(10,6), -- movement per minute
  timestamp TIMESTAMP NOT NULL,
  
  INDEX idx_movements_prop_time (prop_offer_id, timestamp)
);
```

### 2. Real-time Ingest Service
```typescript
// apps/api/src/services/LiveIngestService.ts - NEW
export class LiveIngestService {
  private provider: LiveDataProvider;
  private db: Database;
  private redis: Redis;
  private scheduler: BullQueue;
  
  constructor(provider: LiveDataProvider) {
    this.provider = provider;
    this.setupScheduler();
  }
  
  private setupScheduler() {
    // Pre-game: Every 60 seconds
    this.scheduler.add('ingest-pregame', {}, { 
      repeat: { cron: '*/60 * * * * *' },
      jobId: 'pregame-ingest'
    });
    
    // Live games: Every 5 seconds
    this.scheduler.add('ingest-live', {}, { 
      repeat: { cron: '*/5 * * * * *' },
      jobId: 'live-ingest'
    });
  }
  
  async ingestGames(timeWindow: 'pregame' | 'live' | 'all') {
    const games = await this.provider.getGames({ 
      status: timeWindow === 'live' ? 'in' : 'all',
      leagues: FEATURES.SUPPORTED_LEAGUES 
    });
    
    for (const game of games) {
      await this.upsertGame(game);
      if (game.state === 'in' || timeWindow === 'pregame') {
        await this.ingestGameProps(game.id);
      }
    }
  }
  
  private async upsertGame(game: GameLite) {
    await this.db.query(`
      INSERT INTO games_live (id, league, status, start_time, home_team_id, away_team_id, home_score, away_score, period, clock, last_updated)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        home_score = EXCLUDED.home_score,
        away_score = EXCLUDED.away_score,
        period = EXCLUDED.period,
        clock = EXCLUDED.clock,
        last_updated = NOW()
    `, [game.id, 'cfb', game.state, game.start, game.home.id, game.away.id, 
        game.homeScore, game.awayScore, game.period, game.clock]);
  }
  
  private async ingestGameProps(gameId: string) {
    const props = await this.provider.getPropOffers(gameId);
    
    for (const prop of props) {
      const existing = await this.getExistingProp(prop);
      
      // Calculate fair line and edge using your Monte Carlo
      const { fairLine, edge, confidenceInterval } = await this.calculateFairValue(prop);
      
      // Upsert prop offer
      await this.upsertPropOffer({
        ...prop,
        fairLine,
        edge,
        confidence: this.calculateConfidence(confidenceInterval)
      });
      
      // Track line movement
      if (existing && existing.line !== prop.line) {
        await this.recordLineMovement(existing, prop);
      }
      
      // Cache for real-time delivery
      await this.redis.setex(`prop:${prop.id}`, 30, JSON.stringify(prop));
    }
  }
  
  private async calculateFairValue(prop: PropOffer) {
    // Use your existing Monte Carlo from packages/core
    const { monteCarloFairValue } = await import('@propsage/core');
    
    const prior = await this.getPriorForPlayer(prop.playerId, prop.market);
    const evidence = await this.getEvidenceForPlayer(prop.playerId, prop.market);
    
    return monteCarloFairValue({
      marketLine: prop.line,
      prior,
      evidence,
      simulations: 10000
    });
  }
}
```

### 3. WebSocket Real-time Delivery
```typescript
// apps/api/src/services/RealtimeService.ts - NEW
export class RealtimeService {
  private io: SocketIOServer;
  private redis: Redis;
  
  constructor(server: Server) {
    this.io = new SocketIOServer(server, {
      cors: { origin: process.env.WEB_URL || "http://localhost:3000" }
    });
    
    this.setupSocketHandlers();
    this.setupRedisSubscriptions();
  }
  
  private setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);
      
      socket.on('subscribe:game', (gameId: string) => {
        socket.join(`game:${gameId}`);
        console.log(`Socket ${socket.id} subscribed to game:${gameId}`);
      });
      
      socket.on('subscribe:league', (league: string) => {
        socket.join(`league:${league}`);
      });
      
      socket.on('unsubscribe:game', (gameId: string) => {
        socket.leave(`game:${gameId}`);
      });
      
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }
  
  private setupRedisSubscriptions() {
    // Listen for prop updates
    this.redis.subscribe('prop_update', 'game_update', 'line_movement');
    
    this.redis.on('message', (channel, message) => {
      const data = JSON.parse(message);
      
      switch (channel) {
        case 'prop_update':
          this.io.to(`game:${data.gameId}`).emit('prop_update', data);
          break;
        case 'line_movement':
          this.io.to(`game:${data.gameId}`).emit('line_movement', data);
          break;
        case 'game_update':
          this.io.to(`game:${data.gameId}`).emit('game_update', data);
          break;
      }
    });
  }
  
  broadcastPropUpdate(gameId: string, propUpdate: PropOffer) {
    this.io.to(`game:${gameId}`).emit('prop_update', {
      type: 'prop_update',
      gameId,
      prop: propUpdate,
      timestamp: new Date().toISOString()
    });
  }
  
  broadcastLineMovement(gameId: string, movement: LineMovement) {
    this.io.to(`game:${gameId}`).emit('line_movement', {
      type: 'line_movement',
      gameId,
      movement,
      timestamp: new Date().toISOString()
    });
  }
}
```

---

## 🔄 **Phase 2: Frontend Real-time Integration** *(Week 3)*

### 1. WebSocket Hook
```typescript
// apps/web/src/hooks/useRealtimeData.ts - NEW
export function useRealtimeData(gameId: string | null) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [latency, setLatency] = useState<number>(0);
  
  useEffect(() => {
    if (!FEATURES.WEBSOCKET_ENABLED || !gameId) return;
    
    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000');
    
    newSocket.on('connect', () => {
      setConnected(true);
      newSocket.emit('subscribe:game', gameId);
    });
    
    newSocket.on('disconnect', () => {
      setConnected(false);
    });
    
    // Measure latency
    const pingInterval = setInterval(() => {
      const start = Date.now();
      newSocket.emit('ping', start, (response: number) => {
        setLatency(Date.now() - response);
      });
    }, 10000);
    
    setSocket(newSocket);
    
    return () => {
      clearInterval(pingInterval);
      newSocket.emit('unsubscribe:game', gameId);
      newSocket.disconnect();
    };
  }, [gameId]);
  
  const subscribe = useCallback((event: string, handler: (data: any) => void) => {
    if (!socket) return () => {};
    
    socket.on(event, handler);
    return () => socket.off(event, handler);
  }, [socket]);
  
  return { socket, connected, latency, subscribe };
}
```

### 2. Enhanced Props Grid with Live Updates
```typescript
// apps/web/src/components/LivePropsGrid.tsx - NEW
export const LivePropsGrid = React.memo(function LivePropsGrid({ 
  gameId, 
  onPropClick 
}: { 
  gameId: string; 
  onPropClick: (prop: PropOffer) => void; 
}) {
  const [props, setProps] = useState<PropOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { subscribe, connected, latency } = useRealtimeData(gameId);
  
  // Initial data fetch
  useEffect(() => {
    const fetchProps = async () => {
      try {
        const response = await fetch(`/api/games/${gameId}/props/live`);
        const data = await response.json();
        setProps(data.props);
        setLastUpdate(new Date());
      } catch (error) {
        console.error('Failed to fetch props:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProps();
  }, [gameId]);
  
  // Real-time updates
  useEffect(() => {
    if (!connected) return;
    
    const unsubscribePropUpdate = subscribe('prop_update', (data: { prop: PropOffer }) => {
      setProps(prev => {
        const updated = [...prev];
        const index = updated.findIndex(p => p.id === data.prop.id);
        if (index >= 0) {
          updated[index] = data.prop;
        } else {
          updated.push(data.prop);
        }
        return updated;
      });
      setLastUpdate(new Date());
    });
    
    const unsubscribeLineMovement = subscribe('line_movement', (data: { movement: LineMovement }) => {
      // Handle line movement visualization
      console.log('Line movement:', data.movement);
    });
    
    return () => {
      unsubscribePropUpdate();
      unsubscribeLineMovement();
    };
  }, [connected, subscribe]);
  
  if (loading) {
    return <PropsGridSkeleton />;
  }
  
  return (
    <div className="space-y-4">
      {/* Live Status Bar */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-1 ${connected ? 'text-green-600' : 'text-red-600'}`}>
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>{connected ? 'Live' : 'Disconnected'}</span>
          </div>
          {connected && (
            <>
              <span>Latency: {latency}ms</span>
              <span>Last update: {lastUpdate ? formatDistanceToNow(lastUpdate) + ' ago' : 'Never'}</span>
            </>
          )}
        </div>
        <span>{props.length} props</span>
      </div>
      
      {/* Props Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {props.map((prop) => (
          <LivePropCard
            key={prop.id}
            prop={prop}
            onPropClick={onPropClick}
          />
        ))}
      </div>
    </div>
  );
});
```

### 3. Live Prop Card with Movement Indicators
```typescript
// apps/web/src/components/LivePropCard.tsx - NEW
export const LivePropCard = React.memo(function LivePropCard({ 
  prop, 
  onPropClick 
}: { 
  prop: PropOffer; 
  onPropClick: (prop: PropOffer) => void; 
}) {
  const [previousLine, setPreviousLine] = useState<number>(prop.line);
  const [movement, setMovement] = useState<'up' | 'down' | null>(null);
  
  useEffect(() => {
    if (prop.line !== previousLine) {
      setMovement(prop.line > previousLine ? 'up' : 'down');
      setPreviousLine(prop.line);
      
      // Clear movement indicator after 3 seconds
      const timer = setTimeout(() => setMovement(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [prop.line, previousLine]);
  
  const edgeColor = prop.edge && prop.edge > 0 ? 'text-green-600' : 'text-red-600';
  const edgeBg = prop.edge && prop.edge > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
  
  return (
    <button
      onClick={() => onPropClick(prop)}
      className={`
        relative p-6 rounded-xl border-2 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg text-left
        ${movement ? 'ring-2 ring-blue-400 ring-opacity-75' : ''}
        border-gray-200 bg-white hover:border-gray-300
      `}
    >
      {/* Movement Indicator */}
      {movement && (
        <div className={`absolute top-2 right-2 p-1 rounded-full ${
          movement === 'up' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
        }`}>
          {movement === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        </div>
      )}
      
      {/* Player Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg text-gray-900">{prop.playerName}</h3>
          <p className="text-sm text-gray-500">{prop.position} • {prop.team}</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500 mb-1">Book</div>
          <div className="text-sm font-medium text-gray-700 uppercase">{prop.book}</div>
        </div>
      </div>

      {/* Market Details */}
      <div className="mb-4">
        <div className="text-sm text-gray-600 mb-1">{formatMarket(prop.market)}</div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500">Line:</span>
            <span className={`ml-1 font-medium ${movement ? 'font-bold' : ''}`}>
              {prop.line}
            </span>
          </div>
          <div>
            <span className="text-xs text-gray-500">Fair:</span>
            <span className="ml-1 font-medium">{prop.fairLine?.toFixed(1) || 'N/A'}</span>
          </div>
        </div>
        <div className="flex items-center justify-between mt-1">
          <div>
            <span className="text-xs text-gray-500">Over:</span>
            <span className="ml-1 text-sm">{formatOdds(prop.overPrice)}</span>
          </div>
          <div>
            <span className="text-xs text-gray-500">Under:</span>
            <span className="ml-1 text-sm">{formatOdds(prop.underPrice)}</span>
          </div>
        </div>
      </div>

      {/* Edge Display */}
      {prop.edge && (
        <div className={`flex items-center justify-center py-3 px-4 rounded-lg border ${edgeBg}`}>
          {prop.edge > 0 ? (
            <TrendingUp className="w-4 h-4 mr-2 text-green-600" />
          ) : (
            <TrendingDown className="w-4 h-4 mr-2 text-red-600" />
          )}
          <span className={`font-bold text-lg ${edgeColor}`}>
            {prop.edge > 0 ? '+' : ''}{(prop.edge * 100).toFixed(1)}%
          </span>
        </div>
      )}
      
      {/* Live Indicator */}
      {prop.isLive && (
        <div className="absolute bottom-2 left-2 flex items-center space-x-1 text-xs text-green-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>LIVE</span>
        </div>
      )}
    </button>
  );
});
```

---

## 📈 **Phase 3: Advanced Analytics** *(Week 4)*

### 1. Line Movement Analytics
```typescript
// packages/core/src/analytics/LineMovement.ts - NEW
export class LineMovementAnalyzer {
  static calculateVelocity(snapshots: OddsSnapshot[]): number {
    if (snapshots.length < 2) return 0;
    
    const sorted = snapshots.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    
    const lineChange = Math.abs(last.line_numeric - first.line_numeric);
    const timeChange = (new Date(last.timestamp).getTime() - new Date(first.timestamp).getTime()) / (1000 * 60); // minutes
    
    return timeChange > 0 ? lineChange / timeChange : 0;
  }
  
  static detectSignificantMovement(snapshots: OddsSnapshot[], thresholds = {
    minLineMove: 0.5,
    minTimeWindow: 5, // minutes
    significantMove: 1.0
  }): SignificantMovement[] {
    const movements: SignificantMovement[] = [];
    
    for (let i = 1; i < snapshots.length; i++) {
      const prev = snapshots[i - 1];
      const curr = snapshots[i];
      
      const lineMove = Math.abs(curr.line_numeric - prev.line_numeric);
      const timeWindow = (new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime()) / (1000 * 60);
      
      if (lineMove >= thresholds.minLineMove && timeWindow >= thresholds.minTimeWindow) {
        movements.push({
          from: prev,
          to: curr,
          magnitude: lineMove,
          velocity: lineMove / timeWindow,
          isSignificant: lineMove >= thresholds.significantMove,
          direction: curr.line_numeric > prev.line_numeric ? 'up' : 'down'
        });
      }
    }
    
    return movements;
  }
  
  static calculateConsensus(propOffers: PropOffer[]): ConsensusMetrics {
    if (propOffers.length === 0) return null;
    
    const lines = propOffers.map(p => p.line);
    const prices = propOffers.map(p => p.overPrice);
    
    return {
      avgLine: lines.reduce((a, b) => a + b, 0) / lines.length,
      lineSpread: Math.max(...lines) - Math.min(...lines),
      avgPrice: prices.reduce((a, b) => a + b, 0) / prices.length,  
      priceSpread: Math.max(...prices) - Math.min(...prices),
      outliers: this.findOutliers(propOffers),
      agreement: this.calculateAgreement(lines)
    };
  }
  
  private static findOutliers(props: PropOffer[]): PropOffer[] {
    const lines = props.map(p => p.line);
    const q1 = this.quantile(lines, 0.25);
    const q3 = this.quantile(lines, 0.75);
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    return props.filter(p => p.line < lowerBound || p.line > upperBound);
  }
}
```

### 2. Enhanced Pricing with Market Context
```typescript
// packages/core/src/pricing/MarketContextPricing.ts - NEW
export class MarketContextPricing {
  static enhanceWithMarketContext(
    basePricing: PricingResult,
    marketContext: {
      consensus: ConsensusMetrics;
      movements: SignificantMovement[];
      volume?: number;
      impliedProbabilities: number[];
    }
  ): EnhancedPricingResult {
    
    // Adjust confidence based on market agreement
    const agreementBonus = marketContext.consensus.agreement > 0.8 ? 0.1 : 0;
    const volumeBonus = marketContext.volume && marketContext.volume > 1000 ? 0.05 : 0;
    
    // Penalize confidence if there's significant recent movement
    const movementPenalty = marketContext.movements
      .filter(m => m.isSignificant && this.isRecent(m, 30)) // 30 minutes
      .length * 0.05;
    
    const adjustedConfidence = Math.max(0, Math.min(1, 
      basePricing.confidence + agreementBonus + volumeBonus - movementPenalty
    ));
    
    // Calculate market-implied fair value
    const marketImpliedFair = this.calculateMarketImpliedFair(
      marketContext.impliedProbabilities,
      basePricing.marketLine
    );
    
    // Blend model fair with market fair
    const blendedFair = this.blendFairValues(
      basePricing.fairLine,
      marketImpliedFair,
      adjustedConfidence
    );
    
    return {
      ...basePricing,
      fairLine: blendedFair,
      edge: this.calculateEdge(basePricing.marketLine, blendedFair),
      confidence: adjustedConfidence,
      marketContext: {
        consensus: marketContext.consensus,
        recentMovements: marketContext.movements.filter(m => this.isRecent(m, 60)),
        impliedFair: marketImpliedFair,
        modelWeight: adjustedConfidence,
        marketWeight: 1 - adjustedConfidence
      }
    };
  }
  
  private static calculateMarketImpliedFair(
    impliedProbs: number[], 
    marketLine: number
  ): number {
    // Remove vig and calculate consensus probability
    const avgImplied = impliedProbs.reduce((a, b) => a + b, 0) / impliedProbs.length;
    const viglessProb = avgImplied / (avgImplied + (1 - avgImplied)); // Simplified vig removal
    
    // Convert back to fair line (this is sport/market specific)
    return this.probabilityToLine(viglessProb, marketLine);
  }
  
  private static blendFairValues(
    modelFair: number, 
    marketFair: number, 
    modelConfidence: number
  ): number {
    return modelFair * modelConfidence + marketFair * (1 - modelConfidence);
  }
}
```

---

## 🚀 **Phase 4: Production Deployment** *(Week 5)*

### 1. Environment Configuration
```bash
# .env.production - NEW
# Data Sources
THE_ODDS_API_KEY=your_api_key_here
ODDS_PROVIDERS=draftkings,fanduel,caesars,betmgm
SUPPORTED_LEAGUES=cfb,nfl,nba,mlb

# Real-time Features
NEXT_PUBLIC_RT_ENABLED=true
NEXT_PUBLIC_LIVE_ODDS=true  
NEXT_PUBLIC_WS_ENABLED=true
NEXT_PUBLIC_UPDATE_INTERVAL=5000
NEXT_PUBLIC_MAX_GAMES=20

# Database
DATABASE_URL=postgresql://user:pass@host:5432/propsage_prod
REDIS_URL=redis://host:6379

# Performance
RATE_LIMIT_REQUESTS_PER_MINUTE=1000
CACHE_TTL_SECONDS=30
MAX_CONCURRENT_INGESTS=5

# Monitoring
SENTRY_DSN=your_sentry_dsn
ANALYTICS_ENABLED=true
```

### 2. Monitoring & Observability
```typescript
// apps/api/src/monitoring/metrics.ts - NEW
export class MetricsCollector {
  private prometheus = require('prom-client');
  
  private ingestLatency = new this.prometheus.Histogram({
    name: 'propsage_ingest_duration_seconds',
    help: 'Time taken to ingest data',
    labelNames: ['provider', 'league', 'status']
  });
  
  private propsProcessed = new this.prometheus.Counter({
    name: 'propsage_props_processed_total',
    help: 'Total props processed',
    labelNames: ['provider', 'league']
  });
  
  private wsConnections = new this.prometheus.Gauge({
    name: 'propsage_websocket_connections',
    help: 'Current WebSocket connections'
  });
  
  private edgeCalculations = new this.prometheus.Histogram({
    name: 'propsage_edge_calculation_duration_seconds',
    help: 'Time taken to calculate edge',
    labelNames: ['market_type']
  });
  
  recordIngestLatency(provider: string, league: string, status: string, duration: number) {
    this.ingestLatency.labels(provider, league, status).observe(duration);
  }
  
  incrementPropsProcessed(provider: string, league: string) {
    this.propsProcessed.labels(provider, league).inc();
  }
  
  setWebSocketConnections(count: number) {
    this.wsConnections.set(count);
  }
  
  recordEdgeCalculation(marketType: string, duration: number) {
    this.edgeCalculations.labels(marketType).observe(duration);
  }
}
```

### 3. Performance Optimizations
```typescript
// apps/web/src/components/optimized/VirtualizedPropsGrid.tsx - NEW
import { useVirtualizer } from '@tanstack/react-virtual';

export const VirtualizedPropsGrid = React.memo(function VirtualizedPropsGrid({
  props,
  onPropClick
}: {
  props: PropOffer[];
  onPropClick: (prop: PropOffer) => void;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: props.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 240, // Estimated prop card height
    overscan: 5
  });
  
  return (
    <div 
      ref={parentRef}
      className="h-[600px] overflow-auto"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative'
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const prop = props[virtualItem.index];
          
          return (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`
              }}
            >
              <LivePropCard
                prop={prop}
                onPropClick={onPropClick}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
});
```

---

## 📋 **Implementation Checklist**

### Week 1: Foundations
- [ ] Set up feature flags for real-time features
- [ ] Create enhanced type system (PropOffer, OddsSnapshot, etc.)
- [ ] Implement LiveDataProvider interface
- [ ] Create MockDataProvider and TheOddsAPIProvider
- [ ] Design database schema for live data

### Week 2: Data Ingestion  
- [ ] Implement LiveIngestService with BullMQ scheduler
- [ ] Set up Redis for caching and pub/sub
- [ ] Create rate limiting and error handling
- [ ] Implement fair value calculation integration
- [ ] Add line movement tracking

### Week 3: Real-time Frontend
- [ ] Create WebSocket service and hooks
- [ ] Build LivePropsGrid with real-time updates
- [ ] Implement movement indicators and animations
- [ ] Add connection status and latency monitoring
- [ ] Create virtualized views for performance

### Week 4: Analytics & Intelligence
- [ ] Implement line movement analysis
- [ ] Create consensus and outlier detection  
- [ ] Build market context pricing
- [ ] Add confidence scoring with market factors
- [ ] Create trend detection algorithms

### Week 5: Production & Monitoring
- [ ] Set up monitoring and metrics collection
- [ ] Implement performance optimizations
- [ ] Add error boundaries and fallbacks
- [ ] Create deployment configuration
- [ ] Set up alerts and dashboards

---

## 🎯 **Success Metrics**

**Performance KPIs:**
- Data latency: <3s from source to UI
- 99.9% uptime during live games
- <100ms WebSocket message delivery
- Support 50+ concurrent games

**User Experience:**
- Real-time prop updates with smooth animations
- Line movement visualization
- Market consensus insights
- Historical trend analysis

**Business Intelligence:**
- Edge detection accuracy >70%
- Market outlier identification
- Volume and movement correlation
- Multi-book arbitrage opportunities

This plan transforms PropSage from a demo into a production-ready real-time sports betting analytics platform while maintaining your existing UX and leveraging your Monte Carlo pricing engine! 🚀