import { useEffect, useMemo, useState } from 'react';
import {
  getWallets,
  type WalletData,
} from '../api/wallets';
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
import { WalletModal } from '../components/WalletModal';
import { Money } from '../components/Money';
import { FormAlert } from '../components/FormAlert';
import { Skeleton } from '@/components/ui/skeleton';

export function WalletList(): JSX.Element {
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const load = (): void => {
    setLoading(true);
    setError(null);
    getWallets()
      .then((res) => {
        setWallets(res.wallets);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return wallets;
    return wallets.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        (w.description && w.description.toLowerCase().includes(q)),
    );
  }, [wallets, search]);



  const formatDate = (iso: string): string => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6 min-w-0">
      <h1 className="text-2xl font-semibold text-foreground">Wallets</h1>

      <FormAlert message={error} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button onClick={() => setModalMode('create')}>New Wallet</Button>
        <Input
          type="search"
          placeholder="Search wallets…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-xs"
          aria-label="Search wallets"
        />
      </div>

      {loading ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-right">Currency</TableHead>
                <TableHead className="text-right">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-3 w-3 rounded-full" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-36" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="ml-auto h-4 w-20" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="ml-auto h-4 w-10" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="ml-auto h-4 w-20" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : wallets.length === 0 ? (
        <p>No wallets yet.</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-right">Currency</TableHead>
                <TableHead className="text-right">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground"
                  >
                    No wallets match your search.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((wallet) => (
                  <TableRow
                      key={wallet.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        setSelectedWalletId(wallet.id);
                        setModalMode('edit');
                      }}
                    >
                      <TableCell>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                          }}
                        >
                          <span
                            style={{
                              display: 'inline-block',
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              background: wallet.color,
                              flexShrink: 0,
                            }}
                            aria-hidden
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedWalletId(wallet.id);
                              setModalMode('edit');
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: 'inherit',
                              textDecoration: 'underline',
                              padding: 0,
                              font: 'inherit',
                            }}
                          >
                            {wallet.name}
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {wallet.description || '—'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <Money
                          amount={wallet.balance}
                          currency={wallet.currency}
                        />
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {wallet.currency}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm">
                        {formatDate(wallet.createdAt)}
                      </TableCell>
                    </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <WalletModal
        open={modalMode !== null}
        onOpenChange={(open) => {
          if (!open) {
            setModalMode(null);
            setSelectedWalletId(null);
          }
        }}
        walletId={
          modalMode === 'create' ? undefined : (selectedWalletId ?? undefined)
        }
        onSuccess={() => {
          setModalMode(null);
          setSelectedWalletId(null);
          load();
        }}
      />
    </div>
  );
}
