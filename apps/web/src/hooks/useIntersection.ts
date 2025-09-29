"use client";
import { useEffect, useRef, useState } from 'react';

interface Options extends IntersectionObserverInit {
  freezeOnceVisible?: boolean;
}

export function useIntersection<T extends HTMLElement = HTMLElement>(options: Options = {}) {
  const { root = null, rootMargin = '0px', threshold = 0.1, freezeOnceVisible = true } = options;
  const ref = useRef<T | null>(null);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);

  const frozen = !!entry?.isIntersecting && freezeOnceVisible;

  useEffect(() => {
    const node = ref.current;
    if (!node || frozen) return;

    const observer = new IntersectionObserver(([ent]) => {
      setEntry(ent);
    }, { root, rootMargin, threshold });

    observer.observe(node);
    return () => observer.disconnect();
  }, [root, rootMargin, threshold, frozen]);

  return { ref, entry, inView: !!entry?.isIntersecting } as const;
}

export default useIntersection;