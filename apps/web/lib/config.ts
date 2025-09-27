// PropSage web app configuration for HackGT 12 demo
export interface WebConfig {
  demoMode: boolean;
  videoEnabled: boolean;
  apiUrl: string;
  apiWsUrl: string;
  hackgtMode: boolean;
  refreshInterval: number;
}

function bool(val: string | undefined, fallback: boolean) {
  if (val === undefined) return fallback;
  return ['1','true','yes','on'].includes(val.toLowerCase());
}

export const webConfig: WebConfig = {
  demoMode: bool(process.env.NEXT_PUBLIC_DEMO_MODE, true),
  videoEnabled: bool(process.env.NEXT_PUBLIC_VIDEO_ENABLED, true),
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  apiWsUrl: process.env.NEXT_PUBLIC_API_WS_URL || 'ws://localhost:4000',
  hackgtMode: bool(process.env.NEXT_PUBLIC_HACKGT_MODE, false),
  refreshInterval: parseInt(process.env.NEXT_PUBLIC_REFRESH_INTERVAL || '6000', 10)
}
