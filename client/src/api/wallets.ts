import { ApiError } from './auth';

export interface WalletData {
  id: string;
  name: string;
  description: string;
  color: string;
  balance: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionData {
  id: string;
  walletId: string;
  amount: string;
  description: string;
  createdAt: string;
}

export interface TransferResult {
  sourceTransaction: TransactionData;
  targetTransaction: TransactionData;
}

export interface CreateWalletInput {
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateWalletInput {
  name?: string;
  description?: string;
  color?: string;
}

export interface CreateTransactionInput {
  amount: string;
  description?: string;
}

export interface TransferInput {
  sourceId: string;
  targetId: string;
  amount: string;
  description?: string;
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

export async function createWallet(
  token: string,
  input: CreateWalletInput,
): Promise<WalletData> {
  return request<WalletData>('/wallets', {
    method: 'POST',
    headers: { ...authHeader(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export async function getWallets(
  token: string,
): Promise<{ wallets: WalletData[] }> {
  return request<{ wallets: WalletData[] }>('/wallets', {
    method: 'GET',
    headers: authHeader(token),
  });
}

export async function getWallet(
  token: string,
  id: string,
): Promise<WalletData> {
  return request<WalletData>(`/wallets/${id}`, {
    method: 'GET',
    headers: authHeader(token),
  });
}

export async function updateWallet(
  token: string,
  id: string,
  input: UpdateWalletInput,
): Promise<WalletData> {
  return request<WalletData>(`/wallets/${id}`, {
    method: 'PUT',
    headers: { ...authHeader(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export async function deleteWallet(
  token: string,
  id: string,
): Promise<void> {
  return request<void>(`/wallets/${id}`, {
    method: 'DELETE',
    headers: authHeader(token),
  });
}

export async function createTransaction(
  token: string,
  walletId: string,
  input: CreateTransactionInput,
): Promise<TransactionData> {
  return request<TransactionData>(`/wallets/${walletId}/transactions`, {
    method: 'POST',
    headers: { ...authHeader(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export async function getTransactions(
  token: string,
  walletId: string,
): Promise<{ transactions: TransactionData[] }> {
  return request<{ transactions: TransactionData[] }>(
    `/wallets/${walletId}/transactions`,
    {
      method: 'GET',
      headers: authHeader(token),
    },
  );
}

export async function transferFunds(
  token: string,
  input: TransferInput,
): Promise<TransferResult> {
  return request<TransferResult>('/wallets/transfer', {
    method: 'POST',
    headers: { ...authHeader(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}
