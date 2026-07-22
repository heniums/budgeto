import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import {
  getTransactions,
  type TransactionData,
  type TransactionQuery,
  deleteTransaction,
} from '../api/transactions';
import { getWallets, type WalletData } from '../api/wallets';
import { getCategories, type CategoryData } from '../api/categories';
import { ApiError } from '../api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
} from '@/components/ui/dialog';
import { TransactionForm } from '../components/TransactionForm';
import { TransactionDetailDialog } from '../components/TransactionDetailDialog';
import { FormAlert } from '../components/FormAlert';
import { TransferForm } from '../components/TransferForm';
import { findTransferPair } from '../lib/transferPair';
import { OnboardingWizard } from '../components/OnboardingWizard';
import { WalletModal } from '../components/WalletModal';
import { CategoryModal } from '../components/CategoryModal';
import { DateRangeButton } from '../components/DateRangeButton';
import { Money } from '../components/Money';
import { formatPeriodLabel, periodKey, type DatePreset } from '@/lib/dateRange';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from '@/components/ui/context-menu';

const PAGE_SIZE = 20;

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

function formatDate(iso: string): string {
  if (!iso) return '';
  return dayjs(iso).format('M/D/YYYY');
}

interface PeriodGroup {
  key: string;
  label: string;
  items: TransactionData[];
}

