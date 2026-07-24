import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { InternalAxiosRequestConfig } from 'axios';
import { apiClient, ApiError } from './client';

// axios InterceptorManager.handlers is not part of the public API, so we cast
// through unknown to access the registered interceptor functions for direct
// unit testing.
const getRequestHandler = () => {
  const { handlers } = apiClient.interceptors.request as unknown as {
    handlers: Array<{
      fulfilled: (
        config: InternalAxiosRequestConfig,
      ) => InternalAxiosRequestConfig;
    }>;
  };
  return handlers[0].fulfilled;
};

const getResponseErrorHandler = () => {
  const { handlers } = apiClient.interceptors.response as unknown as {
    handlers: Array<{ rejected: (error: unknown) => never }>;
  };
  return handlers[0].rejected;
};

function expectThrows<T extends Error>(
  fn: () => void,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errorClass: new (...args: any[]) => T,
): T {
  let thrown: unknown;
  try {
    fn();
  } catch (e) {
    thrown = e;
  }
  expect(thrown).toBeInstanceOf(errorClass);
  return thrown as T;
}

describe('apiClient interceptors', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('request interceptor', () => {
    it('adds Authorization header when token is in localStorage', () => {
      localStorage.setItem('budgeto:token', 'my-jwt-token');
      const handler = getRequestHandler();
      const config = { headers: {} } as InternalAxiosRequestConfig;
      const result = handler(config);
      expect(result.headers.Authorization).toBe('Bearer my-jwt-token');
    });

    it('does not add Authorization header when no token exists', () => {
      const handler = getRequestHandler();
      const config = { headers: {} } as InternalAxiosRequestConfig;
      const result = handler(config);
      expect(result.headers.Authorization).toBeUndefined();
    });
  });

  describe('response interceptor', () => {
    it('builds ApiError using data.message', () => {
      const handler = getResponseErrorHandler();
      const error = {
        response: {
          data: { message: 'Something went wrong', code: 'BAD_REQUEST' },
          status: 400,
        },
      };
      const err = expectThrows(() => handler(error), ApiError);
      expect(err.message).toBe('Something went wrong');
      expect(err.status).toBe(400);
      expect(err.code).toBe('BAD_REQUEST');
    });

    it('builds ApiError using data.error when message is absent', () => {
      const handler = getResponseErrorHandler();
      const error = {
        response: {
          data: { error: 'Fallback error' },
          status: 422,
        },
      };
      const err = expectThrows(() => handler(error), ApiError);
      expect(err.message).toBe('Fallback error');
      expect(err.status).toBe(422);
    });

    it('dispatches budgeto:unauthorized event on 401', () => {
      const handler = getResponseErrorHandler();
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
      const error = {
        response: {
          data: { message: 'Unauthorized' },
          status: 401,
        },
      };
      try {
        handler(error);
      } catch {
        // expected
      }
      expect(dispatchSpy).toHaveBeenCalled();
      const event = dispatchSpy.mock.calls[0][0] as CustomEvent;
      expect(event.type).toBe('budgeto:unauthorized');
      dispatchSpy.mockRestore();
    });

    it('re-throws network/non-response errors unchanged', () => {
      const handler = getResponseErrorHandler();
      const networkError = new Error('Network Error');
      let thrown: unknown;
      try {
        handler(networkError);
      } catch (e) {
        thrown = e;
      }
      expect(thrown).toBe(networkError);
      expect(thrown).not.toBeInstanceOf(ApiError);
    });
  });
});
