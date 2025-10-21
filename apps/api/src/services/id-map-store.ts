import Redis from 'ioredis'

export type MapKinds = 'sport_event' | 'player' | 'team' | 'game'

export interface IdMapStore {
  get(key: string, kind: MapKinds): Promise<string | null>
  set(key: string, value: string, kind: MapKinds, ttlSec?: number): Promise<void>
  del(key: string, kind: MapKinds): Promise<void>
}

const prefix = (kind: MapKinds) => `propsage:idmap:${kind}:`

export function createIdMapStore(): IdMapStore {
  const url = process.env.REDIS_URL
  if (!url) return createMemoryStore()

  const redis = new Redis(url)
  return {
    async get(key, kind) {
      return await redis.get(prefix(kind) + key)
    },
    async set(key, value, kind, ttlSec = 60 * 60 * 24 * 7) {
      const k = prefix(kind) + key
      await redis.set(k, value, 'EX', ttlSec)
    },
    async del(key, kind) {
      await redis.del(prefix(kind) + key)
    },
  }
}

function createMemoryStore(): IdMapStore {
  const m = new Map<string, string>()
  const k = (kind: MapKinds, key: string) => `${kind}:${key}`
  return {
    async get(key, kind) { return m.get(k(kind, key)) ?? null },
    async set(key, value, kind) { m.set(k(kind, key), value) },
    async del(key, kind) { m.delete(k(kind, key)) },
  }
}
