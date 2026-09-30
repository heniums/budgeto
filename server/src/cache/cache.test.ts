import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getOrLoad,
  invalidateUser,
  clearCache,
  configureCache,
  DEFAULT_TTL_MS,
} from './cache';

configureCache({ enabled: true });

describe('cache', () => {
  beforeEach(async () => {
    await clearCache();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the cached value without re-running the loader', async () => {
    let calls = 0;
    const loader = async () => {
      calls += 1;
      return { value: 'v1' };
    };

    expect(await getOrLoad('user-1', 'scope-a', loader)).toEqual({
      value: 'v1',
    });
    expect(await getOrLoad('user-1', 'scope-a', loader)).toEqual({
      value: 'v1',
    });
    expect(calls).toBe(1);
  });

  it('coalesces concurrent same-key loads into one loader call', async () => {
    let calls = 0;
    let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const loader = async () => {
      calls += 1;
      await gate;
      return 'shared';
    };

    const pending = Promise.all([
      getOrLoad('user-1', 'coalesce-scope', loader),
      getOrLoad('user-1', 'coalesce-scope', loader),
    ]);
    release?.();
    const [a, b] = await pending;

    expect(a).toBe('shared');
    expect(b).toBe('shared');
    expect(calls).toBe(1);
  });

  it('re-runs the loader after invalidateUser', async () => {
    let calls = 0;
    const loader = async () => {
      calls += 1;
      return calls;
    };

    expect(await getOrLoad('user-1', 'scope-a', loader)).toBe(1);
    await invalidateUser('user-1');
    expect(await getOrLoad('user-1', 'scope-a', loader)).toBe(2);
    expect(calls).toBe(2);
  });

  it('does not invalidate other users', async () => {
    let calls = 0;
    const loader = async () => {
      calls += 1;
      return calls;
    };

    expect(await getOrLoad('user-1', 'isolate-scope', loader)).toBe(1);
    await invalidateUser('user-2');
    expect(await getOrLoad('user-1', 'isolate-scope', loader)).toBe(1);
    expect(calls).toBe(1);
  });

  it('re-runs the loader after TTL expiry', async () => {
    vi.useFakeTimers();
    let calls = 0;
    const loader = async () => {
      calls += 1;
      return calls;
    };

    expect(await getOrLoad('user-1', 'scope-a', loader)).toBe(1);
    vi.advanceTimersByTime(DEFAULT_TTL_MS + 1);
    expect(await getOrLoad('user-1', 'scope-a', loader)).toBe(2);
    expect(calls).toBe(2);
  });

  it('does not cache loader rejections', async () => {
    let calls = 0;
    const failing = async () => {
      calls += 1;
      throw new Error('boom');
    };

    await expect(getOrLoad('user-1', 'scope-a', failing)).rejects.toThrow(
      'boom',
    );

    const succeeding = async () => 'recovered';
    expect(await getOrLoad('user-1', 'scope-a', succeeding)).toBe('recovered');
    expect(calls).toBe(1);
  });

  it('separates scopes and users', async () => {
    const loaderA = async () => 'a';
    const loaderB = async () => 'b';
    expect(await getOrLoad('user-1', 'scope-a', loaderA)).toBe('a');
    expect(await getOrLoad('user-1', 'scope-b', loaderB)).toBe('b');
    expect(await getOrLoad('user-2', 'scope-a', loaderA)).toBe('a');
  });

  it('clearCache wipes everything', async () => {
    let calls = 0;
    const loader = async () => {
      calls += 1;
      return calls;
    };

    expect(await getOrLoad('user-1', 'scope-a', loader)).toBe(1);
    await clearCache();
    expect(await getOrLoad('user-1', 'scope-a', loader)).toBe(2);
  });

  it('bypasses the cache entirely when disabled', async () => {
    configureCache({ enabled: false });
    try {
      let calls = 0;
      const loader = async () => {
        calls += 1;
        return calls;
      };

      expect(await getOrLoad('user-1', 'scope-a', loader)).toBe(1);
      expect(await getOrLoad('user-1', 'scope-a', loader)).toBe(2);
      expect(calls).toBe(2);
    } finally {
      configureCache({ enabled: true });
    }
  });
});
