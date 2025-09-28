'use client';
import { useEffect, useState } from 'react';

export default function FallbackClips({ game, edge }: { game: string; edge: { player: string; market: string } }) {
  const [clips, setClips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const q = new URLSearchParams({ game, player: edge.player, market: edge.market });
        const res = await fetch(`/api/tl/clips?${q.toString()}`, { cache: 'no-store' }).then(r => r.json());
        if (!alive) return;
        setClips(res?.results ?? []);
      } catch (e) {
        // swallow
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [game, edge.player, edge.market]);

  if (loading) return <div className="h-40 rounded-xl bg-muted/20 animate-pulse" />;
  if (!clips.length) return <div className="text-sm text-muted-foreground">No demo clips available.</div>;

  return (
    <div className="space-y-4">
      {clips.map((c) => (
        <div key={`${c.url}-${c.start}`} className="space-y-2">
          <div className="text-sm opacity-80">{Math.round(c.start)}s–{Math.round(c.end)}s</div>
          <video
            src={c.url}
            controls
            preload="metadata"
            className="w-full rounded-xl bg-black aspect-video"
            onLoadedMetadata={(e) => {
              if (c.start) e.currentTarget.currentTime = c.start;
            }}
          />
        </div>
      ))}
    </div>
  );
}
