import { Router } from "express";
import Parser from "rss-parser";
import { LRUCache } from "lru-cache";

const r = Router();
const parser = new Parser();

type NewsItem = {
  title: string;
  source: string;
  url: string;
  publishedAt?: string;
  snippet?: string;
};

const cache = new LRUCache<string, NewsItem[]>({ max: 100, ttl: 1000*60*15 }); // 15min

const NFL_RSS_FEEDS = [
  "https://www.espn.com/espn/rss/nfl/news",
  "https://feeds.content.nfl.com/mrss/nfl/news",
  // Team-specific feeds could be added here
  // "https://www.dallascowboys.com/feeds/news",
  // "https://www.buccaneers.com/feeds/news",
];

r.get("/", async (req, res) => {
  try {
    const playerName = String(req.query.playerName ?? req.query.player ?? "").trim();
    const team = String(req.query.team ?? "").trim();
    
    if (!playerName && !team) {
      return res.json([]);
    }

    // Create cache key based on search params
    const cacheKey = `${playerName}|${team}`.toLowerCase();
    const hit = cache.get(cacheKey);
    if (hit) return res.json(hit);

    const items: any[] = [];
    
    // Fetch from all RSS feeds
    for (const feedUrl of NFL_RSS_FEEDS) {
      try {
        const feed = await parser.parseURL(feedUrl);
        if (feed.items) {
          items.push(...feed.items);
        }
      } catch (feedError) {
        console.warn(`Failed to fetch RSS feed ${feedUrl}:`, feedError);
        // Continue with other feeds
      }
    }

    // Filter items based on player name and team
    const searchTerms: string[] = [];
    if (playerName) {
      searchTerms.push(playerName.toLowerCase());
      // Also search for just first/last name parts
      const nameParts = playerName.toLowerCase().split(' ');
      searchTerms.push(...nameParts.filter(part => part.length > 2));
    }
    if (team) {
      searchTerms.push(team.toLowerCase());
    }

    const filtered = items
      .filter(item => {
        const title = (item.title ?? "").toLowerCase();
        const content = (item.contentSnippet ?? item.content ?? "").toLowerCase();
        const searchText = `${title} ${content}`;
        
        return searchTerms.some(term => 
          searchText.includes(term)
        );
      })
      .slice(0, 10) // Limit results
      .map(item => ({
        title: item.title ?? "No title",
        source: extractDomain(item.link),
        url: item.link,
        publishedAt: item.isoDate ?? item.pubDate ?? undefined,
        snippet: truncateSnippet(item.contentSnippet ?? item.content)
      }));

    cache.set(cacheKey, filtered);
    res.json(filtered);

  } catch (error) {
    console.error("NFL news fetch error:", error);
    res.status(500).json({ error: "Failed to fetch NFL news" });
  }
});

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return "Unknown";
  }
}

function truncateSnippet(text?: string): string | undefined {
  if (!text) return undefined;
  return text.length > 150 ? text.slice(0, 147) + "..." : text;
}

export default r;