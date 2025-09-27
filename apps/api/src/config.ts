import 'dotenv/config'

export const config = {
  demoMode: process.env.DEMO_MODE === 'true',
  port: parseInt(process.env.PORT || '4000', 10),
  perplexityKey: process.env.PPLX_API_KEY || '',
  twelveLabsKey: process.env.TL_API_KEY || '',
  videoEnabled: (process.env.VIDEO_ENABLED || 'true') === 'true',
}

export type AppConfig = typeof config
