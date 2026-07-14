import { useEffect, useMemo, useState } from 'react';
import { getTransactions, type TransactionData } from '../api/transactions';
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
import { OnboardingWizard } from '../components/OnboardingWizard';

const PAGE_SIZE = 10;

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
  const [wizardOpen, setWizardOpen] = useState(false);

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
                onSuccess={() => {
                  setTxOpen(false);
                  setPage(1);
                  load();
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
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground">No transactions found.</p>
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
                    <TableRow key={tx.id}>
                      <TableCell>{formatDate(tx.createdAt)}</TableCell>
                      <TableCell>{walletName(tx.walletId)}</TableCell>
                      <TableCell>
                        {cat ? (
                          <span
                            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{
                              backgroundColor: cat.color + '20',
                              color: cat.color,
                            }}
                          >
                            {cat.name}
                          </span>
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
    </div>
  );
}
