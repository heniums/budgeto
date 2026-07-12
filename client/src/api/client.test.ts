import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';

const { mockRequestUse, mockResponseUse } = vi.hoisted(() => {
  const mockRequestUse = vi.fn();
  const mockResponseUse = vi.fn();
  return { mockRequestUse, mockResponseUse };
});

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      interceptors: {
        request: { use: mockRequestUse },
        response: { use: mockResponseUse },
      },
    })),
  },
}));

import apiClient from './client';
import { ApiError } from './client';

const requestInterceptor = mockRequestUse.mock.calls[0]?.[0] as (
  config: { headers: Record<string, string> },
) => { headers: Record<string, string> };

const responseErrorInterceptor = mockResponseUse.mock.calls[0]?.[1] as (
  error: unknown,
) => never;

describe('apiClient', () => {
  it('is a singleton axios instance', () => {
    expect(apiClient).toBeDefined();
    expect(mockRequestUse).toHaveBeenCalled();
    expect(mockResponseUse).toHaveBeenCalled();
  });

  describe('request interceptor', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('attaches the auth token when present in localStorage', () => {
      const getItem = vi.fn().mockReturnValue('test-token');
      vi.stubGlobal('localStorage', { getItem });
      const config = { headers: {} };
      const result = requestInterceptor(config);
      expect(result.headers.Authorization).toBe('Bearer test-token');
    });

    it('does not attach a header when no token exists in localStorage', () => {
      const getItem = vi.fn().mockReturnValue(null);
      vi.stubGlobal('localStorage', { getItem });
      const config = { headers: {} };
      const result = requestInterceptor(config);
      expect(result.headers.Authorization).toBeUndefined();
    });

    it('does not modify headers when localStorage throws', () => {
      const getItem = vi.fn(() => {
        throw new Error('Storage unavailable');
      });
      vi.stubGlobal('localStorage', { getItem });
      const config = { headers: {} };
      const result = requestInterceptor(config);
      expect(result.headers.Authorization).toBeUndefined();
    });
  });

  describe('response interceptor', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('re-throws errors wrapped in ApiError', () => {
      const error = {
        response: { data: { message: 'test error' }, status: 500 },
      };
      try {
        responseErrorInterceptor(error);
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ApiError);
        expect((e as ApiError).status).toBe(500);
        expect((e as ApiError).message).toBe('test error');
      }
    });

    it('normalizes error with code field', () => {
      const error = {
        response: {
          data: { message: 'Not found', code: 'NOT_FOUND' },
          status: 404,
        },
      };
      try {
        responseErrorInterceptor(error);
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ApiError);
        expect((e as ApiError).status).toBe(404);
        expect((e as ApiError).code).toBe('NOT_FOUND');
        expect((e as ApiError).message).toBe('Not found');
      }
    });

    it('handles 401 by clearing the token from localStorage', () => {
      const removeItem = vi.fn();
      vi.stubGlobal('localStorage', { removeItem });
      const error = {
        response: { data: { message: 'Unauthorized' }, status: 401 },
      };
      try {
        responseErrorInterceptor(error);
        expect.fail('should have thrown');
      } catch (e) {
        expect(removeItem).toHaveBeenCalledWith('budgeto.token');
      }
    });

    it('dispatches custom event on 401', () => {
      const removeItem = vi.fn();
      const dispatchEvent = vi.fn();
      vi.stubGlobal('localStorage', { removeItem });
      vi.stubGlobal('window', { dispatchEvent });
      const error = {
        response: { data: { message: 'Unauthorized' }, status: 401 },
      };
      try {
        responseErrorInterceptor(error);
        expect.fail('should have thrown');
      } catch (e) {
        expect(dispatchEvent).toHaveBeenCalled();
        const event = dispatchEvent.mock.calls[0][0] as CustomEvent;
        expect(event.type).toBe('budgeto:unauthorized');
      }
    });

    it('uses error.message when data.message and data.error are missing', () => {
      const error = {
        response: { data: {}, status: 502 },
      };
      try {
        responseErrorInterceptor(error);
        expect.fail('should have thrown');
      } catch (e) {
        expect((e as ApiError).message).toBe('Request failed');
      }
    });

    it('normalizes errors using data.error field', () => {
      const error = {
        response: { data: { error: 'Something broke' }, status: 500 },
      };
      try {
        responseErrorInterceptor(error);
        expect.fail('should have thrown');
      } catch (e) {
        expect((e as ApiError).message).toBe('Something broke');
      }
    });
  });
});
