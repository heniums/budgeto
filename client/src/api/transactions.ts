import { apiClient } from './client';

export interface TransactionData {
  id: string;
  walletId: string;
  amount: string;
  description: string;
  categoryId: string | null;
  createdAt: string;
}

export interface TransferResult {
  sourceTransaction: TransactionData;
  targetTransaction: TransactionData;
}

export interface CreateTransactionInput {
  amount: string;
  description?: string;
  categoryId?: string;
}

export interface TransferInput {
  sourceId: string;
  targetId: string;
  amount: string;
  description?: string;
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
