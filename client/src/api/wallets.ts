import { apiClient } from './client';

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

export async function createWallet(
  input: CreateWalletInput,
): Promise<WalletData> {
  const response = await apiClient.post<WalletData>('/wallets', input);
  return response.data;
}

export async function getWallets(): Promise<{ wallets: WalletData[] }> {
  const response =
    await apiClient.get<{ wallets: WalletData[] }>('/wallets');
  return response.data;
}

export async function getWallet(id: string): Promise<WalletData> {
  const response = await apiClient.get<WalletData>(`/wallets/${id}`);
  return response.data;
}

export async function updateWallet(
  id: string,
  input: UpdateWalletInput,
): Promise<WalletData> {
  const response = await apiClient.put<WalletData>(`/wallets/${id}`, input);
  return response.data;
}

export async function deleteWallet(id: string): Promise<void> {
  await apiClient.delete(`/wallets/${id}`);
}

export async function createTransaction(
  walletId: string,
  input: CreateTransactionInput,
): Promise<TransactionData> {
  const response = await apiClient.post<TransactionData>(
    `/wallets/${walletId}/transactions`,
    input,
  );
  return response.data;
}

export async function getTransactions(
  walletId: string,
): Promise<{ transactions: TransactionData[] }> {
  const response = await apiClient.get<{ transactions: TransactionData[] }>(
    `/wallets/${walletId}/transactions`,
  );
  return response.data;
}

export async function transferFunds(
  input: TransferInput,
): Promise<TransferResult> {
  const response = await apiClient.post<TransferResult>(
    '/wallets/transfer',
    input,
  );
  return response.data;
}
