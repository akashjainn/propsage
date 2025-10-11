import pino from 'pino'
import { config } from '../config.js'
import { msfAdapter } from '../adapters/msf.js'

const log = pino({ transport: { target: 'pino-pretty' } })

export function startMsfGamewatch() {
  if (!config.msfEnabled || !config.msfPollingEnabled) {
    log.info({ enabled: config.msfEnabled, polling: config.msfPollingEnabled }, 'MSF gamewatch disabled')
    return
  }
  const season = new Date().getFullYear()

  async function tick() {
    try {
      // Placeholder: fetch week 5 schedule and iterate in-progress games
      const week = 5
      const schedule = await msfAdapter.getWeekSchedule(season, week)
      // TODO: determine in-progress games from schedule once mapping complete
      // For now, no-op
    } catch (e:any) {
      log.warn({ err: e.message }, 'MSF gamewatch tick error')
    }
  }

  setInterval(tick, 30000)
  log.info('MSF gamewatch started (30s interval)')
}
