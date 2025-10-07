"use client";
import { useEffect, useCallback, useRef, useState } from 'react';

// Debounce function for reducing excessive API calls
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]) as T;
}

// Debounced value hook for search inputs
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  
  return debouncedValue;
}

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => setIsIntersecting(entry.isIntersecting),
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    );
    
    observer.observe(element);
    return () => observer.disconnect();
  }, [elementRef, options]);
  
  return isIntersecting;
}

// Preload critical resources
export function preloadCriticalResources() {
  if (typeof window === 'undefined') return;
  
  // Preload fonts
  const fontLink = document.createElement('link');
  fontLink.rel = 'preload';
  fontLink.href = '/fonts/inter.woff2';
  fontLink.as = 'font';
  fontLink.type = 'font/woff2';
  fontLink.crossOrigin = 'anonymous';
  document.head.appendChild(fontLink);
  
  // Preload critical images
  const heroImage = new Image();
  heroImage.src = '/hero-bg.webp';
}

// Request idle callback wrapper
export function useIdleCallback(callback: () => void, deps: any[] = []) {
  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(callback);
      return () => cancelIdleCallback(id);
    } else {
      const id = setTimeout(callback, 0);
      return () => clearTimeout(id);
    }
  }, deps);
}

// Memory usage monitoring
export function useMemoryMonitor() {
  useEffect(() => {
    if (!('memory' in performance)) return;
    
    const checkMemory = () => {
      const memory = (performance as any).memory;
      if (memory.usedJSHeapSize / memory.jsHeapSizeLimit > 0.9) {
        console.warn('High memory usage detected');
        // Force garbage collection if possible
        if ('gc' in window) {
          (window as any).gc();
        }
      }
    };
    
    const interval = setInterval(checkMemory, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);
}