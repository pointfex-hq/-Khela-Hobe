import Redis from 'ioredis';

interface MemoryEntry {
  value: string;
  expiresAt: number | null;
}

const globalForCache = globalThis as unknown as {
  __khRedisClient?: Redis;
  __khRedisUnavailableUntil?: number;
  __khMemCache?: Map<string, MemoryEntry>;
};

const memCache: Map<string, MemoryEntry> =
  globalForCache.__khMemCache ?? new Map<string, MemoryEntry>();
globalForCache.__khMemCache = memCache;

function getRedisClient(): Redis | null {
  const redisUrl = (process.env.REDIS_URL || '').trim();
  if (!redisUrl) return null;

  const now = Date.now();
  if (globalForCache.__khRedisUnavailableUntil && now < globalForCache.__khRedisUnavailableUntil) {
    return null;
  }

  if (!globalForCache.__khRedisClient) {
    const client = new Redis(redisUrl, {
      lazyConnect: true,
      connectTimeout: 2500,
      keepAlive: 10000,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      ...(redisUrl.startsWith('rediss://') ? { tls: { rejectUnauthorized: false } } : {}),
      retryStrategy: () => null,
    });

    client.on('error', () => {
      // Fall back gracefully to in-memory cache for 30s if Redis daemon is offline
      globalForCache.__khRedisUnavailableUntil = Date.now() + 30_000;
    });

    globalForCache.__khRedisClient = client;
  }

  return globalForCache.__khRedisClient;
}

async function ensureConnected(client: Redis): Promise<boolean> {
  if (client.status === 'ready') return true;
  if (client.status === 'connecting' || client.status === 'connect') return false;
  try {
    await client.connect();
    return (client.status as string) === 'ready';
  } catch {
    globalForCache.__khRedisUnavailableUntil = Date.now() + 30_000;
    return false;
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  // Fast L1 in-memory check avoids remote Redis Cloud RTT on repeat hot reads
  const entry = memCache.get(key);
  if (entry) {
    if (entry.expiresAt === null || Date.now() <= entry.expiresAt) {
      try {
        return JSON.parse(entry.value) as T;
      } catch {
        memCache.delete(key);
      }
    } else {
      memCache.delete(key);
    }
  }

  const client = getRedisClient();
  if (client && (await ensureConnected(client))) {
    try {
      const raw = await client.get(key);
      if (raw !== null) {
        memCache.set(key, {
          value: raw,
          expiresAt: Date.now() + 15_000,
        });
        return JSON.parse(raw) as T;
      }
    } catch {
      // Ignore Redis transient errors
    }
  }

  return null;
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 120): Promise<void> {
  const serialized = JSON.stringify(value);
  memCache.set(key, {
    value: serialized,
    expiresAt: ttlSeconds > 0 ? Date.now() + Math.min(ttlSeconds, 20) * 1000 : null,
  });

  const client = getRedisClient();
  if (client && (await ensureConnected(client))) {
    // Write asynchronously to Redis Cloud so HTTP responses return immediately
    const op =
      ttlSeconds > 0
        ? client.set(key, serialized, 'EX', ttlSeconds)
        : client.set(key, serialized);
    op.catch(() => {});
  }
}

export async function cacheDel(...keys: string[]): Promise<void> {
  const cleanKeys = keys.filter(Boolean);
  if (cleanKeys.length === 0) return;

  for (const key of cleanKeys) {
    memCache.delete(key);
  }

  const client = getRedisClient();
  if (client && (await ensureConnected(client))) {
    try {
      await client.del(...cleanKeys);
    } catch {
      // Ignore transient Redis error
    }
  }
}

export async function cacheInvalidatePrefix(prefix: string): Promise<void> {
  for (const key of Array.from(memCache.keys())) {
    if (key.startsWith(prefix)) {
      memCache.delete(key);
    }
  }

  const client = getRedisClient();
  if (client && (await ensureConnected(client))) {
    try {
      let cursor = '0';
      do {
        const [nextCursor, foundKeys] = await client.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 100);
        cursor = nextCursor;
        if (foundKeys.length > 0) {
          await client.del(...foundKeys);
        }
      } while (cursor !== '0');
    } catch {
      // Ignore transient Redis error
    }
  }
}

export const CACHE_KEYS = {
  SPORTS_ACTIVE: 'sports:active',
  LOCATIONS_ALL: 'locations:all',
  TOURNAMENTS_PUBLIC: 'tournaments:public',
  MATCHES_PREFIX: 'matches:list:',
  MATCH_BY_ID: (id: string) => `match:${id}`,
  USER_ME: (userId: string) => `user:me:${userId}`,
  SESSION_USER: (userId: string) => `session:user:${userId}`,
};

export async function invalidateSportsCache(): Promise<void> {
  await cacheDel(CACHE_KEYS.SPORTS_ACTIVE);
}

export async function invalidateLocationsCache(): Promise<void> {
  await cacheDel(CACHE_KEYS.LOCATIONS_ALL);
}

export async function invalidateTournamentsCache(): Promise<void> {
  await cacheInvalidatePrefix('tournaments:');
}

export async function invalidateMatchesCache(matchId?: string): Promise<void> {
  await cacheInvalidatePrefix(CACHE_KEYS.MATCHES_PREFIX);
  await cacheInvalidatePrefix('matches:nearby:');
  await cacheInvalidatePrefix('user:matches:');
  if (matchId) {
    await cacheDel(CACHE_KEYS.MATCH_BY_ID(matchId));
  }
}

export async function invalidateUserCache(userId: string): Promise<void> {
  if (!userId) return;
  await cacheDel(CACHE_KEYS.USER_ME(userId), CACHE_KEYS.SESSION_USER(userId));
  await cacheInvalidatePrefix(`user:matches:${userId}:`);
}
