import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import {
  type TransactionData,
  deleteTransaction,
  getTransaction,
} from '../api/transactions';
import type { CategoryData } from '../api/categories';
import { ApiError } from '../api/client';
import { useWalletsQuery } from '@/hooks/use-wallets';
import { useCategoriesQuery } from '@/hooks/use-categories';
import {
  useTransactionsInfiniteQuery,
  useTransactionsSummaryQuery,
  type TransactionsFilterState,
} from '@/hooks/use-transactions';
import { useDialogParam } from '@/hooks/use-dialog-param';
import { transactionDetailKey } from '@/lib/queryKeys';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { invalidateFinancialData } from '@/lib/queryClient';
import { Button } from '@/components/memphis/button';
import { Input } from '@/components/memphis/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/memphis/dialog';
import { TransactionForm } from '../components/TransactionForm';
import { FormAlert } from '../components/FormAlert';
import { TransferForm } from '../components/TransferForm';
import { findTransferPair } from '../lib/transferPair';
import { OnboardingWizard } from '../components/OnboardingWizard';
import { WalletModal } from '../components/WalletModal';
import { CategoryModal } from '../components/CategoryModal';
import { DateRangeButton } from '../components/DateRangeButton';
import { FilterDropdown } from '../components/FilterDropdown';
import { Money } from '../components/Money';
import { formatPeriodLabel, periodKey, type DatePreset } from '@/lib/dateRange';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from '@/components/memphis/context-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { FormSkeleton } from '../components/FormSkeleton';
import { FloatingActionButton } from '@/components/FloatingActionButton';

interface LongPressHandlers {
  onTouchStart: () => void;
  onTouchEnd: () => void;
  onTouchMove: () => void;
}

function makeLongPressHandlers(onLongPress: () => void): LongPressHandlers {
  const timer: { current: ReturnType<typeof setTimeout> | null } = {
    current: null,
  };
  return {
    onTouchStart: () => {
      timer.current = setTimeout(onLongPress, 500);
    },
    onTouchEnd: () => {
      if (timer.current) clearTimeout(timer.current);
    },
    onTouchMove: () => {
      if (timer.current) clearTimeout(timer.current);
    },
  };
}

function formatDate(iso: string, preset: DatePreset): string {
  if (!iso) return '';
  // Single-day groups (day/custom presets) carry the date in the sticky
  // period header; only the time is needed in the row.
  if (preset === 'day' || preset === 'custom') {
    return dayjs(iso).format('h:mm A');
  }
  // week/month/year groups span multiple days, so rows must carry the
  // day-of-month and time. Month/year labels carry the month/year; a week
  // bucket spans at most 7 days, so 'MMM D' is unambiguous within it.
  return dayjs(iso).format('MMM D, h:mm A');
}

/**
 * Deletes one transfer leg, treating "already deleted" (404) as success so a
 * retry after a partial cascade failure can still finish the remaining leg.
 */
async function deleteLegIgnoringNotFound(id: string): Promise<void> {
  try {
    await deleteTransaction(id);
  } catch (err) {
    if (!(err instanceof ApiError && err.status === 404)) {
      throw err;
    }
  }
}

interface PeriodGroup {
  key: string;
  label: string;
  items: TransactionData[];
}

/** One pulsing placeholder row mirroring the 5-column list layout. */
function SkeletonRow(): JSX.Element {
  return (
    <TableRow>
      <TableCell>
        <Skeleton className="h-4 w-20" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-24 rounded-full" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-20 rounded-full" />
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <Skeleton className="h-4 w-36" />
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="ml-auto h-4 w-16" />
      </TableCell>
    </TableRow>
  );
}

