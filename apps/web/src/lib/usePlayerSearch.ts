import { useEffect, useState } from "react";
import { API_BASE } from "./api";

export interface Player {
  id: string;
  sport: "NBA";
  name: string;
  firstName?: string;
  lastName?: string;
  team?: string;
  position?: string;
  aliases?: string[];
  externalIds: { balldontlie: number };
}

export function usePlayerSearch() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Player[]>([]);

  useEffect(() => {
    if (!q || q.length < 2) { 
      setResults([]);
      return; 
    }
    
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/players?q=${encodeURIComponent(q)}`);
        if (response.ok) {
          const json = await response.json();
          const playerList = json.players || json || [];
          setResults(Array.isArray(playerList) ? playerList : []);
        } else {
          console.warn("Player search failed:", response.status);
          setResults([]);
        }
      } catch (error) {
        console.error("Player search error:", error);
        setResults([]);
      } finally { 
        setLoading(false); 
      }
    }, 250); // 250ms debounce
    
    return () => clearTimeout(timeout);
  }, [q]);

  return { q, setQ, loading, results };
}