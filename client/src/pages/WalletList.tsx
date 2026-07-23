import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  getWallets,
  deleteWallet,
  adjustBalance,
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

export function WalletList(): JSX.Element {
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view' | null>(
    null,
  );
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [adjustTarget, setAdjustTarget] = useState('');
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [adjusting, setAdjusting] = useState(false);

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

  const handleDelete = async (id: string, name: string): Promise<void> => {
    if (!window.confirm(`Delete wallet "${name}"? This cannot be undone.`))
      return;
    setDeleting(id);
    try {
      await deleteWallet(id);
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete wallet');
    } finally {
      setDeleting(null);
    }
  };

  const handleAdjust = async (walletId: string): Promise<void> => {
    setAdjustError(null);
    setAdjusting(true);
    try {
      await adjustBalance(walletId, { targetBalance: adjustTarget });
      setAdjustingId(null);
      setAdjustTarget('');
      load();
    } catch (err: unknown) {
      setAdjustError(
        err instanceof Error ? err.message : 'Failed to adjust balance',
      );
    } finally {
      setAdjusting(false);
    }
  };

  const formatDate = (iso: string): string => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <main>
      <h1>Wallets</h1>

      <FormAlert message={error} />

      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          marginBottom: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <Button onClick={() => setModalMode('create')}>New Wallet</Button>
        <div style={{ flex: 1, minWidth: '200px', maxWidth: '320px' }}>
          <Input
            type="search"
            placeholder="Search wallets…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search wallets"
          />
        </div>
      </div>

      {loading ? (
        <p>Loading…</p>
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground"
                  >
                    No wallets match your search.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((wallet) => (
                  <Fragment key={wallet.id}>
                    <TableRow
                      key={wallet.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        setSelectedWalletId(wallet.id);
                        setModalMode('view');
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
                              setModalMode('view');
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
                      <TableCell className="text-right">
                        <div
                          style={{
                            display: 'flex',
                            gap: '0.5rem',
                            justifyContent: 'flex-end',
                          }}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedWalletId(wallet.id);
                              setModalMode('edit');
                            }}
                            aria-label={`Edit ${wallet.name}`}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAdjustingId(
                                adjustingId === wallet.id ? null : wallet.id,
                              );
                              setAdjustTarget('');
                              setAdjustError(null);
                            }}
                            aria-label={`Adjust ${wallet.name}`}
                          >
                            Adjust
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(wallet.id, wallet.name)}
                            disabled={deleting === wallet.id}
                            aria-label={`Delete ${wallet.name}`}
                          >
                            {deleting === wallet.id ? 'Deleting…' : 'Delete'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {adjustingId === wallet.id && (
                      <TableRow key={`${wallet.id}-adjust`}>
                        <TableCell colSpan={6}>
                          <div
                            style={{
                              display: 'flex',
                              gap: '0.5rem',
                              alignItems: 'center',
                              padding: '0.5rem 0',
                            }}
                          >
                            <span className="text-sm text-muted-foreground">
                              Adjust to:
                            </span>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Target balance"
                              value={adjustTarget}
                              onChange={(e) => setAdjustTarget(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAdjust(wallet.id);
                              }}
                              style={{ maxWidth: '160px' }}
                              aria-label="Target balance"
                              disabled={adjusting}
                            />
                            <Button
                              size="sm"
                              onClick={() => handleAdjust(wallet.id)}
                              disabled={adjusting}
                            >
                              {adjusting ? 'Adjusting…' : 'Apply'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setAdjustingId(null);
                                setAdjustError(null);
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                          {adjustError && (
                            <p className="text-sm text-destructive">
                              {adjustError}
                            </p>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
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
    </main>
  );
}
