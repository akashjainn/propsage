import { useEffect, useState } from "react";
import { searchNflPlayers, type NflPlayer } from "./nfl";

export function useNflPlayerSearch() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<NflPlayer[]>([]);

  useEffect(() => {
    if (!q || q.length < 2) { 
      setResults([]);
      return; 
    }
    
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const players = await searchNflPlayers(q);
        setResults(players);
      } catch (error) {
        console.error("NFL player search error:", error);
        setResults([]);
      } finally { 
        setLoading(false); 
      }
    }, 500); // 500ms debounce
    
    return () => clearTimeout(timeout);
  }, [q]);

  return { q, setQ, loading, results };
}