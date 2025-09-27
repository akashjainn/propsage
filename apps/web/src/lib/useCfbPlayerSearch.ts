import { useEffect, useState } from "react";
import { searchCfbPlayers, type CfbPlayer } from "./cfb";

export function useCfbPlayerSearch() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CfbPlayer[]>([]);

  useEffect(() => {
    if (!q || q.length < 2) { 
      setResults([]);
      return; 
    }
    
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const players = await searchCfbPlayers(q);
        setResults(players);
      } catch (error) {
        console.error("CFB player search error:", error);
        setResults([]);
      } finally { 
        setLoading(false); 
      }
    }, 500); // 500ms debounce
    
    return () => clearTimeout(timeout);
  }, [q]);

  return { q, setQ, loading, results };
}