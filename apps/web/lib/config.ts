// Shared runtime config for the web app
export interface WebConfig {
  demoMode: boolean;
  apiUrl: string;
  apiWsUrl: string;
}

function bool(val: string | undefined, fallback: boolean) {
  if (val === undefined) return fallback;
  return ['1','true','yes','on'].includes(val.toLowerCase());
}

export const webConfig: WebConfig = {
  demoMode: bool(process.env.NEXT_PUBLIC_DEMO_MODE, true),
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  apiWsUrl: process.env.NEXT_PUBLIC_API_WS_URL || 'ws://localhost:4000'
}
