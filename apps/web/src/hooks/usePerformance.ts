import { useEffect, useState } from 'react';
import useSWR from 'swr';

// Fast fetcher with timeout
const fetcher = async (url: string) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Cache-Control': 'public, max-age=30', // 30s cache
      }
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// Enhanced SWR hook with performance optimizations
export function useFastSWR<T>(key: string | null, fallbackData?: T) {
  return useSWR<T>(
    key,
    fetcher,
    {
      fallbackData,
      revalidateOnFocus: false, // Prevent demo interruptions
      revalidateOnReconnect: false,
      keepPreviousData: true, // Smooth transitions
      dedupingInterval: 2000, // 2s deduping
      focusThrottleInterval: 5000, // 5s focus throttle
      errorRetryCount: 2,
      errorRetryInterval: 1000,
      loadingTimeout: 3000,
      onLoadingSlow: (key: string) => {
        console.warn(`Slow loading detected for: ${key}`);
      },
      onError: (error: any, key: string) => {
        console.error(`SWR Error for ${key}:`, error);
      }
    }
  );
}

// Performance monitoring
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Track API response times
  trackAPI(endpoint: string, duration: number) {
    if (!this.metrics.has(endpoint)) {
      this.metrics.set(endpoint, []);
    }
    
    const times = this.metrics.get(endpoint)!;
    times.push(duration);
    
    // Keep only last 10 measurements
    if (times.length > 10) {
      times.shift();
    }
    
    // Log if slow
    if (duration > 1000) {
      console.warn(`Slow API response: ${endpoint} took ${duration}ms`);
    }
  }

  // Track component render times
  trackRender(component: string, duration: number) {
    const key = `render_${component}`;
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    
    const times = this.metrics.get(key)!;
    times.push(duration);
    
    if (times.length > 10) {
      times.shift();
    }
    
    // Log if slow render
    if (duration > 100) {
      console.warn(`Slow render: ${component} took ${duration}ms`);
    }
  }

  // Get average for metric
  getAverage(key: string): number {
    const times = this.metrics.get(key);
    if (!times || times.length === 0) return 0;
    
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }

  // Get all metrics
  getAllMetrics() {
    const result: Record<string, { avg: number; count: number; latest: number }> = {};
    
    this.metrics.forEach((times, key) => {
      result[key] = {
        avg: this.getAverage(key),
        count: times.length,
        latest: times[times.length - 1] || 0
      };
    });
    
    return result;
  }
}

// React hook for performance tracking
export function usePerformanceMonitor(componentName: string) {
  const monitor = PerformanceMonitor.getInstance();
  
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      monitor.trackRender(componentName, duration);
    };
  });

  const trackAPI = (endpoint: string, startTime: number) => {
    const duration = performance.now() - startTime;
    monitor.trackAPI(endpoint, duration);
    return duration;
  };

  return { trackAPI, monitor };
}

// Image optimization hook
export function useOptimizedImage(src: string, fallback?: string) {
  const [imageSrc, setImageSrc] = useState(fallback || '');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!src) return;

    const img = new Image();
    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
      setHasError(false);
    };
    
    img.onerror = () => {
      setImageSrc(fallback || '');
      setIsLoading(false);
      setHasError(true);
    };
    
    img.src = src;
  }, [src, fallback]);

  return { imageSrc, isLoading, hasError };
}

// Preload critical resources
export function preloadResources() {
  if (typeof window === 'undefined') return;

  // Preload critical API endpoints only (no images to avoid CORS issues)
  const criticalEndpoints = [
    '/api/cfb/games/today',
    '/api/cfb/games/for-team?q=Georgia%20Tech',
    '/api/insights/illinois-usc-20250927'
  ];

  criticalEndpoints.forEach(endpoint => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = endpoint;
    document.head.appendChild(link);
  });

  // Skip image preloading to avoid CORS issues - let TeamLogo component handle fallbacks
}

// Lazy loading hook with intersection observer
export function useLazyLoad<T extends HTMLElement>(
  threshold: number = 0.1
) {
  const [ref, setRef] = useState<T | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(ref);
        }
      },
      { threshold }
    );

    observer.observe(ref);

    return () => {
      if (ref) {
        observer.unobserve(ref);
      }
    };
  }, [ref, threshold]);

  return [setRef, isVisible] as const;
}

// Web Vitals tracking
export function trackWebVitals() {
  if (typeof window === 'undefined') return;

  // LCP - Largest Contentful Paint
  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1] as any;
    
    if (lastEntry) {
      console.log('LCP:', lastEntry.startTime);
      
      // Target: LCP ≤ 2.5s
      if (lastEntry.startTime > 2500) {
        console.warn('LCP is slower than 2.5s:', lastEntry.startTime);
      }
    }
  });

  observer.observe({ entryTypes: ['largest-contentful-paint'] });

  // FID - First Input Delay (interaction)
  const fidObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach((entry: any) => {
      console.log('FID:', entry.processingStart - entry.startTime);
      
      // Target: INP < 200ms
      const delay = entry.processingStart - entry.startTime;
      if (delay > 200) {
        console.warn('Input delay is slower than 200ms:', delay);
      }
    });
  });

  fidObserver.observe({ entryTypes: ['first-input'] });
}

// Cache management
export class CacheManager {
  private static prefix = 'propsage_cache_';
  private static maxAge = 5 * 60 * 1000; // 5 minutes

  static set<T>(key: string, data: T, customMaxAge?: number): void {
    if (typeof window === 'undefined') return;

    try {
      const item = {
        data,
        timestamp: Date.now(),
        maxAge: customMaxAge || this.maxAge
      };
      
      localStorage.setItem(
        `${this.prefix}${key}`,
        JSON.stringify(item)
      );
    } catch (error) {
      console.warn('Cache set failed:', error);
    }
  }

  static get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;

    try {
      const item = localStorage.getItem(`${this.prefix}${key}`);
      if (!item) return null;

      const parsed = JSON.parse(item);
      const isExpired = Date.now() - parsed.timestamp > parsed.maxAge;
      
      if (isExpired) {
        this.remove(key);
        return null;
      }

      return parsed.data;
    } catch (error) {
      console.warn('Cache get failed:', error);
      return null;
    }
  }

  static remove(key: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(`${this.prefix}${key}`);
    } catch (error) {
      console.warn('Cache remove failed:', error);
    }
  }

  static clear(): void {
    if (typeof window === 'undefined') return;
    
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith(this.prefix))
        .forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Cache clear failed:', error);
    }
  }
}

// Enhanced fetch with caching
export async function cachedFetch<T>(
  url: string,
  options?: RequestInit,
  cacheKey?: string
): Promise<T> {
  const key = cacheKey || url;
  
  // Try cache first
  const cached = CacheManager.get<T>(key);
  if (cached) {
    return cached;
  }

  // Fetch with performance tracking
  const startTime = performance.now();
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Cache-Control': 'public, max-age=30',
        ...options?.headers
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    // Track API performance
    const duration = performance.now() - startTime;
    PerformanceMonitor.getInstance().trackAPI(url, duration);
    
    // Cache the result
    CacheManager.set(key, data);
    
    return data;
  } catch (error) {
    const duration = performance.now() - startTime;
    PerformanceMonitor.getInstance().trackAPI(`${url}_error`, duration);
    throw error;
  }
}