export function Transactions(): JSX.Element {
  const queryClient = useQueryClient();
  const walletsQuery = useWalletsQuery();
  const categoriesQuery = useCategoriesQuery();
  const wallets = walletsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];

  const [datePreset, setDatePreset] = useState<DatePreset>('day');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [walletFilter, setWalletFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>(
    'all',
  );
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const filters = useMemo<TransactionsFilterState>(
    () => ({
      walletFilter,
      categoryFilter,
      typeFilter,
      datePreset,
      fromDate,
      toDate,
      search: debouncedSearch,
    }),
    [
      walletFilter,
      categoryFilter,
      typeFilter,
      datePreset,
      fromDate,
      toDate,
      debouncedSearch,
    ],
  );
  const listQuery = useTransactionsInfiniteQuery(filters);
  const summaryQuery = useTransactionsSummaryQuery(filters);
  const transactions = useMemo(
    () => listQuery.data?.pages.flatMap((page) => page.transactions) ?? [],
    [listQuery.data],
  );
  const total = listQuery.data?.pages.at(-1)?.total ?? 0;
  const hasMore = listQuery.hasNextPage;
  const initialLoading = listQuery.isPending;
  const loadingMore = listQuery.isFetchingNextPage;
  const summary = summaryQuery.data ?? null;
  const error = listQuery.error
    ? listQuery.error instanceof ApiError
      ? listQuery.error.message
      : 'Failed to load transactions.'
    : null;

  const summaryMap = useMemo(() => {
    const map = new Map<string, { currency: string; amount: string }[]>();
    if (!summary) return map;
    for (const group of summary.groups) {
      map.set(group.key, group.net);
    }
    return map;
  }, [summary]);

  const txDialog = useDialogParam('tx');
  const transferDialog = useDialogParam('transfer');
  const walletDialog = useDialogParam('wallet');
  const categoryDialog = useDialogParam('category');
  const txParam = txDialog.value;
  const transferParam = transferDialog.value;
  const walletParam = walletDialog.value;
  const categoryParam = categoryDialog.value;
  // A deep-linked id ('?tx=<uuid>') fetches the transaction directly; 'new'
  // opens the add dialog without a fetch.
  const editTxId = txParam !== null && txParam !== 'new' ? txParam : null;
  const editTxQuery = useQuery({
    queryKey: transactionDetailKey(editTxId ?? 'new'),
    queryFn: () => {
      if (editTxId === null) {
        throw new Error('editTxId missing');
      }
      return getTransaction(editTxId);
    },
    enabled: editTxId !== null,
    retry: false,
    // Never background-refetch while the edit dialog is open: a refetch
    // would swap the form's initialValues identity and wipe in-progress
    // edits. Cache invalidation after mutations still refreshes it.
    staleTime: Infinity,
  });
  const editTx = editTxQuery.data ?? null;
  const [deleteConfirm, setDeleteConfirm] = useState<TransactionData | null>(
    null,
  );
  const [cascadeTx, setCascadeTx] = useState<{
    action: 'delete' | 'edit';
    tx: TransactionData;
    pair: TransactionData;
  } | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [createWalletOpen, setCreateWalletOpen] = useState(false);
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);
  const [pendingWalletId, setPendingWalletId] = useState<string | null>(null);
  const [pendingCategoryId, setPendingCategoryId] = useState<string | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<{
    id: string;
    message: string;
  } | null>(null);

  // Debounce the free-text search so we don't hit the API on every keystroke.
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(handle);
  }, [search]);

  // A deep-linked transaction that no longer exists (deleted, or another
  // user's) must not wedge the edit dialog open. Replace (not push): a push
  // would let Back land on the stale link again, whose cached error closes
  // it once more — a trap the user cannot navigate past.
  useEffect(() => {
    if (editTxQuery.isError) {
      txDialog.close({ replace: true });
    }
  }, [editTxQuery.isError, txDialog.close]);

  const loadMore = useCallback(() => {
    void listQuery.fetchNextPage();
  }, [listQuery.fetchNextPage]);

  // Open the onboarding wizard once, only if the first wallets load comes
  // back empty and the user hasn't dismissed the wizard before.
  const wizardCheckedRef = useRef(false);
  useEffect(() => {
    if (wizardCheckedRef.current || !walletsQuery.isSuccess) return;
    wizardCheckedRef.current = true;
    if (
      walletsQuery.data.length === 0 &&
      localStorage.getItem('budgeto:wizardDismissed') !== 'true'
    ) {
      setWizardOpen(true);
    }
  }, [walletsQuery.isSuccess, walletsQuery.data]);

  const loadMoreRef = useRef(loadMore);
  useEffect(() => {
    loadMoreRef.current = loadMore;
  }, [loadMore]);
  const observerRef = useRef<IntersectionObserver | null>(null);
  // Callback ref: create the observer exactly when the sentinel mounts so we
  // never read a not-yet-attached node. Re-triggers always call the latest
  // loadMore via loadMoreRef, so duplicate observers can't double-load.
  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (node && typeof IntersectionObserver !== 'undefined') {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) loadMoreRef.current();
        },
        { rootMargin: '200px' },
      );
      observer.observe(node);
      observerRef.current = observer;
    }
  }, []);

  const categoryMap = useMemo(() => {
    const map = new Map<string, CategoryData>();
    for (const c of categories) {
      map.set(c.id, c);
    }
    return map;
  }, [categories]);

  const walletMap = useMemo(() => {
    const map = new Map<string, (typeof wallets)[number]>();
    for (const w of wallets) {
      map.set(w.id, w);
    }
    return map;
  }, [wallets]);

  const groups = useMemo<PeriodGroup[]>(() => {
    const groupMap = new Map<string, PeriodGroup>();
    for (const tx of transactions) {
      const key = periodKey(tx.date, datePreset);
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          key,
          label: formatPeriodLabel(tx.date, datePreset),
          items: [],
        });
      }
      groupMap.get(key)?.items.push(tx);
    }
    return Array.from(groupMap.values()).sort((a, b) =>
      b.key.localeCompare(a.key),
    );
  }, [transactions, datePreset]);

  return (
    <div className="space-y-6 pb-24">
      <OnboardingWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onComplete={() => {
          setWizardOpen(false);
          void invalidateFinancialData(queryClient);
        }}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-foreground">Transactions</h1>
        <div className="flex gap-2">
          {wallets.length > 0 && categories.length > 0 ? (
            <Dialog
              open={txParam === 'new'}
              onOpenChange={(open) => {
                if (open) {
                  txDialog.open('new');
                } else {
                  txDialog.close();
                }
              }}
            >
              <DialogTrigger asChild>
                <Button data-testid="header-add-button">Add transaction</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add transaction</DialogTitle>
                </DialogHeader>
                <TransactionForm
                  wallets={wallets}
                  categories={categories.map((c) => ({
                    id: c.id,
                    name: c.name,
                    color: c.color,
                    icon: c.icon,
                  }))}
                  categoriesCount={categories.length}
                  walletsPending={walletsQuery.isPending}
                  categoriesPending={categoriesQuery.isPending}
                  autoSelectWalletId={
                    pendingWalletId ?? wallets[0]?.id ?? undefined
                  }
                  autoSelectCategoryId={
                    pendingCategoryId ?? categories[0]?.id ?? undefined
                  }
                  onSuccess={() => {
                    txDialog.close();
                    setPendingWalletId(null);
                    setPendingCategoryId(null);
                    void invalidateFinancialData(queryClient);
                  }}
                  onRefreshWallets={() =>
                    void invalidateFinancialData(queryClient)
                  }
                  onRefreshCategories={() =>
                    void invalidateFinancialData(queryClient)
                  }
                  onClose={() => txDialog.close()}
                  onCreateWallet={() => {
                    setCreateWalletOpen(true);
                  }}
                  onCreateCategory={() => {
                    setCreateCategoryOpen(true);
                  }}
                  onViewWallet={(id) => {
                    walletDialog.open(id);
                  }}
                  onEditWallet={(wallet) => {
                    walletDialog.open(wallet.id);
                  }}
                  onEditCategory={(category) => {
                    categoryDialog.open(category.id);
                  }}
                />
              </DialogContent>
            </Dialog>
          ) : (
            <Button
              disabled
              data-testid="header-add-button"
              title="You need at least one wallet and one category to add a transaction"
            >
              Add transaction
            </Button>
          )}
          <Dialog
            open={transferParam === 'new' && txParam === null}
            onOpenChange={(open) => {
              if (open) {
                transferDialog.open('new');
              } else {
                transferDialog.close();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button variant="outline">Transfer</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Transfer funds</DialogTitle>
              </DialogHeader>
              <TransferForm
                wallets={wallets}
                walletsPending={walletsQuery.isPending}
                onSuccess={() => {
                  transferDialog.close();
                  void invalidateFinancialData(queryClient);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <FormAlert message={error} />

      <div className="flex flex-wrap gap-3">
        <Input
          type="search"
          placeholder="Search description…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-xs"
          aria-label="Search transactions"
        />
        <DateRangeButton value={datePreset} onChange={setDatePreset} />
        <FilterDropdown
          label="Wallet"
          value={walletFilter}
          onChange={setWalletFilter}
          ariaLabel="Filter by wallet"
          options={[
            { value: '', label: 'All wallets' },
            ...wallets.map((w) => ({ value: w.id, label: w.name })),
          ]}
        />
        <FilterDropdown
          label="Category"
          value={categoryFilter}
          onChange={setCategoryFilter}
          ariaLabel="Filter by category"
          options={[
            { value: '', label: 'All categories' },
            ...categories.map((c) => ({ value: c.id, label: c.name })),
          ]}
        />
        <FilterDropdown
          label="Type"
          value={typeFilter}
          onChange={(v) => setTypeFilter(v as 'all' | 'income' | 'expense')}
          ariaLabel="Filter by type"
          options={[
            { value: 'all', label: 'All types' },
            { value: 'income', label: 'Income' },
            { value: 'expense', label: 'Expense' },
          ]}
        />
        {datePreset === 'custom' && (
          <>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              aria-label="From date"
              className="w-full sm:max-w-[160px]"
            />
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              aria-label="To date"
              className="w-full sm:max-w-[160px]"
            />
          </>
        )}
      </div>

      {initialLoading ? (
        <div className="space-y-6">
          {[6, 3].map((rowCount, groupIndex) => (
            <div key={groupIndex} className="mb-4">
              <div
                data-testid="period-header-skeleton"
                className="sticky top-[70px] z-10 mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg border-2 border-border bg-card px-3 py-2 shadow-md md:top-8 md:flex-nowrap md:gap-3"
              >
                <Skeleton className="h-4 w-28" />
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
              <div className="memphis-card overflow-hidden rounded-2xl">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Wallet</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Description
                      </TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: rowCount }).map((_, i) => (
                      <SkeletonRow key={i} />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))}
        </div>
      ) : !loadingMore && wallets.length === 0 ? (
        <div className="memphis-card rounded-2xl p-8 text-center">
          <p className="text-lg font-medium">You have no wallets yet.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your first wallet to start tracking transactions.
          </p>
          <Button className="mt-4" onClick={() => setWizardOpen(true)}>
            Create your first wallet
          </Button>
        </div>
      ) : !loadingMore && categories.length === 0 ? (
        <div className="memphis-card rounded-2xl p-8 text-center">
          <p className="text-lg font-medium">You have no categories yet.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your first category to organize spending.
          </p>
          <Button className="mt-4" onClick={() => setWizardOpen(true)}>
            Create your first category
          </Button>
        </div>
      ) : transactions.length === 0 ? (
        <div className="memphis-card rounded-2xl p-8 text-center">
          <p className="text-muted-foreground">No transactions found.</p>
          <Button className="mt-4" onClick={() => txDialog.open()}>
            Add your first transaction
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {groups.map((group, groupIndex) => (
              <div key={group.key} className="mb-4">
                <div className="sticky top-[70px] z-10 mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-2 border-border bg-card rounded-lg px-3 py-2 md:top-8 md:flex-nowrap md:gap-3 shadow-md transition-shadow duration-200 hover:shadow-lg">
                  <h2
                    data-testid="period-header"
                    className="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {group.label}
                  </h2>
                  {summaryQuery.isPending ? (
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ) : (
                    summaryMap.get(group.key) && (
                      <div className="flex flex-wrap items-baseline gap-3">
                        {summaryMap.get(group.key)?.map((item) => (
                          <div
                            key={item.currency}
                            className="flex items-baseline gap-1"
                          >
                            <Money
                              amount={item.amount}
                              currency={item.currency}
                              className="font-semibold"
                            />
                            <span className="text-xs text-muted-foreground uppercase">
                              {item.currency}
                            </span>
                          </div>
                        ))}
                      </div>
                    )
                  )}
                </div>
                <div className="memphis-card rounded-2xl overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Wallet</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="hidden md:table-cell">
                          Description
                        </TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.items.map((tx) => {
                        const cat = tx.categoryId
                          ? categoryMap.get(tx.categoryId)
                          : null;
                        const wallet = walletMap.get(tx.walletId);
                        return (
                          <TableRow
                            key={tx.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => txDialog.open(tx.id)}
                          >
                            <TableCell>
                              {formatDate(tx.date, datePreset)}
                            </TableCell>
                            <TableCell>
                              <ContextMenu>
                                <ContextMenuTrigger
                                  className="cursor-context-menu inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                                  style={{
                                    backgroundColor:
                                      (wallet?.color ?? '#71717a') + '20',
                                    color: wallet?.color ?? '#71717a',
                                  }}
                                  {...makeLongPressHandlers(() =>
                                    walletDialog.open(tx.walletId),
                                  )}
                                >
                                  {wallet?.name ?? 'Unknown'}
                                </ContextMenuTrigger>
                                <ContextMenuContent>
                                  <ContextMenuItem
                                    onClick={() =>
                                      walletDialog.open(tx.walletId)
                                    }
                                  >
                                    View wallet details
                                  </ContextMenuItem>
                                </ContextMenuContent>
                              </ContextMenu>
                            </TableCell>
                            <TableCell>
                              {cat ? (
                                <ContextMenu>
                                  <ContextMenuTrigger
                                    className="cursor-context-menu inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                                    style={{
                                      backgroundColor: cat.color + '20',
                                      color: cat.color,
                                    }}
                                    {...makeLongPressHandlers(() =>
                                      categoryDialog.open(cat.id),
                                    )}
                                  >
                                    {cat.name}
                                  </ContextMenuTrigger>
                                  <ContextMenuContent>
                                    <ContextMenuItem
                                      onClick={() =>
                                        categoryDialog.open(cat.id)
                                      }
                                    >
                                      View category details
                                    </ContextMenuItem>
                                  </ContextMenuContent>
                                </ContextMenu>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              {tx.description || '—'}
                            </TableCell>
                            <TableCell className="text-right">
                              <Money
                                amount={tx.amount}
                                currency={wallet?.currency ?? 'USD'}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {loadingMore &&
                        groupIndex === groups.length - 1 &&
                        Array.from({ length: 3 }).map((_, i) => (
                          <SkeletonRow key={`loading-more-${i}`} />
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}
          </div>

          <div
            ref={sentinelRef}
            aria-hidden={!hasMore}
            className="h-px w-full"
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {transactions.length} of {total} transactions
            </span>
            {!hasMore && transactions.length > 0 && (
              <span>You&apos;re all caught up.</span>
            )}
          </div>
        </>
      )}

      <Dialog
        open={editTxId !== null}
        onOpenChange={(open) => {
          if (!open) txDialog.close();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit transaction</DialogTitle>
          </DialogHeader>
          {editTx ? (
            <TransactionForm
              wallets={wallets}
              categories={categories.map((c) => ({
                id: c.id,
                name: c.name,
                color: c.color,
                icon: c.icon,
              }))}
              walletsPending={walletsQuery.isPending}
              categoriesPending={categoriesQuery.isPending}
              onSuccess={() => {
                txDialog.close();
                void invalidateFinancialData(queryClient);
              }}
              onRefreshWallets={() => void invalidateFinancialData(queryClient)}
              onRefreshCategories={() =>
                void invalidateFinancialData(queryClient)
              }
              onViewWallet={(id) => {
                walletDialog.open(id);
              }}
              onEditWallet={(wallet) => {
                walletDialog.open(wallet.id);
              }}
              onEditCategory={(category) => {
                categoryDialog.open(category.id);
              }}
              onCreateWallet={() => {
                setCreateWalletOpen(true);
              }}
              onCreateCategory={() => {
                setCreateCategoryOpen(true);
              }}
              onDelete={() => {
                txDialog.close();
                setDeleteError(null);
                const pair = findTransferPair(editTx, transactions);
                if (pair) {
                  setCascadeTx({ action: 'delete', tx: editTx, pair });
                } else {
                  setDeleteConfirm(editTx);
                }
              }}
              onClose={() => txDialog.close()}
              editMode
              editTxId={editTx.id}
              initialValues={{
                walletId: editTx.walletId,
                amount: editTx.amount,
                description: editTx.description,
                categoryId: editTx.categoryId ?? '',
                date: editTx.date,
              }}
            />
          ) : (
            <FormSkeleton rows={6} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteConfirm !== null}
        onOpenChange={(open) => {
          // Keep the dialog open while the delete is in flight: closing it
          // would unmount the FormAlert and swallow the failure error.
          if (!open && !deleting) {
            setDeleteConfirm(null);
            setDeleteError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete transaction</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this transaction? This action cannot
            be undone.
          </p>
          <FormAlert
            message={
              deleteConfirm && deleteError?.id === deleteConfirm.id
                ? deleteError.message
                : null
            }
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              disabled={deleting}
              onClick={() => {
                setDeleteConfirm(null);
                setDeleteError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={async () => {
                if (!deleteConfirm) return;
                const { id } = deleteConfirm;
                setDeleteError(null);
                setDeleting(true);
                try {
                  await deleteTransaction(id);
                  setDeleteConfirm(null);
                  void invalidateFinancialData(queryClient);
                } catch (err) {
                  setDeleteError({
                    id,
                    message:
                      err instanceof ApiError
                        ? err.message
                        : 'Failed to delete transaction.',
                  });
                } finally {
                  setDeleting(false);
                }
              }}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={cascadeTx !== null}
        onOpenChange={(open) => {
          // Keep the dialog open while a leg delete is in flight: closing it
          // would unmount the FormAlert and swallow the partial-failure error.
          if (!open && !deleting) {
            setCascadeTx(null);
            setDeleteError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {cascadeTx?.action === 'delete'
                ? 'Delete transfer leg'
                : 'Edit transfer leg'}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This transaction appears to be part of a transfer. Also{' '}
            {cascadeTx?.action === 'delete' ? 'delete' : 'update'} the paired
            transaction ({cascadeTx?.pair.description},{' '}
            {Number(cascadeTx?.pair.amount) > 0 ? '+' : ''}
            {cascadeTx?.pair.amount})?
          </p>
          <FormAlert
            message={
              cascadeTx && deleteError?.id === cascadeTx.tx.id
                ? deleteError.message
                : null
            }
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              disabled={deleting}
              onClick={async () => {
                if (!cascadeTx) return;
                const { tx } = cascadeTx;
                if (cascadeTx.action === 'delete') {
                  setDeleteError(null);
                  setDeleting(true);
                  try {
                    await deleteLegIgnoringNotFound(tx.id);
                  } catch (err) {
                    setDeleteError({
                      id: tx.id,
                      message:
                        err instanceof ApiError
                          ? err.message
                          : 'Failed to delete transaction.',
                    });
                    return;
                  } finally {
                    setDeleting(false);
                    // Refresh even on failure so the list drops any leg that
                    // did get deleted before the error.
                    void invalidateFinancialData(queryClient);
                  }
                }
                setCascadeTx(null);
              }}
            >
              No, just this one
            </Button>
            <Button
              disabled={deleting}
              onClick={async () => {
                if (!cascadeTx) return;
                const { tx, pair } = cascadeTx;
                if (cascadeTx.action === 'delete') {
                  setDeleteError(null);
                  setDeleting(true);
                  try {
                    await deleteLegIgnoringNotFound(tx.id);
                    await deleteLegIgnoringNotFound(pair.id);
                  } catch (err) {
                    setDeleteError({
                      id: tx.id,
                      message:
                        err instanceof ApiError
                          ? err.message
                          : 'Failed to delete transaction.',
                    });
                    return;
                  } finally {
                    setDeleting(false);
                    // Refresh even on failure so the list drops any leg that
                    // did get deleted before the error.
                    void invalidateFinancialData(queryClient);
                  }
                }
                setCascadeTx(null);
              }}
            >
              Yes, {cascadeTx?.action === 'delete' ? 'delete' : 'update'} both
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <WalletModal
        walletId={
          walletParam === 'new' ? undefined : (walletParam ?? undefined)
        }
        open={walletParam !== null}
        onOpenChange={(open) => {
          if (!open) walletDialog.close();
        }}
        onSuccess={() => {
          walletDialog.close();
          void invalidateFinancialData(queryClient);
        }}
        onDelete={() => {
          walletDialog.close();
          void invalidateFinancialData(queryClient);
        }}
      />

      <WalletModal
        open={createWalletOpen}
        onOpenChange={setCreateWalletOpen}
        onSuccess={(newWallet) => {
          setCreateWalletOpen(false);
          if (newWallet) {
            setPendingWalletId(newWallet.id);
            void invalidateFinancialData(queryClient);
          }
        }}
      />

      <CategoryModal
        categoryId={
          categoryParam === 'new' ? undefined : (categoryParam ?? undefined)
        }
        open={categoryParam !== null}
        onOpenChange={(open) => {
          if (!open) categoryDialog.close();
        }}
        onSuccess={() => {
          categoryDialog.close();
          void invalidateFinancialData(queryClient);
        }}
        onDelete={() => {
          categoryDialog.close();
          void invalidateFinancialData(queryClient);
        }}
      />

      <CategoryModal
        open={createCategoryOpen}
        onOpenChange={setCreateCategoryOpen}
        onSuccess={(newCategory) => {
          setCreateCategoryOpen(false);
          if (newCategory) {
            setPendingCategoryId(newCategory.id);
            void invalidateFinancialData(queryClient);
          }
        }}
      />

      {wallets.length > 0 && categories.length > 0 && (
        <FloatingActionButton
          onClick={() => txDialog.open()}
          label="Add transaction"
        />
      )}
    </div>
  );
}