export function Home(): JSX.Element {
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [total, setTotal] = useState(0);
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingMoreRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

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

  const [txOpen, setTxOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [editTx, setEditTx] = useState<TransactionData | null>(null);
  const [detailTx, setDetailTx] = useState<TransactionData | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<TransactionData | null>(
    null,
  );
  const [cascadeTx, setCascadeTx] = useState<{
    action: 'delete' | 'edit';
    tx: TransactionData;
    pair: TransactionData;
  } | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [detailWalletId, setDetailWalletId] = useState<string | null>(null);
  const [detailCategoryId, setDetailCategoryId] = useState<string | null>(null);
  const [createWalletOpen, setCreateWalletOpen] = useState(false);
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);
  const [pendingWalletId, setPendingWalletId] = useState<string | null>(null);
  const [pendingCategoryId, setPendingCategoryId] = useState<string | null>(
    null,
  );

  // Debounce the free-text search so we don't hit the API on every keystroke.
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(handle);
  }, [search]);

  const buildQuery = useCallback(
    (offset: number): TransactionQuery => {
      const query: TransactionQuery = { limit: PAGE_SIZE, offset };
      if (datePreset === 'custom') {
        if (fromDate) {
          query.from = dayjs(`${fromDate}T00:00:00`).toISOString();
        }
        if (toDate) {
          query.to = dayjs(`${toDate}T23:59:59.999`).toISOString();
        }
      }
      if (walletFilter) query.walletId = walletFilter;
      if (categoryFilter) query.categoryId = categoryFilter;
      if (typeFilter !== 'all') query.type = typeFilter;
      if (debouncedSearch) query.search = debouncedSearch;
      return query;
    },
    [
      datePreset,
      fromDate,
      toDate,
      walletFilter,
      categoryFilter,
      typeFilter,
      debouncedSearch,
    ],
  );

  const loadInitial = useCallback(() => {
    setInitialLoading(true);
    setError(null);
    getTransactions(buildQuery(0))
      .then((result) => {
        setTransactions(result.transactions);
        setTotal(result.total);
      })
      .catch((err: unknown) => {
        setError(
          err instanceof ApiError
            ? err.message
            : 'Failed to load transactions.',
        );
      })
      .finally(() => setInitialLoading(false));
  }, [buildQuery]);

  // Guard concurrent loads with a ref (not just state): two synchronous
  // observer fires can otherwise both slip past the `loadingMore` state guard
  // (state updates are async) and append a duplicate page.
  const loadMore = useCallback(() => {
    if (loadingMoreRef.current || transactions.length >= total) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    getTransactions(buildQuery(transactions.length))
      .then((result) => {
        setTransactions((prev) => [...prev, ...result.transactions]);
      })
      .catch((err: unknown) => {
        setError(
          err instanceof ApiError
            ? err.message
            : 'Failed to load transactions.',
        );
      })
      .finally(() => {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      });
  }, [transactions.length, total, buildQuery]);

  // Reload reference data (wallets/categories) and the transaction list together.
  const reload = useCallback(() => {
    Promise.all([getWallets(), getCategories()])
      .then(([walletResult, catResult]) => {
        setWallets(walletResult.wallets);
        setCategories(catResult.categories);
      })
      .catch(() => {
        // Reference-data failures are non-fatal for the list reload.
      })
      .finally(() => loadInitial());
  }, [loadInitial]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getWallets(), getCategories()])
      .then(([walletResult, catResult]) => {
        if (cancelled) return;
        setWallets(walletResult.wallets);
        setCategories(catResult.categories);
        if (
          walletResult.wallets.length === 0 &&
          localStorage.getItem('budgeto:wizardDismissed') !== 'true'
        ) {
          setWizardOpen(true);
        }
      })
      .catch(() => {
        // Ignore — the transaction list effect will surface real errors.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

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

  const walletName = (walletId: string): string =>
    wallets.find((w) => w.id === walletId)?.name ?? 'Unknown';

  const walletCurrency = (walletId: string): string =>
    wallets.find((w) => w.id === walletId)?.currency ?? 'USD';

  const categoryMap = useMemo(() => {
    const map = new Map<string, CategoryData>();
    for (const c of categories) {
      map.set(c.id, c);
    }
    return map;
  }, [categories]);

  const groups = useMemo<PeriodGroup[]>(() => {
    const result: PeriodGroup[] = [];
    for (const tx of transactions) {
      const key = periodKey(tx.date, datePreset);
      const last = result[result.length - 1];
      if (last && last.key === key) {
        last.items.push(tx);
      } else {
        result.push({
          key,
          label: formatPeriodLabel(tx.date, datePreset),
          items: [tx],
        });
      }
    }
    return result;
  }, [transactions, datePreset]);

  const hasMore = transactions.length < total;

  return (
    <div className="space-y-6">
      <OnboardingWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onComplete={() => {
          setWizardOpen(false);
          reload();
        }}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-foreground">Transactions</h1>
        <div className="flex gap-2">
          {wallets.length > 0 && categories.length > 0 ? (
            <Dialog open={txOpen} onOpenChange={setTxOpen}>
              <DialogTrigger asChild>
                <Button>Add transaction</Button>
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
                  autoSelectWalletId={
                    pendingWalletId ?? wallets[0]?.id ?? undefined
                  }
                  autoSelectCategoryId={
                    pendingCategoryId ?? categories[0]?.id ?? undefined
                  }
                  onSuccess={() => {
                    setTxOpen(false);
                    setPendingWalletId(null);
                    setPendingCategoryId(null);
                    reload();
                  }}
                  onRefreshWallets={reload}
                  onRefreshCategories={reload}
                  onClose={() => setTxOpen(false)}
                  onCreateWallet={() => {
                    setCreateWalletOpen(true);
                  }}
                  onCreateCategory={() => {
                    setCreateCategoryOpen(true);
                  }}
                  onViewWallet={(id) => {
                    setDetailWalletId(id);
                  }}
                  onEditWallet={(wallet) => {
                    setDetailWalletId(wallet.id);
                  }}
                  onEditCategory={(category) => {
                    setDetailCategoryId(category.id);
                  }}
                />
              </DialogContent>
            </Dialog>
          ) : (
            <Button
              disabled
              title="You need at least one wallet and one category to add a transaction"
            >
              Add transaction
            </Button>
          )}
          <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Transfer</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Transfer funds</DialogTitle>
              </DialogHeader>
              <TransferForm
                wallets={wallets}
                onSuccess={() => {
                  setTransferOpen(false);
                  reload();
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
          className="max-w-xs"
          aria-label="Search transactions"
        />
        <DateRangeButton value={datePreset} onChange={setDatePreset} />
        <select
          value={walletFilter}
          onChange={(e) => setWalletFilter(e.target.value)}
          aria-label="Filter by wallet"
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">All wallets</option>
          {wallets.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          aria-label="Filter by category"
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) =>
            setTypeFilter(e.target.value as 'all' | 'income' | 'expense')
          }
          aria-label="Filter by type"
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        {datePreset === 'custom' && (
          <>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              aria-label="From date"
              className="max-w-[160px]"
            />
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              aria-label="To date"
              className="max-w-[160px]"
            />
          </>
        )}
      </div>

      {initialLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : !loadingMore && wallets.length === 0 ? (
        <div className="rounded-md border p-8 text-center">
          <p className="text-lg font-medium">You have no wallets yet.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your first wallet to start tracking transactions.
          </p>
          <Button className="mt-4" onClick={() => setWizardOpen(true)}>
            Create your first wallet
          </Button>
        </div>
      ) : !loadingMore && categories.length === 0 ? (
        <div className="rounded-md border p-8 text-center">
          <p className="text-lg font-medium">You have no categories yet.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your first category to organize spending.
          </p>
          <Button className="mt-4" onClick={() => setWizardOpen(true)}>
            Create your first category
          </Button>
        </div>
      ) : transactions.length === 0 ? (
        <div className="rounded-md border p-8 text-center">
          <p className="text-muted-foreground">No transactions found.</p>
          <Button className="mt-4" onClick={() => setTxOpen(true)}>
            Add your first transaction
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {groups.map((group) => (
              <div key={group.key}>
                <h2
                  data-testid="period-header"
                  className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  {group.label}
                </h2>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Wallet</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.items.map((tx) => {
                        const cat = tx.categoryId
                          ? categoryMap.get(tx.categoryId)
                          : null;
                        return (
                          <TableRow
                            key={tx.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => setDetailTx(tx)}
                          >
                            <TableCell>{formatDate(tx.date)}</TableCell>
                            <TableCell>
                              <ContextMenu>
                                <ContextMenuTrigger
                                  className="cursor-context-menu"
                                  {...makeLongPressHandlers(() =>
                                    setDetailWalletId(tx.walletId),
                                  )}
                                >
                                  {walletName(tx.walletId)}
                                </ContextMenuTrigger>
                                <ContextMenuContent>
                                  <ContextMenuItem
                                    onClick={() =>
                                      setDetailWalletId(tx.walletId)
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
                                      setDetailCategoryId(cat.id),
                                    )}
                                  >
                                    {cat.name}
                                  </ContextMenuTrigger>
                                  <ContextMenuContent>
                                    <ContextMenuItem
                                      onClick={() =>
                                        setDetailCategoryId(cat.id)
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
                            <TableCell>{tx.description || '—'}</TableCell>
                            <TableCell className="text-right">
                              <Money
                                amount={tx.amount}
                                currency={walletCurrency(tx.walletId)}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
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
            {loadingMore && <span>Loading more…</span>}
            {!hasMore && transactions.length > 0 && (
              <span>You&apos;re all caught up.</span>
            )}
          </div>
        </>
      )}

      <Dialog
        open={editTx !== null}
        onOpenChange={(open) => {
          if (!open) setEditTx(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit transaction</DialogTitle>
          </DialogHeader>
          {editTx && (
            <TransactionForm
              wallets={wallets}
              categories={categories.map((c) => ({
                id: c.id,
                name: c.name,
                color: c.color,
                icon: c.icon,
              }))}
              onSuccess={() => {
                setEditTx(null);
                reload();
              }}
              onRefreshWallets={reload}
              onRefreshCategories={reload}
              onViewWallet={(id) => {
                setDetailWalletId(id);
              }}
              onEditWallet={(wallet) => {
                setDetailWalletId(wallet.id);
              }}
              onEditCategory={(category) => {
                setDetailCategoryId(category.id);
              }}
              onCreateWallet={() => {
                setCreateWalletOpen(true);
              }}
              onCreateCategory={() => {
                setCreateCategoryOpen(true);
              }}
              onDelete={() => {
                setEditTx(null);
                const pair = findTransferPair(editTx, transactions);
                if (pair) {
                  setCascadeTx({ action: 'delete', tx: editTx, pair });
                } else {
                  setDeleteConfirm(editTx);
                }
              }}
              onClose={() => setEditTx(null)}
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
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteConfirm !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirm(null);
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
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (deleteConfirm) {
                  await deleteTransaction(deleteConfirm.id);
                  setDeleteConfirm(null);
                  reload();
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
          if (!open) setCascadeTx(null);
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
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                if (!cascadeTx) return;
                if (cascadeTx.action === 'delete') {
                  await deleteTransaction(cascadeTx.tx.id);
                }
                setCascadeTx(null);
                reload();
              }}
            >
              No, just this one
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!cascadeTx) return;
                if (cascadeTx.action === 'delete') {
                  await deleteTransaction(cascadeTx.tx.id);
                  await deleteTransaction(cascadeTx.pair.id);
                }
                setCascadeTx(null);
                reload();
              }}
            >
              Yes, {cascadeTx?.action === 'delete' ? 'delete' : 'update'} both
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {detailTx && (
        <TransactionDetailDialog
          open={detailTx !== null}
          onOpenChange={(open) => {
            if (!open) setDetailTx(null);
          }}
          transaction={detailTx}
          walletName={walletName(detailTx.walletId)}
          walletCurrency={walletCurrency(detailTx.walletId)}
          categoryColor={
            detailTx.categoryId
              ? categoryMap.get(detailTx.categoryId)?.color
              : undefined
          }
          onEdit={() => {
            setEditTx(detailTx);
            setDetailTx(null);
          }}
          onDelete={() => {
            const tx = detailTx;
            setDetailTx(null);
            const pair = findTransferPair(tx, transactions);
            if (pair) {
              setCascadeTx({ action: 'delete', tx, pair });
            } else {
              setDeleteConfirm(tx);
            }
          }}
        />
      )}

      <WalletModal
        walletId={detailWalletId ?? undefined}
        open={detailWalletId !== null}
        onOpenChange={(open) => {
          if (!open) setDetailWalletId(null);
        }}
        onSuccess={() => {
          setDetailWalletId(null);
          reload();
        }}
      />

      <WalletModal
        open={createWalletOpen}
        onOpenChange={setCreateWalletOpen}
        onSuccess={(newWallet) => {
          setCreateWalletOpen(false);
          if (newWallet) setPendingWalletId(newWallet.id);
          reload();
        }}
      />

      <CategoryModal
        categoryId={detailCategoryId ?? undefined}
        open={detailCategoryId !== null}
        onOpenChange={(open) => {
          if (!open) setDetailCategoryId(null);
        }}
        onSuccess={() => {
          setDetailCategoryId(null);
          reload();
        }}
      />

      <CategoryModal
        open={createCategoryOpen}
        onOpenChange={setCreateCategoryOpen}
        onSuccess={(newCategory) => {
          setCreateCategoryOpen(false);
          if (newCategory) setPendingCategoryId(newCategory.id);
          reload();
        }}
      />
    </div>
  );
}
