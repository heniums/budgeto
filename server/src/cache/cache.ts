import { createCache } from 'cache-manager';
import { Keyv } from 'keyv';
import { LRUCache } from 'lru-cache';

export const DEFAULT_TTL_MS = 60_000;

// lru-cache's set() takes `(key, value, { ttl })` while Keyv calls its
// store with `(key, value, ttl)`; without this adapter every Keyv set()
// throws inside lru-cache and Keyv silently drops the entry.
const lruStore = new LRUCache<string, string>({ max: 5_000 });

const cache = createCache({
  ttl: DEFAULT_TTL_MS,
  stores: [
    new Keyv({
      store: {
        get: (key: string) => lruStore.get(key),
        set: (key: string, value: string, ttl?: number) =>
          lruStore.set(key, value, ttl === undefined ? undefined : { ttl }),
        delete: (key: string) => lruStore.delete(key),
        clear: () => lruStore.clear(),
      },
    }),
  ],
});

let enabledOverride: boolean | null = null;

/**
 * userId -> current version of that user's cache-key namespace. Bumped on
 * every invalidateUser so an in-flight loader whose set() lands after the
 * deletion writes to an orphaned key instead of repopulating pre-mutation
 * data (cache-manager's wrap runs get → loader → set with no invalidation
 * re-check).
 */
const userKeyVersions = new Map<string, number>();

function isEnabled(): boolean {
  if (enabledOverride !== null) {
    return enabledOverride;
  }
  return process.env.NODE_ENV !== 'test';
}

/**
 * Returns the cached value for `userId:scope` when fresh, otherwise runs
 * `loader` and caches the result for DEFAULT_TTL_MS. Concurrent calls with
 * the same key share a single load (cache-manager `wrap` coalescing).
 * Loader errors are never cached — a rejected load leaves no entry.
 */
export function getOrLoad<T>(
  userId: string,
  scope: string,
  loader: () => Promise<T>,
): Promise<T> {
  if (!isEnabled()) {
    return loader();
  }
  const keyVersion = userKeyVersions.get(userId) ?? 0;
  const key = `${userId}:v${keyVersion}:${scope}`;
  return cache.wrap(key, loader, DEFAULT_TTL_MS);
}

/**
 * Drops every cached read belonging to `userId`. Coarse by design: one
 * mutation invalidates all of the user's cached scopes. The version bump
 * orphans all prior keys; unreachable entries age out via TTL and LRU
 * eviction (max 5,000 entries per process).
 */
export async function invalidateUser(userId: string): Promise<void> {
  userKeyVersions.set(userId, (userKeyVersions.get(userId) ?? 0) + 1);
}

/** Clears the entire cache and the per-user key versions. */
export async function clearCache(): Promise<void> {
  userKeyVersions.clear();
  await cache.clear();
}

/**
 * Test hook: forces the cache on or off regardless of NODE_ENV. Pass
 * `enabled: null` to return control to the NODE_ENV check.
 */
export function configureCache(options: { enabled: boolean | null }): void {
  enabledOverride = options.enabled;
}
