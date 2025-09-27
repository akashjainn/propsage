// Monte Carlo pricing worker (web)
// Receives: { mu, sigma, marketLine, simulations }
// Responds: { fair_line, edge, conf_low, conf_high, p_over, mu, sigma }

self.onmessage = (e: MessageEvent) => {
  const { mu, sigma, marketLine, simulations = 50000 } = e.data || {}
  if (typeof mu !== 'number' || typeof sigma !== 'number' || typeof marketLine !== 'number') {
    // ignore invalid
    return
  }
  const N = simulations
  let over = 0
  const reservoirSize = 2000
  const reservoir: number[] = new Array(reservoirSize)
  let filled = 0
  for (let i = 0; i < N; i++) {
    const u1 = Math.random()
    const u2 = Math.random()
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
    const value = mu + sigma * z
    if (value > marketLine) over++
    if (filled < reservoirSize) {
      reservoir[filled++] = value
    } else if (Math.random() < reservoirSize / (i + 1)) {
      const r = Math.floor(Math.random() * reservoirSize)
      reservoir[r] = value
    }
  }
  reservoir.length = filled
  reservoir.sort((a,b)=>a-b)
  const pick = (p: number) => reservoir[Math.min(reservoir.length - 1, Math.max(0, Math.floor(p * reservoir.length)))]
  const median = pick(0.5)
  const lower = pick(0.16)
  const upper = pick(0.84)
  const pOver = over / N
  ;(self as any).postMessage({
    fair_line: median,
    edge: pOver - 0.5,
    conf_low: lower,
    conf_high: upper,
    p_over: pOver,
    mu,
    sigma,
    simulations: N,
  })
}
