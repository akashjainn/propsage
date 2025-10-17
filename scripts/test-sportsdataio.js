// Quick connectivity test for SportsDataIO NFL API
// Reads SPORTSDATAIO_API_KEY from .env and queries 3 lightweight endpoints

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

function loadEnvKey() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return null;
  const content = fs.readFileSync(envPath, 'utf8');
  const line = content
    .split(/\r?\n/)
    .find((l) => l.trim().startsWith('SPORTSDATAIO_API_KEY='));
  if (!line) return null;
  const val = line.split('=')[1]?.trim();
  return val || null;
}

async function get(url, key) {
  const res = await fetch(url, {
    headers: { 'Ocp-Apim-Subscription-Key': key },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} for ${url}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

(async () => {
  const key = process.env.SPORTSDATAIO_API_KEY || loadEnvKey();
  if (!key) {
    console.error('SPORTSDATAIO_API_KEY not found in environment or .env');
    process.exit(1);
  }
  console.log('Key detected. Testing endpoints...');

  const base = 'https://api.sportsdata.io/v3/nfl';
  try {
    const [season, week, teams] = await Promise.all([
      get(`${base}/scores/json/CurrentSeason`, key),
      get(`${base}/scores/json/CurrentWeek`, key),
      get(`${base}/scores/json/Teams`, key),
    ]);

    console.log('CurrentSeason:', season);
    console.log('CurrentWeek:', week);
    console.log('Teams sample:', Array.isArray(teams) ? teams[0] : teams);
    console.log('SUCCESS: SportsDataIO NFL API reachable.');
  } catch (err) {
    console.error('FAILED:', err.message);
    process.exit(2);
  }
})();
