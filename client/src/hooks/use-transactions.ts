import {
  useInfiniteQuery,
  useQuery,
  type InfiniteData,
  type UseInfiniteQueryResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import dayjs from 'dayjs';
import {
  getTransactions,
  getTransactionsSummary,
  type TransactionQuery,
  type TransactionSummary,
  type TransactionSummaryQuery,
  type UserTransactionsResult,
} from '../api/transactions';
import type { ApiError } from '../api/client';
import type { DatePreset } from '../lib/dateRange';
import {
  TRANSACTIONS_KEY,
  TRANSACTIONS_SUMMARY_KEY,
} from '../lib/queryKeys';

const PAGE_SIZE = 20;

/** Serializable filter snapshot; goes straight into the query key. */
export interface TransactionsFilterState {
  walletFilter: string;
  categoryFilter: string;
  typeFilter: 'all' | 'income' | 'expense';
  datePreset: DatePreset;
  fromDate: string;
  toDate: string;
  search: string;
}

export function buildTransactionsQuery(
  filters: TransactionsFilterState,
  offset: number,
): TransactionQuery {
  const query: TransactionQuery = { limit: PAGE_SIZE, offset };
  if (filters.datePreset === 'custom') {
    if (filters.fromDate) {
      query.from = dayjs(`${filters.fromDate}T00:00:00`).toISOString();
    }
    if (filters.toDate) {
      query.to = dayjs(`${filters.toDate}T23:59:59.999`).toISOString();
    }
  }
  if (filters.walletFilter) query.walletId = filters.walletFilter;
  if (filters.categoryFilter) query.categoryId = filters.categoryFilter;
  if (filters.typeFilter !== 'all') query.type = filters.typeFilter;
  if (filters.search) query.search = filters.search;
  return query;
}

export function buildTransactionsSummaryQuery(
  filters: TransactionsFilterState,
): TransactionSummaryQuery {
  const query: TransactionSummaryQuery = {};
  if (filters.datePreset === 'custom') {
    if (filters.fromDate) {
      query.from = dayjs(`${filters.fromDate}T00:00:00`).toISOString();
    }
    if (filters.toDate) {
      query.to = dayjs(`${filters.toDate}T23:59:59.999`).toISOString();
    }
  }
  if (filters.walletFilter) query.walletId = filters.walletFilter;
  if (filters.categoryFilter) query.categoryId = filters.categoryFilter;
  if (filters.typeFilter !== 'all') query.type = filters.typeFilter;
  if (filters.search) query.search = filters.search;
  query.preset = filters.datePreset;
  return query;
}

export function useTransactionsInfiniteQuery(
  filters: TransactionsFilterState,
): UseInfiniteQueryResult<InfiniteData<UserTransactionsResult>, ApiError> {
  return useInfiniteQuery({
    queryKey: [...TRANSACTIONS_KEY, filters],
    queryFn: ({ pageParam }) =>
      getTransactions(buildTransactionsQuery(filters, pageParam)),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastOffset) =>
      lastOffset + PAGE_SIZE < lastPage.total ? lastOffset + PAGE_SIZE : undefined,
  });
}

export function useTransactionsSummaryQuery(
  filters: TransactionsFilterState,
): UseQueryResult<TransactionSummary, ApiError> {
  return useQuery({
    queryKey: [...TRANSACTIONS_SUMMARY_KEY, filters],
    queryFn: () => getTransactionsSummary(buildTransactionsSummaryQuery(filters)),
  });
}
