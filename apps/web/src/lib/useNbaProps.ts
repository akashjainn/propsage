import { useState, useEffect } from 'react';
import { API_BASE } from './api';

export interface PropData {
  propId: string;
  playerId: string;
  playerName: string;
  team: string;
  stat: string;
  book: string;
  marketLine: number;
  fairLine: number;
  edgePct: number;
  confidence?: number;
  updatedAt: string;
}

export interface PropDetail extends PropData {
  history: Array<{
    t: string;
    market: number;
    fair: number;
  }>;
}

export interface PropsResponse {
  player: {
    id: string;
    name: string;
    team: string;
    position?: string;
  };
  props: PropData[];
}

export function useNbaProps(playerId: string | null) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PropsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!playerId) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/nba/props?playerId=${encodeURIComponent(playerId)}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then((result: PropsResponse) => {
        setData(result);
      })
      .catch(err => {
        console.error('Failed to fetch props:', err);
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [playerId]);

  return { loading, data, error };
}

export function usePropDetail(propId: string | null) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PropDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!propId) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/nba/props/${encodeURIComponent(propId)}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then((result: PropDetail) => {
        setData(result);
      })
      .catch(err => {
        console.error('Failed to fetch prop detail:', err);
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [propId]);

  return { loading, data, error };
}