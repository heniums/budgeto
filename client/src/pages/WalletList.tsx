import { useEffect, useState } from 'react';
import { getWallets, type WalletData } from '../api/wallets';
import { Button } from '@/components/ui/button';
import { WalletModal } from '../components/WalletModal';

export function WalletList(): JSX.Element {
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<
    'create' | 'edit' | 'view' | null
  >(null);
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

  return (
    <main>
      <h1>Wallets</h1>

      {error && (
        <div role="alert" className="form-error">
          {error}
        </div>
      )}

      <div style={{ marginBottom: '1rem' }}>
        <Button onClick={() => setModalMode('create')}>New Wallet</Button>
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : wallets.length === 0 ? (
        <p>No wallets yet.</p>
      ) : (
        <ul className="wallet-list" role="list">
          {wallets.map((wallet) => (
            <li key={wallet.id} className="profile-card">
              <div className="wallet-row">
                <div className="wallet-info">
                  <span
                    className="wallet-color"
                    style={{ background: wallet.color }}
                    aria-hidden
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedWalletId(wallet.id);
                      setModalMode('view');
                    }}
                    className="wallet-name"
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
                  <span className="wallet-balance">{wallet.balance}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <WalletModal
        mode={modalMode ?? 'view'}
        open={modalMode !== null}
        onOpenChange={(open) => {
          if (!open) {
            setModalMode(null);
            setSelectedWalletId(null);
          }
        }}
        walletId={selectedWalletId ?? undefined}
        onSuccess={() => {
          setModalMode(null);
          setSelectedWalletId(null);
          load();
        }}
      />
    </main>
  );
}
