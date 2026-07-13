import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getWallets, type WalletData } from '../api/wallets';

export function Dashboard(): JSX.Element {
  const navigate = useNavigate();
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getWallets()
      .then((res) => {
        if (!active) return;
        setWallets(res.wallets);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const totalBalance = wallets
    .reduce((sum, w) => sum + Number(w.balance), 0)
    .toFixed(2);

  return (
    <main className="dashboard">
      <h1>Dashboard</h1>

      <div className="dashboard-total">
        <span className="total-label">Total Balance</span>
        <span className="total-value">{totalBalance}</span>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <Link to="/account/wallets">Manage Wallets</Link>
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : wallets.length === 0 ? (
        <p>
          No wallets yet.{' '}
          <Link to="/account/wallets/new">Create one</Link>
        </p>
      ) : (
        <div className="dashboard-cards">
          {wallets.map((wallet) => (
            <button
              key={wallet.id}
              type="button"
              className="dashboard-card"
              onClick={() => navigate(`/account/wallets/${wallet.id}`)}
            >
              <span
                className="wallet-color"
                style={{ background: wallet.color }}
                aria-hidden
              />
              <span className="card-name">{wallet.name}</span>
              <span className="card-balance">{wallet.balance}</span>
            </button>
          ))}
        </div>
      )}
    </main>
  );
}
