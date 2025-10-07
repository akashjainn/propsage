export const FEATURES = {
  // Existing Features
  video: process.env.NEXT_PUBLIC_VIDEO_ENABLED === 'true',
  tl: process.env.NEXT_PUBLIC_FEATURE_TL === 'true',
  topEdges: process.env.NEXT_PUBLIC_FEATURE_TOP_EDGES !== 'false', // default on
  
  // Real-time Features (Phase 0 Foundation)
  realtime: process.env.NEXT_PUBLIC_RT_ENABLED === 'true',
  liveOdds: process.env.NEXT_PUBLIC_LIVE_ODDS === 'true',
  websocket: process.env.NEXT_PUBLIC_WS_ENABLED === 'true',
  
  // Data Sources Configuration  
  oddsProviders: (process.env.NEXT_PUBLIC_ODDS_PROVIDERS || 'draftkings,fanduel').split(','),
  supportedLeagues: (process.env.NEXT_PUBLIC_LEAGUES || 'cfb,nfl,nba').split(','),
  
  // Performance Limits
  maxConcurrentGames: parseInt(process.env.NEXT_PUBLIC_MAX_GAMES || '10'),
  updateIntervalMs: parseInt(process.env.NEXT_PUBLIC_UPDATE_INTERVAL || '5000'),
  
  // Development Flags
  mockRealtimeData: process.env.NODE_ENV === 'development' && process.env.MOCK_REALTIME === 'true',
} as const;

// Feature flag helper
export const isFeatureEnabled = (feature: keyof typeof FEATURES): boolean => {
  const value = FEATURES[feature];
  return typeof value === 'boolean' ? value : Boolean(value);
};

// Support both server-side and client-side env patterns for maximum compatibility
export const TL_INDEX = 
  process.env.NEXT_PUBLIC_TWELVELABS_INDEX_ID || 
  process.env.TWELVELABS_INDEX_ID || 
  '';
