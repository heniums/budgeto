import apiClient, { ApiError } from './client';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
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

export interface LoginResult {
  token: string;
  user: AuthUser;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export { ApiError };

export async function register(input: RegisterInput): Promise<AuthUser> {
  const response = await apiClient.post<AuthUser>('/auth/register', input);
  return response.data;
}

export async function login(input: LoginInput): Promise<LoginResult> {
  const response = await apiClient.post<LoginResult>('/auth/login', input);
  return response.data;
}

export async function getMe(): Promise<AuthUser> {
  const response = await apiClient.get<{ user: AuthUser }>('/auth/me');
  return response.data.user;
}

export async function updateName(name: string): Promise<AuthUser> {
  const response = await apiClient.patch<{ user: AuthUser }>('/auth/me', { name });
  return response.data.user;
}

export async function changePassword(input: ChangePasswordInput): Promise<void> {
  await apiClient.post('/auth/change-password', input);
}
