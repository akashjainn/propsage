export const DEMO_MODE = process.env.DEMO_MODE === 'true';

export function isSportsDataIOLive() {
  return !!process.env.SPORTSDATAIO_API_KEY && !DEMO_MODE;
}

export function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
}

export function todayNY() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
}
