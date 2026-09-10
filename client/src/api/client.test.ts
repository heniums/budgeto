import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const refreshSessionMock = vi.fn();

vi.mock('./auth', () => ({
  refreshSession: (...args: unknown[]) => refreshSessionMock(...args),
}));

import {
  apiClient,
  ApiError,
  UNAUTHORIZED_EVENT,
  setAccessToken,
  getAccessToken,
} from './client';
import type { InternalAxiosRequestConfig } from 'axios';

// axios InterceptorManager.handlers is not part of the public API, so we cast
// through unknown to access the registered interceptor functions for direct
// unit testing.
const getResponseErrorHandler = () => {
  const { handlers } = apiClient.interceptors.response as unknown as {
    handlers: Array<{
      fulfilled: (value: unknown) => unknown;
      rejected: (error: unknown) => unknown;
    }>;
  };
  return handlers[0].rejected;
};

const getRequestInterceptor = () => {
  const { handlers } = apiClient.interceptors.request as unknown as {
    handlers: Array<{
      fulfilled: (value: unknown) => unknown;
    }>;
  };
  return handlers[0].fulfilled;
};

// Swap the transport for a recorder so retried requests can be asserted
// without touching the network. Restored in afterEach.
const defaultAdapter = apiClient.defaults.adapter;
const recordRequests = () => {
  const requests: InternalAxiosRequestConfig[] = [];
  apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    requests.push(config);
    return {
      data: { ok: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    };
  };
  return requests;
};

