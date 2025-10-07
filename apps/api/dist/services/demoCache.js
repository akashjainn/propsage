import fs from 'fs';
import path from 'path';
// Player name mapping for demo/display purposes
const PLAYER_NAMES = {
    'anthony-edwards': 'Anthony Edwards',
    'luka-doncic': 'Luka Doncic',
    'jayson-tatum': 'Jayson Tatum'
};
// Reverse mapping for search
const NAME_TO_ID = {
    'anthony edwards': 'anthony-edwards',
    'luka doncic': 'luka-doncic',
    'jayson tatum': 'jayson-tatum',
    'ant': 'anthony-edwards',
    'ae': 'anthony-edwards',
    'luka': 'luka-doncic',
    'ld': 'luka-doncic',
    'tatum': 'jayson-tatum',
    'jt': 'jayson-tatum'
};
export function getPlayerName(playerId) {
    return PLAYER_NAMES[playerId] || playerId;
}
export function findPlayerId(query) {
    const normalized = query.toLowerCase().trim();
    // Direct match
    if (NAME_TO_ID[normalized]) {
        return NAME_TO_ID[normalized];
    }
    // Partial match on first/last name
    for (const [key, id] of Object.entries(NAME_TO_ID)) {
        if (key.includes(normalized) || normalized.includes(key)) {
            return id;
        }
    }
    return null;
}
let propsCache = null;
let priorsCache = null;
let evidenceCache = null;
let videoCache = null;
function loadJSON(rel) {
    // Try data directory relative to repo root first (deployment)
    let file = path.resolve(process.cwd(), '..', '..', 'data', rel);
    if (!fs.existsSync(file)) {
        // Fallback to data directory relative to current working directory (development)
        file = path.resolve(process.cwd(), 'data', rel);
    }
    const raw = fs.readFileSync(file, 'utf-8');
    return JSON.parse(raw);
}
export function getProps() {
    if (!propsCache)
        propsCache = loadJSON('sample_lines.json');
    return propsCache;
}
export function getPriors() {
    if (!priorsCache)
        priorsCache = loadJSON('sample_priors.json');
    return priorsCache;
}
export function getEvidence(playerId) {
    if (!evidenceCache) {
        try {
            evidenceCache = loadJSON('evidence.cache.json').reduce((acc, row) => {
                acc[row.playerId] = row.snippets;
                return acc;
            }, {});
        }
        catch {
            evidenceCache = {};
        }
    }
    return evidenceCache[playerId] || [];
}
export function getVideos(playerId) {
    if (!videoCache) {
        try {
            videoCache = loadJSON('video.cache.json').reduce((acc, row) => {
                acc[row.playerId] = row.clips;
                return acc;
            }, {});
        }
        catch {
            videoCache = {};
        }
    }
    return videoCache[playerId] || [];
}
