import { createCache } from 'cache-manager';

export const DEFAULT_TTL_MS = 60_000;

const cache = createCache({ ttl: DEFAULT_TTL_MS });

let enabledOverride: boolean | null = null;

/** userId -> set of live cache keys registered for that user. */
const userKeys = new Map<string, Set<string>>();

/**
 * userId -> current cache generation. Bumped on every invalidateUser so an
 * in-flight loader whose set() lands after the deletion writes to an
 * orphaned key instead of repopulating pre-mutation data (cache-manager's
 * wrap runs get → loader → set with no invalidation re-check).
 */
const userGenerations = new Map<string, number>();

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
  const generation = userGenerations.get(userId) ?? 0;
  const key = `${userId}:g${generation}:${scope}`;
  let keys = userKeys.get(userId);
  if (!keys) {
    keys = new Set<string>();
    userKeys.set(userId, keys);
  }
  keys.add(key);
  return cache.wrap(key, loader, DEFAULT_TTL_MS);
}

/**
 * Drops every cached read belonging to `userId`. Coarse by design: one
 * mutation invalidates all of the user's cached scopes.
 */
export async function invalidateUser(userId: string): Promise<void> {
  userGenerations.set(userId, (userGenerations.get(userId) ?? 0) + 1);
  const keys = userKeys.get(userId);
  if (!keys) {
    return;
  }
  userKeys.delete(userId);
  await Promise.all([...keys].map((key) => cache.del(key)));
}

/** Clears the entire cache and the per-user key registry. */
export async function clearCache(): Promise<void> {
  userKeys.clear();
  userGenerations.clear();
  await cache.clear();
}

/**
 * Test hook: forces the cache on or off regardless of NODE_ENV. Pass
 * `enabled: null` to return control to the NODE_ENV check.
 */
export function configureCache(options: { enabled: boolean | null }): void {
  enabledOverride = options.enabled;
}
