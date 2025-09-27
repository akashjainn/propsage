import { useEffect, useState } from "react";
import { getCfbProps, type CfbProp } from "./cfb";

export interface CfbPropsData {
  player: {
    id: string;
    name: string;
    team?: string;
    teamColor?: string;
    position?: string;
  };
  props: CfbProp[];
}

export function useCfbProps(playerId: string | null) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CfbPropsData | null>(null);

  useEffect(() => {
    if (!playerId) {
      setData(null);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const props = await getCfbProps(playerId);
        
        if (props.length > 0) {
          // Extract player info from first prop
          const firstProp = props[0];
          setData({
            player: {
              id: firstProp.playerId,
              name: firstProp.playerName,
              team: firstProp.team,
              teamColor: firstProp.teamColor,
              position: firstProp.position
            },
            props: props.sort((a, b) => Math.abs(b.edgePct) - Math.abs(a.edgePct)) // Sort by edge magnitude
          });
        } else {
          setData({
            player: {
              id: playerId,
              name: "Unknown Player",
              team: undefined,
              teamColor: undefined,
              position: undefined
            },
            props: []
          });
        }
      } catch (error) {
        console.error("CFB props fetch error:", error);
        setData(null);
      } finally {
        setLoading(false);
      }
    }, 300); // Slight delay to avoid rapid requests

    return () => clearTimeout(timeout);
  }, [playerId]);

  return { loading, data };
}