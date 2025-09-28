export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export function apiUrl(path: string) {
  return `${API_BASE}${path.startsWith('/') ? path : '/' + path}`
}

// Safe fetch utility to prevent 404 spam in console
export async function safeFetch<T>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return r.json();
  } catch { 
    return null; 
  }
}

// Correct API endpoints
export const ENDPOINTS = {
  gamesToday: "/api/cfb/games/today",
  gamesForTeam: (q: string) => `/api/cfb/games/for-team?q=${encodeURIComponent(q)}`,
  insightsForGame: (gameId: string) => `/api/insights/${encodeURIComponent(gameId)}`,
  clipsSearch: "/api/clips/search",
  videoProxy: (clipId: string) => `/api/video/clip/${clipId}`,
  thumbProxy: (clipId: string) => `/api/thumb/${clipId}`,
};