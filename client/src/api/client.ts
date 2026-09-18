import axios from 'axios';
import { refreshSession } from './auth';

export const UNAUTHORIZED_EVENT = 'budgeto:unauthorized';

declare module 'axios' {
  interface AxiosRequestConfig {
    skipRefresh?: boolean;
    skipAuth?: boolean;
  }
}

/**
 * In-memory access token store. The token never touches localStorage or
 * sessionStorage — a page refresh wipes it and forces a refresh-cookie based
 * silent re-auth. Mutators live below; the interceptor reads it via the getter.
 */
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000',
});

// The refresh cookie is httpOnly and SameSite=Lax; the SPA needs it sent on
// the refresh request only, so we opt-in per call via the flag below.
apiClient.defaults.withCredentials = false;

apiClient.interceptors.request.use((config) => {
  if (config.skipAuth) {
    return config;
  }
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshing: Promise<void> | null = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    if (error.response?.status === 401) {
      const url = config?.url || '';

      // Don't retry /auth/login
      if (url === '/auth/login') {
        throw new ApiError(
          error.response.data?.message || 'Unauthorized',
          401,
          error.response.data?.code,
        );
      }

      // For /auth/refresh failure: when this 401 IS the shared refresh
      // promise failing, its catch below dispatches the event — dispatch
      // here only when no refresh is in flight (e.g. the mount-time
      // silent refresh), so the event fires exactly once per failure.
      if (url === '/auth/refresh') {
        setAccessToken(null);
        if (!refreshing) {
          window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
        }
        throw new ApiError(
          error.response.data?.message || 'Unauthorized',
          401,
          error.response.data?.code,
        );
      }

      // Don't retry if skipRefresh is set: the session is unrecoverable, so
      // drop the dead token and notify listeners.
      if (config?.skipRefresh) {
        setAccessToken(null);
        window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
        throw new ApiError(
          error.response.data?.message || 'Unauthorized',
          401,
          error.response.data?.code,
        );
      }

      // Try silent refresh
      if (!refreshing) {
        refreshing = refreshSession()
          .then(({ accessToken: next }) => {
            setAccessToken(next);
            refreshing = null;
          })
          .catch((err) => {
            refreshing = null;
            setAccessToken(null);
            window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
            throw err;
          });
      }

      await refreshing;
      // After refresh, retry with the new token — exactly once. skipRefresh
      // marks the retried request so a second 401 fails straight through
      // (dispatching unauthorized) instead of minting another token and
      // looping.
      const retried = { ...config, skipRefresh: true };
      retried.headers = {
        ...(config.headers ?? {}),
        Authorization: `Bearer ${getAccessToken()}`,
      };
      return apiClient(retried);
    }

    // Existing error handling for non-401
    if (error.response) {
      const { data, status } = error.response;
      const message =
        (typeof data?.message === 'string' && data.message) ||
        (typeof data?.error === 'string' && data.error) ||
        'Request failed';
      const code = typeof data?.code === 'string' ? data.code : undefined;
      throw new ApiError(message, status, code);
    }
    throw error;
  },
);

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export { apiClient };
