import { apiClient } from './client';

export interface TransactionData {
  id: string;
  walletId: string;
  amount: string;
  description: string;
  createdAt: string;
}

export interface UserTransactionsResult {
  transactions: TransactionData[];
  total: number;
}

export async function getTransactions(): Promise<UserTransactionsResult> {
  const response = await apiClient.get<UserTransactionsResult>('/transactions');
  return response.data;
}

export async function getTransaction(id: string): Promise<TransactionData> {
  const response = await apiClient.get<TransactionData>(`/transactions/${id}`);
  return response.data;
}
