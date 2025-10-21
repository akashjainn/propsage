export const DEMO_MODE = process.env.DEMO_MODE === 'true';

export function isSportsDataIOLive() {
  return !!process.env.SPORTSDATAIO_API_KEY && !DEMO_MODE;
}

export function apiBase() {
  // Prefer 127.0.0.1 on Windows to avoid IPv6 localhost (::1) mismatch with server binding
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:4000';
}

export function todayNY() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
}
