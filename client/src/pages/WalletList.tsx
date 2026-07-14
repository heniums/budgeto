import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getWallets, deleteWallet, type WalletData } from '../api/wallets';

export function WalletList(): JSX.Element {
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getWallets()
      .then((res) => {
        if (!active) return;
        setWallets(res.wallets);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleDelete = async (wallet: WalletData): Promise<void> => {
    if (
      !window.confirm(
        `Delete wallet "${wallet.name}"? This cannot be undone.`,
      )
    ) {
      return;
    }
    try {
      await deleteWallet(wallet.id);
      setWallets((prev) => prev.filter((w) => w.id !== wallet.id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete wallet.',
      );
    }
  };

  return (
    <main>
      <h1>Wallets</h1>

      {error && (
        <div role="alert" className="form-error">
          {error}
        </div>
      )}

      <div style={{ marginBottom: '1rem' }}>
        <Link to="/settings/wallets/new">New Wallet</Link>
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
                  <Link
                    to={`/settings/wallets/${wallet.id}`}
                    className="wallet-name"
                  >
                    {wallet.name}
                  </Link>
                  <span className="wallet-balance">{wallet.balance}</span>
                </div>
                <button
                  type="button"
                  className="wallet-delete"
                  onClick={() => handleDelete(wallet)}
                  aria-label={`Delete ${wallet.name}`}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
