"use client";
import { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

export function useCountUp(target: number, opts: { duration?: number } = {}) {
  const { duration = 900 } = opts;
  const reduced = usePrefersReducedMotion();
  const [val, setVal] = useState(reduced ? target : 0);

  useEffect(() => {
    if (reduced) { setVal(target); return; }
    let raf: number; let start: number | null = null;
    const step = (ts: number) => {
      if (start == null) start = ts;
      const p = Math.min(1, (ts - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(target * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, reduced]);

  return val;
}
