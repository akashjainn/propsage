import React from "react";
import { render, screen } from "@testing-library/react";
import NFLPropCard from "@/components/NFLPropCard";
import { describe, it, expect } from "vitest";

const prop = { 
  id: "p1", 
  playerName: "Patrick Mahomes", 
  market: "Passing Yards", 
  line: 285.5,
  team: "KC"
};

describe("NFLPropCard", () => {
  it("renders placeholder when no clip", () => {
    render(<NFLPropCard prop={prop as any} />);
    expect(screen.getByText("No clip")).toBeInTheDocument();
  });

  it("renders clip when provided", () => {
    render(<NFLPropCard 
      prop={prop as any} 
      clip={{ id: "c1", thumbnailUrl: "https://example.com/x.jpg", playbackUrl: "#" }} 
    />);
    expect(screen.getByText("Play clip")).toBeInTheDocument();
  });
  
  it("displays player name and market", () => {
    render(<NFLPropCard prop={prop as any} />);
    expect(screen.getByText("Patrick Mahomes")).toBeInTheDocument();
    expect(screen.getByText("Passing Yards")).toBeInTheDocument();
  });
});
