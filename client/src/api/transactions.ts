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

export interface TransactionQuery {
  from?: string;
  to?: string;
  walletId?: string;
  categoryId?: string;
  type?: 'income' | 'expense' | 'all';
  search?: string;
  limit?: number;
  offset?: number;
}

export async function getTransactions(
  params?: TransactionQuery,
): Promise<UserTransactionsResult> {
  const hasParams = params && Object.keys(params).length > 0;
  const response = hasParams
    ? await apiClient.get<UserTransactionsResult>('/transactions', {
        params: buildQuery(params),
      })
    : await apiClient.get<UserTransactionsResult>('/transactions');
  return response.data;
}

function buildQuery(params: TransactionQuery): Record<string, string | number> {
  const query: Record<string, string | number> = {};
  if (params.from) query.from = params.from;
  if (params.to) query.to = params.to;
  if (params.walletId) query.walletId = params.walletId;
  if (params.categoryId) query.categoryId = params.categoryId;
  if (params.type && params.type !== 'all') query.type = params.type;
  if (params.search) query.search = params.search;
  if (params.limit !== undefined) query.limit = params.limit;
  if (params.offset !== undefined) query.offset = params.offset;
  return query;
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
