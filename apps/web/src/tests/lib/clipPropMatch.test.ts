import { matchClipsToProps } from "@/lib/clipPropMatch";
import { describe, it, expect } from "vitest";

const mkProp = (overrides: Partial<any> = {}) => ({
  id: "p1",
  playerName: "Patrick Mahomes",
  market: "Passing Yards",
  line: 285.5,
  source: "DK",
  ...overrides,
});

const mkClip = (overrides: Partial<any> = {}) => ({
  id: "c1",
  playerName: "Patrick Mahomes",
  market: "Pass Yds",
  line: 286,
  source: "DK",
  createdAt: new Date().toISOString(),
  thumbnailUrl: "https://example.com/t.jpg",
  playbackUrl: "https://example.com/v.mp4",
  ...overrides,
});

describe("matchClipsToProps", () => {
  it("matches exact by source/player/market/line±tol", () => {
    const out = matchClipsToProps([mkClip()], [mkProp()]);
    expect(out[0].clip?.id).toBe("c1");
  });
  
  it("allows alias market and rounding", () => {
    const out = matchClipsToProps([mkClip({ market: "passing yds", line: 285.9 })], [mkProp({ line: 286.0 })]);
    expect(out[0].clip).toBeTruthy();
  });
  
  it("falls back to closest if no within-tolerance match", () => {
    const out = matchClipsToProps([mkClip({ line: 300 })], [mkProp({ line: 280 })]);
    expect(out[0].clip?.line).toBe(300);
  });
  
  it("prefers same source", () => {
    const clips = [
      mkClip({ id: "c2", source: "FD", line: 285.5 }), 
      mkClip({ id: "c3", source: "DK", line: 285.5 })
    ];
    const out = matchClipsToProps(clips, [mkProp()]);
    expect(out[0].clip?.id).toBe("c3");
  });
  
  it("handles no clips", () => {
    const out = matchClipsToProps([], [mkProp()]);
    expect(out[0].clip).toBeFalsy();
  });
  
  it("handles no props", () => {
    const out = matchClipsToProps([mkClip()], []);
    expect(out.length).toBe(0);
  });
});
