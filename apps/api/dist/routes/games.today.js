import { Router } from 'express';
import { getScheduleForDate } from '../services/cfbd.schedule.js';
import path from 'path';
import fs from 'fs';
function loadDemoGame() {
    try {
        const demoPath = path.join(__dirname, '../data/games.demo.json');
        if (fs.existsSync(demoPath)) {
            const raw = JSON.parse(fs.readFileSync(demoPath, 'utf8'));
            // Expect array, find haynes king game heuristically by team names or id.
            if (Array.isArray(raw)) {
                const g = raw.find((r) => (r.home?.team || '').toLowerCase().includes('georgia tech') ||
                    (r.away?.team || '').toLowerCase().includes('georgia tech'));
                if (g) {
                    return {
                        id: g.id || 'demo-haynes-king',
                        home: g.home,
                        away: g.away,
                        kickoffISO: g.kickoff || g.date || new Date().toISOString(),
                        kickoffET: 'TBD',
                        status: 'SCHEDULED',
                        demoFeatured: true
                    };
                }
            }
        }
    }
    catch (e) {
        console.warn('Failed loading demo game meta', e);
    }
    return null;
}
const router = Router();
router.get('/games/today', async (req, res) => {
    const today = new Date();
    const date = today.toISOString().slice(0, 10); // UTC date
    const { games, source } = await getScheduleForDate(date);
    const demoMeta = loadDemoGame();
    let enriched = games.map(g => ({ ...g }));
    if (demoMeta) {
        // Try to match an existing schedule game with same home/away team, else push synthetic
        const idx = enriched.findIndex(g => g.home.team.toLowerCase().includes('georgia tech') ||
            g.away.team.toLowerCase().includes('georgia tech'));
        if (idx >= 0) {
            enriched[idx] = { ...enriched[idx], demoFeatured: true };
        }
        else {
            // inject demo game placeholder to reinforce presence
            enriched.push({
                id: demoMeta.id || 'demo-haynes-king',
                rawId: -1,
                date,
                kickoffISO: demoMeta.kickoffISO || new Date().toISOString(),
                kickoffET: demoMeta.kickoffET || 'TBD',
                status: demoMeta.status || 'SCHEDULED',
                home: demoMeta.home || { team: 'Georgia Tech', score: null },
                away: demoMeta.away || { team: 'Opponent', score: null },
                venue: 'Bobby Dodd Stadium',
                network: 'ESPN',
                demoFeatured: true
            });
        }
    }
    // Sort featured first, then by kickoff
    enriched.sort((a, b) => {
        if (a.demoFeatured && !b.demoFeatured)
            return -1;
        if (b.demoFeatured && !a.demoFeatured)
            return 1;
        return (a.kickoffISO || '').localeCompare(b.kickoffISO || '');
    });
    res.json({ date, source, count: enriched.length, games: enriched });
});
export default router;
