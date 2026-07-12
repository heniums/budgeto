import axios from 'axios';

const TOKEN_KEY = 'budgeto.token';
const UNAUTHORIZED_EVENT = 'budgeto:unauthorized';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
});

apiClient.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Ignore storage failures.
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { data, status } = error.response;
      const message =
        (data && (data.message as string)) ||
        (data && (data.error as string)) ||
        'Request failed';
      const code = data && (data.code as string | undefined);

      if (status === 401) {
        try {
          localStorage.removeItem(TOKEN_KEY);
        } catch {
          // Ignore storage failures.
        }
        window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
      }

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

export default apiClient;
