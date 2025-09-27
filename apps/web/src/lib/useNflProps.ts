import { useEffect, useState } from "react";
import { getNflProps, type NflProp } from "./nfl";

export interface NflPropsData {
  player: {
    id: string;
    name: string;
    team?: string;
    position?: string;
  };
  props: NflProp[];
}

export function useNflProps(playerId: string | null) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<NflPropsData | null>(null);

  useEffect(() => {
    if (!playerId) {
      setData(null);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const props = await getNflProps(playerId);
        
        if (props.length > 0) {
          // Extract player info from first prop
          const firstProp = props[0];
          setData({
            player: {
              id: firstProp.playerId,
              name: firstProp.playerName,
              team: firstProp.team,
              position: undefined // Could be extracted from player data if needed
            },
            props: props.sort((a, b) => Math.abs(b.edgePct) - Math.abs(a.edgePct)) // Sort by edge magnitude
          });
        } else {
          setData({
            player: {
              id: playerId,
              name: "Unknown Player",
              team: undefined,
              position: undefined
            },
            props: []
          });
        }
      } catch (error) {
        console.error("NFL props fetch error:", error);
        setData(null);
      } finally {
        setLoading(false);
      }
    }, 300); // Slight delay to avoid rapid requests

    return () => clearTimeout(timeout);
  }, [playerId]);

  return { loading, data };
}