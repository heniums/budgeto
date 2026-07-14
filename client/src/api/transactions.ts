import { apiClient } from './client';

export interface TransactionData {
  id: string;
  walletId: string;
  amount: string;
  description: string;
  categoryId: string | null;
  categoryName: string | null;
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

export interface UpdateTransactionInput {
  amount?: string;
  description?: string;
  categoryId?: string | null;
  walletId?: string;
}

export async function updateTransaction(
  id: string,
  input: UpdateTransactionInput,
): Promise<TransactionData> {
  const response = await apiClient.put<TransactionData>(
    `/transactions/${id}`,
    input,
  );
  return response.data;
}

export async function deleteTransaction(id: string): Promise<TransactionData> {
  const response = await apiClient.delete<TransactionData>(
    `/transactions/${id}`,
  );
  return response.data;
}
