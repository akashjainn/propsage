import { getNFLContext } from "@/lib/nflConfig";

export default function DevOverlay() {
  const { season, week } = getNFLContext();
  if (process.env.NEXT_PUBLIC_SHOW_DEBUG_OVERLAY !== "true") return null;
  return (
    <div className="fixed bottom-3 right-3 rounded-md bg-black/80 text-white px-3 py-2 text-xs shadow z-50">
      NFL Context → {season} · Week {week}
    </div>
  );
}
