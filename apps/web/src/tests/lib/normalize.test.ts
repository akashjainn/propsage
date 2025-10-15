import { normalizeMarket, normalizeLine, normalizePlayerName, isLineWithinTolerance } from "@/lib/normalize";
import { describe, it, expect } from "vitest";

describe("normalize", () => {
  it("normalizes market aliases", () => {
    expect(normalizeMarket("pass yds")).toBe("Passing Yards");
    expect(normalizeMarket("rushing yards")).toBe("Rushing Yards");
    expect(normalizeMarket("receiving yds")).toBe("Receiving Yards");
  });
  
  it("normalizes line to one decimal", () => {
    expect(normalizeLine(264.49)).toBe(264.5);
    expect(normalizeLine("265")).toBe(265.0);
    expect(normalizeLine(285.95)).toBe(286.0);
  });
  
  it("normalizes player names", () => {
    expect(normalizePlayerName("Odell Beckham Jr.")).toBe("odell beckham jr");
    expect(normalizePlayerName("Patrick Mahomes II")).toBe("patrick mahomes ii");
  });
  
  it("tolerance check", () => {
    expect(isLineWithinTolerance(264.5, 265, 0.5)).toBe(true);
    expect(isLineWithinTolerance(264.5, 265.2, 0.5)).toBe(false);
    expect(isLineWithinTolerance(285.5, 286, 0.5)).toBe(true);
  });
});
