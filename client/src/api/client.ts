import axios from 'axios';
import { refreshSession } from './auth';

export const UNAUTHORIZED_EVENT = 'budgeto:unauthorized';

declare module 'axios' {
  interface AxiosRequestConfig {
    skipRefresh?: boolean;
  }
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000',
});

apiClient.defaults.withCredentials = true;

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

      // For /auth/refresh failure, dispatch unauthorized event
      if (url === '/auth/refresh') {
        window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
        throw new ApiError(
          error.response.data?.message || 'Unauthorized',
          401,
          error.response.data?.code,
        );
      }

      // Don't retry if skipRefresh is set
      if (config?.skipRefresh) {
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
          .then(() => {
            refreshing = null;
          })
          .catch((err) => {
            refreshing = null;
            window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
            throw err;
          });
      }

      await refreshing;
      return apiClient(config);
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
