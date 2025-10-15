/* eslint-disable @next/next/no-img-element */
import React from "react";
import Link from "next/link";
import { NFLProp } from "@/lib/nfl";

type Props = {
  prop: NFLProp;
  clip?: {
    id: string;
    thumbnailUrl?: string;
    playbackUrl?: string;
  };
};

export default function NFLPropCard({ prop, clip }: Props) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold">{prop.playerName}</div>
        <span className="text-xs rounded bg-gray-100 px-2 py-1">{prop.team ?? "—"}</span>
      </div>
      <div className="text-sm text-gray-600 mb-2">{prop.market}</div>
      <div className="text-lg font-bold mb-3">{prop.line}</div>
      {clip?.thumbnailUrl ? (
        <Link href={clip.playbackUrl ?? "#"} target="_blank" className="block group">
          <img
            src={clip.thumbnailUrl}
            alt={`${prop.playerName} clip`}
            className="h-40 w-full rounded-md object-cover transition group-hover:opacity-90"
          />
          <div className="mt-2 text-blue-600 text-sm underline">Play clip</div>
        </Link>
      ) : (
        <div className="h-40 w-full rounded-md border border-dashed grid place-items-center text-gray-400" title="Clip unavailable">
          No clip
        </div>
      )}
    </div>
  );
}
