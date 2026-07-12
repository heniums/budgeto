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

function authHeader(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  if (response.status === 204) {
    return undefined as T;
  }
  const contentType = response.headers.get('content-type') ?? '';
  const body = contentType.includes('application/json')
    ? await response.json()
    : null;
  if (!response.ok) {
    const message =
      (body && (body.message as string)) ||
      (body && (body.error as string)) ||
      'Request failed';
    const code = body && (body.code as string | undefined);
    throw new ApiError(message, response.status, code);
  }
  return body as T;
}

export async function register(input: RegisterInput): Promise<AuthUser> {
  return request<AuthUser>('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export async function login(input: LoginInput): Promise<LoginResult> {
  return request<LoginResult>('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export async function getMe(token: string): Promise<AuthUser> {
  return request<{ user: AuthUser }>('/auth/me', {
    method: 'GET',
    headers: authHeader(token),
  }).then((res) => res.user);
}

export async function updateName(
  token: string,
  name: string,
): Promise<AuthUser> {
  return request<{ user: AuthUser }>('/auth/me', {
    method: 'PATCH',
    headers: { ...authHeader(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  }).then((res) => res.user);
}

export async function changePassword(
  token: string,
  input: ChangePasswordInput,
): Promise<void> {
  return request<void>('/auth/change-password', {
    method: 'POST',
    headers: { ...authHeader(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}
