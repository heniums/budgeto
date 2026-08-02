import { apiClient } from './client';

export type UserSettings = Record<string, unknown>;

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  settings?: UserSettings;
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

export async function register(input: RegisterInput): Promise<AuthUser> {
  const response = await apiClient.post<{ user: AuthUser }>(
    '/auth/register',
    input,
  );
  return response.data.user;
}

export async function login(input: LoginInput): Promise<AuthUser> {
  const response = await apiClient.post<{ user: AuthUser }>(
    '/auth/login',
    input,
  );
  return response.data.user;
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
  await apiClient.post('/auth/change-password', input);
}

export async function updateSettings(
  settings: UserSettings,
): Promise<AuthUser> {
  const response = await apiClient.patch<{ user: AuthUser }>('/auth/me', {
    settings,
  });
  return response.data.user;
}

export async function refreshSession(): Promise<AuthUser> {
  const response = await apiClient.post<{ user: AuthUser }>('/auth/refresh');
  return response.data.user;
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}
