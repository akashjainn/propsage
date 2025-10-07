"use client";

import React, { useEffect, useState } from 'react';
import { usePerformanceMonitor } from '@/hooks/usePerformance';

interface PerformanceStatsProps {
  enabled?: boolean;
}

export function PerformanceStats({ enabled = process.env.NODE_ENV === 'development' }: PerformanceStatsProps) {
  const { monitor } = usePerformanceMonitor('PerformanceStats');
  const [stats, setStats] = useState<{
    fps: number;
    memory: number;
    slowRenders: number;
    slowAPIs: number;
  }>({
    fps: 0,
    memory: 0,
    slowRenders: 0,
    slowAPIs: 0
  });

  useEffect(() => {
    if (!enabled) return;

    let frameCount = 0;
    let lastTime = performance.now();
    let animationFrame: number;

    const updateStats = () => {
      const now = performance.now();
      const delta = now - lastTime;
      
      if (delta >= 1000) {
        const fps = Math.round((frameCount * 1000) / delta);
        const memory = (performance as any).memory?.usedJSHeapSize / 1024 / 1024 || 0;
        
        const allMetrics = monitor.getAllMetrics();
        const slowRenders = Object.entries(allMetrics)
          .filter(([key, data]) => key.startsWith('render_') && (data as any).latest > 100)
          .length;
        
        const slowAPIs = Object.entries(allMetrics)
          .filter(([key, data]) => !key.startsWith('render_') && (data as any).latest > 1000)
          .length;

        setStats({ fps, memory, slowRenders, slowAPIs });
        
        frameCount = 0;
        lastTime = now;
      }
      
      frameCount++;
      animationFrame = requestAnimationFrame(updateStats);
    };

    animationFrame = requestAnimationFrame(updateStats);
    
    return () => cancelAnimationFrame(animationFrame);
  }, [enabled, monitor]);

  if (!enabled) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] bg-black/80 text-white text-xs p-2 rounded-lg font-mono">
      <div>FPS: {stats.fps}</div>
      <div>Memory: {stats.memory.toFixed(1)}MB</div>
      <div>Slow Renders: {stats.slowRenders}</div>
      <div>Slow APIs: {stats.slowAPIs}</div>
    </div>
  );
}

// React DevTools helper for performance debugging
export function ReactDevtoolsHelper({ enabled = false }: { enabled?: boolean }) {
  useEffect(() => {
    if (!enabled || process.env.NODE_ENV !== 'development') return;

    // Check if React DevTools is available
    if (typeof window !== 'undefined' && !(window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      console.warn('React DevTools not detected. Install React DevTools browser extension for better debugging.');
      return;
    }

    // Enable React concurrent features profiling
    if (typeof window !== 'undefined') {
      const hook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (hook) {
        hook.onCommitFiberRoot = (id: any, root: any, priorityLevel: any) => {
          // Log slow commits
          if (root.current?.treeBaseDuration > 16) {
            console.warn(`Slow React commit detected: ${root.current.treeBaseDuration.toFixed(2)}ms`);
          }
        };
      }
    }
  }, [enabled]);

  return null;
}

export default PerformanceStats;