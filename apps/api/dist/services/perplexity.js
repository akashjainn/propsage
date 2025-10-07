import fetch from 'node-fetch';
import { config } from '../config.js';
import { getEvidence } from './demoCache.js';
const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX = 100;
const cache = new Map();
// In-flight dedupe map
const inflight = new Map();
const KEYWORDS = [
    'minute', 'rotation', 'role', 'usage', 'questionable', 'probable', 'out', 'injury', 'starting', 'lineup', 'pace'
];
function scoreSnippet(text) {
    if (!text)
        return 0.3;
    const lower = text.toLowerCase();
    let hits = 0;
    for (const k of KEYWORDS)
        if (lower.includes(k))
            hits++;
    const raw = hits / KEYWORDS.length;
    return Math.min(0.9, Math.max(0.3, raw * 1.2 + 0.3));
}
function setCache(key, data) {
    if (cache.has(key))
        cache.delete(key);
    cache.set(key, { ts: Date.now(), data });
    if (cache.size > CACHE_MAX) {
        const first = cache.keys().next().value;
        if (typeof first === 'string')
            cache.delete(first);
    }
}
function getCache(key) {
    const entry = cache.get(key);
    if (!entry)
        return null;
    if (Date.now() - entry.ts > CACHE_TTL_MS) {
        cache.delete(key);
        return null;
    }
    return entry.data;
}
export async function searchEvidence(playerId, playerName, market = 'PTS') {
    if (config.demoMode)
        return getEvidence(playerId);
    if (!config.perplexityKey)
        return [];
    const key = `ev:${playerId}:${market}`;
    const cached = getCache(key);
    if (cached)
        return cached;
    const existing = inflight.get(key);
    if (existing)
        return existing;
    const dateStr = new Date().toISOString().slice(0, 10);
    const query = `${playerName} recent news ${market} minutes role usage status ${dateStr}`;
    const body = { query, max_results: 5, max_tokens_per_page: 512, country: 'US' };
    const p = (async () => {
        const maxAttempts = 4;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 8000);
                const resp = await fetch('https://api.perplexity.ai/search', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${config.perplexityKey}`,
                    },
                    body: JSON.stringify(body),
                    signal: controller.signal,
                });
                clearTimeout(timeout);
                if (resp.status === 429) {
                    const backoff = Math.pow(2, attempt) * 250;
                    await new Promise(r => setTimeout(r, backoff));
                    continue;
                }
                if (!resp.ok)
                    return [];
                const json = await resp.json();
                const results = Array.isArray(json.results) ? json.results : [];
                const mapped = results.slice(0, 3).map((r, i) => {
                    const text = r.snippet || r.text || '';
                    return {
                        id: r.id || String(i),
                        text: text.slice(0, 400),
                        source: (r.url || r.source_url || '').replace(/https?:\/\//, '').split('/')[0] || 'news',
                        url: r.url || r.source_url || '',
                        weight: scoreSnippet(text),
                        timestamp: new Date().toISOString(),
                    };
                }).sort((a, b) => b.weight - a.weight);
                setCache(key, mapped);
                return mapped;
            }
            catch (err) {
                if (err.name === 'AbortError') {
                    // treat as retryable
                    continue;
                }
                return [];
            }
        }
        return [];
    })();
    inflight.set(key, p);
    try {
        const data = await p;
        return data;
    }
    finally {
        inflight.delete(key);
    }
}
