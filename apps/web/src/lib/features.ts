export const FEATURES = {
  video: process.env.NEXT_PUBLIC_VIDEO_ENABLED === 'true',
  tl: process.env.NEXT_PUBLIC_FEATURE_TL === 'true',
  topEdges: process.env.NEXT_PUBLIC_FEATURE_TOP_EDGES !== 'false', // default on
};

// Support both server-side and client-side env patterns for maximum compatibility
export const TL_INDEX = 
  process.env.NEXT_PUBLIC_TWELVELABS_INDEX_ID || 
  process.env.TWELVELABS_INDEX_ID || 
  '';
