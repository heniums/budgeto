import { describe, it, expect, vi, beforeEach } from 'vitest';

const refreshSessionMock = vi.fn();

vi.mock('./auth', () => ({
  refreshSession: (...args: unknown[]) => refreshSessionMock(...args),
}));

import { apiClient, ApiError, UNAUTHORIZED_EVENT } from './client';

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

describe('apiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('has withCredentials enabled', () => {
    expect(apiClient.defaults.withCredentials).toBe(true);
  });

  it('has no request interceptors', () => {
    const { handlers } = apiClient.interceptors.request as unknown as {
      handlers: unknown[];
    };
    expect(handlers.length).toBe(0);
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
  });
});
