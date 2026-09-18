import { apiClient } from './client';

export type UserSettings = Record<string, unknown>;

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  settings?: UserSettings;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export async function register(input: RegisterInput): Promise<AuthSession> {
  const response = await apiClient.post<AuthSession>('/auth/register', input, {
    skipAuth: true,
    withCredentials: true,
  });
  return response.data;
}

export async function login(input: LoginInput): Promise<AuthSession> {
  const response = await apiClient.post<AuthSession>('/auth/login', input, {
    skipAuth: true,
    withCredentials: true,
  });
  return response.data;
}

export async function getMe(options?: {
  skipRefresh?: boolean;
}): Promise<AuthUser> {
  const response = await apiClient.get<{ user: AuthUser }>('/auth/me', {
    skipRefresh: options?.skipRefresh,
  });
  return response.data.user;
}

export async function updateName(name: string): Promise<AuthUser> {
  const response = await apiClient.patch<{ user: AuthUser }>('/auth/me', {
    name,
  });
  return response.data.user;
}

export async function changePassword(
  input: ChangePasswordInput,
): Promise<void> {
  // withCredentials is required for the 204's Set-Cookie clear to apply:
  // browsers discard cookies from non-credentialed cross-origin responses.
  await apiClient.post('/auth/change-password', input, {
    withCredentials: true,
  });
}

export async function updateSettings(
  settings: UserSettings,
): Promise<AuthUser> {
  const response = await apiClient.patch<{ user: AuthUser }>('/auth/me', {
    settings,
  });
  return response.data.user;
}

/**
 * Exchanges the httpOnly refresh cookie for a fresh access token. Called by
 * the response interceptor on 401s and by AuthProvider on mount. `skipRefresh`
 * keeps it out of the refresh-on-401 logic even if the endpoint path ever
 * changes; `withCredentials` is enabled only for this call so the browser
 * sends the refresh cookie.
 */
export async function refreshSession(): Promise<AuthSession> {
  const response = await apiClient.post<AuthSession>(
    '/auth/refresh',
    undefined,
    { skipAuth: true, skipRefresh: true, withCredentials: true },
  );
  return response.data;
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout', undefined, { withCredentials: true });
}
