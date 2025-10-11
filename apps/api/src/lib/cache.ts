import { LRUCache } from 'lru-cache'

export function makeTTLCache(ttlMs: number, max = 200) {
  const cache = new LRUCache<string, any>({ ttl: ttlMs, max })
  return {
    async get<T = any>(key: string, loader: () => Promise<T>): Promise<T> {
      const hit = cache.get(key)
      if (hit !== undefined) return hit as T
      const v = await loader()
      cache.set(key, v)
      return v
    },
    peek<T = any>(key: string) { return cache.get(key) as T | undefined },
    set<T = any>(key: string, v: T) { cache.set(key, v) },
    delete(key: string) { cache.delete(key) },
  }
}
