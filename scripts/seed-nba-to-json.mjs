import fs from "node:fs/promises";

const API_KEY = "f98954c1-4a2b-40c7-a1f3-0d099214aa91";

console.log("Fetching NBA players from Balldontlie API...");

// Fetch multiple pages to get comprehensive player data
const allPlayers = [];
for (let page = 1; page <= 10; page++) {  // Get first 10 pages (~1000 players)
  try {
    const resp = await fetch(`https://api.balldontlie.io/v1/players?per_page=100&page=${page}`, {
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      }
    });
    
    if (!resp.ok) {
      console.error(`Failed to fetch page ${page}: ${resp.status}`);
      break;
    }
    
    const data = await resp.json();
    const mapped = (data.data ?? []).map(p => ({
      id: `nba_${p.id}`,
      sport: "NBA",
      name: `${p.first_name} ${p.last_name}`.trim(),
      firstName: p.first_name,
      lastName: p.last_name,
      team: p.team?.abbreviation ?? null,
      position: p.position || null,
      externalIds: { balldontlie: p.id },
    }));
    
    allPlayers.push(...mapped);
    console.log(`Fetched page ${page}: ${mapped.length} players`);
    
    // Rate limiting - wait longer between requests (5 req/min limit)
    await new Promise(resolve => setTimeout(resolve, 15000)); // 15 second delay
  } catch (error) {
    console.error(`Error fetching page ${page}:`, error);
    break;
  }
}

// Create directory and write file
await fs.mkdir("apps/api/data", { recursive: true });
await fs.writeFile("apps/api/data/players.nba.json", JSON.stringify(allPlayers, null, 2));
console.log(`✅ Wrote ${allPlayers.length} players to apps/api/data/players.nba.json`);