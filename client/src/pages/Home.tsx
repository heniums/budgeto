import { useEffect, useMemo, useState } from 'react';
import { getTransactions, type TransactionData, deleteTransaction } from '../api/transactions';
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
import { TransferForm } from '../components/TransferForm';
import { findTransferPair } from '../lib/transferPair';
import { OnboardingWizard } from '../components/OnboardingWizard';
import { WalletDetailSheet } from '../components/WalletDetailSheet';
import { CategoryDetailSheet } from '../components/CategoryDetailSheet';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from '@/components/ui/context-menu';

const PAGE_SIZE = 10;

function useLongPress(
  onLongPress: () => void,
  ms = 500,
): {
  onTouchStart: () => void;
  onTouchEnd: () => void;
  onTouchMove: () => void;
} {
  const timerRef = { current: null as ReturnType<typeof setTimeout> | null };
  return {
    onTouchStart: () => {
      timerRef.current = setTimeout(onLongPress, ms);
    },
    onTouchEnd: () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    onTouchMove: () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
  };
}

function formatAmount(amount: string): string {
  const n = Number(amount);
  const sign = n < 0 ? '-' : '';
  return `${sign}$${Math.abs(n).toFixed(2)}`;
}

function formatDate(iso: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString();
}

export function Home(): JSX.Element {
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [walletFilter, setWalletFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [txOpen, setTxOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [editTx, setEditTx] = useState<TransactionData | null>(null);
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

  const load = (): void => {
    setLoading(true);
    setError(null);
    Promise.all([getTransactions(), getWallets(), getCategories()])
      .then(([txResult, walletResult, catResult]) => {
        setTransactions(txResult.transactions);
        setWallets(walletResult.wallets);
        setCategories(catResult.categories);

        if (
          walletResult.wallets.length === 0 &&
          localStorage.getItem('budgeto:wizardDismissed') !== 'true'
        ) {
          setWizardOpen(true);
        }
      })
      .catch((err) => {
        setError(
          err instanceof ApiError
            ? err.message
            : 'Failed to load transactions.',
        );
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const walletName = (walletId: string): string =>
    wallets.find((w) => w.id === walletId)?.name ?? 'Unknown';

  const categoryMap = useMemo(() => {
    const map = new Map<string, CategoryData>();
    for (const c of categories) {
      map.set(c.id, c);
    }
    return map;
  }, [categories]);

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      if (walletFilter && tx.walletId !== walletFilter) return false;
      const amount = Number(tx.amount);
      if (typeFilter === 'income' && amount <= 0) return false;
      if (typeFilter === 'expense' && amount >= 0) return false;
      if (fromDate && new Date(tx.createdAt) < new Date(fromDate)) return false;
      if (toDate && new Date(tx.createdAt) > new Date(`${toDate}T23:59:59`))
        return false;
      if (
        search &&
        !tx.description.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      return true;
    });
  }, [transactions, walletFilter, typeFilter, fromDate, toDate, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <div className="space-y-6">
      <OnboardingWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onComplete={() => {
          setWizardOpen(false);
          load();
        }}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-foreground">Transactions</h1>
        <div className="flex gap-2">
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
                  type: c.type,
                  color: c.color,
                  icon: c.icon,
                }))}
                categoriesCount={categories.length}
                autoSelectWalletId={pendingWalletId ?? undefined}
                autoSelectCategoryId={pendingCategoryId ?? undefined}
                onSuccess={() => {
                  setTxOpen(false);
                  setPage(1);
                  setPendingWalletId(null);
                  setPendingCategoryId(null);
                  load();
                }}
                onRefreshWallets={load}
                onRefreshCategories={load}
                onCreateWallet={() => {
                  setCreateWalletOpen(true);
                }}
                onCreateCategory={() => {
                  setCreateCategoryOpen(true);
                }}
                onViewWallet={(id) => {
                  setDetailWalletId(id);
                }}
              />
            </DialogContent>
          </Dialog>
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
                  setPage(1);
                  load();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Input
          type="search"
          placeholder="Search description…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-xs"
          aria-label="Search transactions"
        />
        <select
          value={walletFilter}
          onChange={(e) => {
            setWalletFilter(e.target.value);
            setPage(1);
          }}
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
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by type"
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <Input
          type="date"
          value={fromDate}
          onChange={(e) => {
            setFromDate(e.target.value);
            setPage(1);
          }}
          aria-label="From date"
          className="max-w-[160px]"
        />
        <Input
          type="date"
          value={toDate}
          onChange={(e) => {
            setToDate(e.target.value);
            setPage(1);
          }}
          aria-label="To date"
          className="max-w-[160px]"
        />
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : !loading && wallets.length === 0 ? (
        <div className="rounded-md border p-8 text-center">
          <p className="text-lg font-medium">You have no wallets yet.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your first wallet to start tracking transactions.
          </p>
          <Button className="mt-4" onClick={() => setWizardOpen(true)}>
            Create your first wallet
          </Button>
        </div>
      ) : !loading && categories.length === 0 ? (
        <div className="rounded-md border p-8 text-center">
          <p className="text-lg font-medium">You have no categories yet.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your first category to organize spending.
          </p>
          <Button className="mt-4" onClick={() => setWizardOpen(true)}>
            Create your first category
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-md border p-8 text-center">
          <p className="text-muted-foreground">No transactions found.</p>
          <Button className="mt-4" onClick={() => setTxOpen(true)}>
            Add your first transaction
          </Button>
        </div>
      ) : (
        <>
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
                {pageItems.map((tx) => {
                  const amount = Number(tx.amount);
                  const cat = tx.categoryId
                    ? categoryMap.get(tx.categoryId)
                    : null;
                  return (
                    <TableRow
                      key={tx.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setEditTx(tx)}
                    >
                      <TableCell>{formatDate(tx.createdAt)}</TableCell>
                      <TableCell>
                        <ContextMenu>
                          <ContextMenuTrigger
                            className="cursor-context-menu"
                            {...useLongPress(() =>
                              setDetailWalletId(tx.walletId),
                            )}
                          >
                            {walletName(tx.walletId)}
                          </ContextMenuTrigger>
                          <ContextMenuContent>
                            <ContextMenuItem
                              onClick={() => setDetailWalletId(tx.walletId)}
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
                              {...useLongPress(() =>
                                setDetailCategoryId(cat.id),
                              )}
                            >
                              {cat.name}
                            </ContextMenuTrigger>
                            <ContextMenuContent>
                              <ContextMenuItem
                                onClick={() => setDetailCategoryId(cat.id)}
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
                      <TableCell
                        className={`text-right ${
                          amount < 0 ? 'text-destructive' : 'text-foreground'
                        }`}
                      >
                        {formatAmount(tx.amount)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{filtered.length} transactions</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setPage(currentPage - 1)}
              >
                Previous
              </Button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setPage(currentPage + 1)}
              >
                Next
              </Button>
            </div>
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
                type: c.type,
                color: c.color,
                icon: c.icon,
              }))}
              onSuccess={() => {
                setEditTx(null);
                setPage(1);
                load();
              }}
              onRefreshWallets={load}
              onRefreshCategories={load}
              onDelete={() => {
                setEditTx(null);
                const pair = findTransferPair(editTx, transactions);
                if (pair) {
                  setCascadeTx({ action: 'delete', tx: editTx, pair });
                } else {
                  setDeleteConfirm(editTx);
                }
              }}
              editMode
              editTxId={editTx.id}
              initialValues={{
                walletId: editTx.walletId,
                amount: editTx.amount,
                description: editTx.description,
                categoryId: editTx.categoryId ?? '',
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
            Are you sure you want to delete this transaction? This action
            cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (deleteConfirm) {
                  await deleteTransaction(deleteConfirm.id);
                  setDeleteConfirm(null);
                  setPage(1);
                  load();
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
                setPage(1);
                load();
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
                setPage(1);
                load();
              }}
            >
              Yes, {cascadeTx?.action === 'delete' ? 'delete' : 'update'} both
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <WalletDetailSheet
        walletId={detailWalletId ?? ''}
        open={detailWalletId !== null}
        onOpenChange={(open) => {
          if (!open) setDetailWalletId(null);
        }}
        onSuccess={() => {
          setDetailWalletId(null);
          load();
        }}
      />

      <WalletDetailSheet
        walletId=""
        open={createWalletOpen}
        onOpenChange={setCreateWalletOpen}
        onSuccess={(newWallet) => {
          setCreateWalletOpen(false);
          if (newWallet) setPendingWalletId(newWallet.id);
          load();
        }}
      />

      <CategoryDetailSheet
        categoryId={detailCategoryId ?? ''}
        open={detailCategoryId !== null}
        onOpenChange={(open) => {
          if (!open) setDetailCategoryId(null);
        }}
        onSuccess={() => {
          setDetailCategoryId(null);
          load();
        }}
      />

      <CategoryDetailSheet
        categoryId=""
        open={createCategoryOpen}
        onOpenChange={setCreateCategoryOpen}
        onSuccess={(newCategory) => {
          setCreateCategoryOpen(false);
          if (newCategory) setPendingCategoryId(newCategory.id);
          load();
        }}
      />
    </div>
  );
}