describe('apiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    setAccessToken(null);
    apiClient.defaults.adapter = defaultAdapter;
  });

  it('has withCredentials disabled by default (refresh opts in per call)', () => {
    expect(apiClient.defaults.withCredentials).toBe(false);
  });

  it('injects the Bearer token into outgoing requests', () => {
    const interceptor = getRequestInterceptor();
    setAccessToken('tok');
    const config = interceptor({ headers: {}, skipAuth: undefined }) as {
      headers: Record<string, string>;
    };
    expect(config.headers.Authorization).toBe('Bearer tok');
  });

  it('leaves the Authorization header unset when skipAuth is true', () => {
    const interceptor = getRequestInterceptor();
    setAccessToken('tok');
    const config = interceptor({ headers: {}, skipAuth: true }) as {
      headers: Record<string, string>;
    };
    expect(config.headers.Authorization).toBeUndefined();
  });

  describe('response interceptor', () => {
    it('passes through successful responses', () => {
      const { handlers } = apiClient.interceptors.response as unknown as {
        handlers: Array<{ fulfilled: (value: unknown) => unknown }>;
      };
      const response = { data: { ok: true }, status: 200 };
      expect(handlers[0].fulfilled(response)).toBe(response);
    });

    it('builds ApiError using data.message', async () => {
      const handler = getResponseErrorHandler();
      const error = {
        config: { url: '/some-endpoint' },
        response: {
          data: { message: 'Something went wrong', code: 'BAD_REQUEST' },
          status: 400,
        },
      };
      await expect(handler(error)).rejects.toMatchObject({
        message: 'Something went wrong',
        status: 400,
        code: 'BAD_REQUEST',
      });
    });

    it('builds ApiError using data.error when message is absent', async () => {
      const handler = getResponseErrorHandler();
      const error = {
        config: { url: '/some-endpoint' },
        response: {
          data: { error: 'Fallback error' },
          status: 422,
        },
      };
      await expect(handler(error)).rejects.toMatchObject({
        message: 'Fallback error',
        status: 422,
      });
    });

    it('throws ApiError(401) on /auth/login without dispatching unauthorized', async () => {
      const handler = getResponseErrorHandler();
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
      const error = {
        config: { url: '/auth/login' },
        response: {
          data: { message: 'Invalid credentials' },
          status: 401,
        },
      };
      await expect(handler(error)).rejects.toBeInstanceOf(ApiError);
      expect(dispatchSpy).not.toHaveBeenCalled();
      dispatchSpy.mockRestore();
    });

    it('dispatches unauthorized event on /auth/refresh 401', async () => {
      const handler = getResponseErrorHandler();
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
      const error = {
        config: { url: '/auth/refresh' },
        response: {
          data: { message: 'Unauthorized' },
          status: 401,
        },
      };
      await expect(handler(error)).rejects.toBeInstanceOf(ApiError);
      expect(dispatchSpy).toHaveBeenCalled();
      const event = dispatchSpy.mock.calls[0][0] as CustomEvent;
      expect(event.type).toBe(UNAUTHORIZED_EVENT);
      dispatchSpy.mockRestore();
    });

    it('dispatches unauthorized event on 401 with skipRefresh', async () => {
      const handler = getResponseErrorHandler();
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
      const error = {
        config: { url: '/some-endpoint', skipRefresh: true },
        response: {
          data: { message: 'Unauthorized' },
          status: 401,
        },
      };
      await expect(handler(error)).rejects.toBeInstanceOf(ApiError);
      expect(dispatchSpy).toHaveBeenCalled();
      const event = dispatchSpy.mock.calls[0][0] as CustomEvent;
      expect(event.type).toBe(UNAUTHORIZED_EVENT);
      dispatchSpy.mockRestore();
    });

    it('re-throws network/non-response errors unchanged', async () => {
      const handler = getResponseErrorHandler();
      const networkError = new Error('Network Error');
      await expect(handler(networkError)).rejects.toBe(networkError);
    });

    describe('silent refresh on 401', () => {
      it('refreshes the session and retries with the fresh token', async () => {
        const handler = getResponseErrorHandler();
        const requests = recordRequests();
        setAccessToken('stale-token');
        refreshSessionMock.mockResolvedValue({
          user: { id: 'u1', email: 'a@b.co', name: 'A' },
          accessToken: 'fresh-token',
        });
        const error = {
          config: {
            url: '/transactions',
            headers: { Authorization: 'Bearer stale-token' },
          },
          response: {
            data: { message: 'Unauthorized' },
            status: 401,
          },
        };
        const response = await handler(error);
        expect(refreshSessionMock).toHaveBeenCalledTimes(1);
        expect(getAccessToken()).toBe('fresh-token');
        expect(requests).toHaveLength(1);
        expect(requests[0].url).toBe('/transactions');
        expect(requests[0].headers.Authorization).toBe('Bearer fresh-token');
        expect(response).toMatchObject({ status: 200, data: { ok: true } });
      });

      it('shares one in-flight refresh across concurrent 401s', async () => {
        const handler = getResponseErrorHandler();
        const requests = recordRequests();
        const { promise: refreshPromise, resolve: resolveRefresh } =
          Promise.withResolvers<{ accessToken: string }>();
        refreshSessionMock.mockImplementation(() => refreshPromise);
        const makeError = () => ({
          config: { url: '/transactions' },
          response: {
            data: { message: 'Unauthorized' },
            status: 401,
          },
        });
        const first = handler(makeError());
        const second = handler(makeError());
        expect(refreshSessionMock).toHaveBeenCalledTimes(1);
        resolveRefresh({ accessToken: 'fresh-token' });
        await Promise.all([first, second]);
        expect(requests).toHaveLength(2);
        expect(requests[0].headers.Authorization).toBe('Bearer fresh-token');
        expect(requests[1].headers.Authorization).toBe('Bearer fresh-token');
      });

      it('propagates the refresh failure and does not retry', async () => {
        const handler = getResponseErrorHandler();
        const requests = recordRequests();
        setAccessToken('stale-token');
        const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
        const refreshError = new Error('refresh failed');
        refreshSessionMock.mockRejectedValue(refreshError);
        const error = {
          config: { url: '/transactions' },
          response: {
            data: { message: 'Unauthorized' },
            status: 401,
          },
        };
        await expect(handler(error)).rejects.toBe(refreshError);
        expect(refreshSessionMock).toHaveBeenCalledTimes(1);
        expect(dispatchSpy).toHaveBeenCalled();
        const event = dispatchSpy.mock.calls[0][0] as CustomEvent;
        expect(event.type).toBe(UNAUTHORIZED_EVENT);
        expect(requests).toHaveLength(0);
        expect(getAccessToken()).toBeNull();
        dispatchSpy.mockRestore();
      });
    });
  });
});
