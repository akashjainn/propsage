import { useEffect, useRef, useState } from 'react'

interface MCInputs { mu: number; sigma: number; marketLine: number; simulations?: number }
interface MCResult { fair_line: number; edge: number; conf_low: number; conf_high: number; p_over: number; mu: number; sigma: number; simulations: number }

export function useMC(inputs: MCInputs | null) {
  const workerRef = useRef<Worker | null>(null)
  const [result, setResult] = useState<MCResult | null>(null)
  const [running, setRunning] = useState(false)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [latencyMs, setLatencyMs] = useState<number | null>(null)

  useEffect(() => {
    if (!inputs) return
    if (!workerRef.current) {
      // Fix: Use absolute path from public directory
      workerRef.current = new Worker('/workers/mcWorker.js')
      workerRef.current.onmessage = (e: MessageEvent) => {
        setResult(e.data)
        if (startedAt) setLatencyMs(performance.now() - startedAt)
        setRunning(false)
      }
    }
    setRunning(true)
    setStartedAt(performance.now())
    workerRef.current.postMessage(inputs)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputs?.mu, inputs?.sigma, inputs?.marketLine, inputs?.simulations])

  return { result, running, latencyMs }
}
