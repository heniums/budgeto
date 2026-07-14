import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getWallet, type WalletData } from '../api/wallets';
import { getTransactions, type TransactionData } from '../api/transactions';

export function WalletDetail(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    Promise.all([getWallet(id), getTransactions()])
      .then(([w, t]) => {
        if (!active) return;
        setWallet(w);
        setTransactions(t.transactions.filter((tx) => tx.walletId === id));
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
  }, [id]);

  if (!id) {
    return (
      <main>
        <Link to="/settings/wallets">Back to Wallets</Link>
      </main>
    );
  }

  if (loading) {
    return (
      <main>
        <p>Loading…</p>
      </main>
    );
  }

  if (error && !wallet) {
    return (
      <main>
        <div role="alert" className="form-error">
          {error}
        </div>
        <Link to="/settings/wallets">Back to Wallets</Link>
      </main>
    );
  }

  return (
    <main>
      <Link to="/settings/wallets">Back</Link>

      {wallet && (
        <>
          <section className="profile-card" style={{ marginTop: '1rem' }}>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: '1.5rem',
                  height: '1.5rem',
                  borderRadius: '50%',
                  background: wallet.color,
                  flexShrink: 0,
                }}
                aria-hidden
              />
              <div>
                <h1 style={{ margin: 0 }}>{wallet.name}</h1>
                {wallet.description && (
                  <p style={{ color: 'var(--color-muted)', margin: 0 }}>
                    {wallet.description}
                  </p>
                )}
              </div>
            </div>
            <p
              style={{ fontSize: '2rem', fontWeight: 700, margin: '1rem 0 0' }}
            >
              {wallet.balance}
            </p>
          </section>

          <div className="button-row">
            <Link to={`/settings/wallets/${id}/edit`}>Edit</Link>
          </div>

          <section style={{ marginTop: '1.5rem' }}>
            <h2>Transactions</h2>
            {transactions.length === 0 ? (
              <p>No transactions yet.</p>
            ) : (
              <ul className="wallet-list" role="list">
                {transactions.map((tx) => (
                  <li key={tx.id} className="profile-card">
                    <div className="wallet-row">
                      <div>
                        <strong>{tx.description || '—'}</strong>
                        <span
                          style={{
                            display: 'block',
                            color: 'var(--color-muted)',
                            fontSize: '0.85rem',
                          }}
                        >
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <span
                        style={{
                          fontWeight: 600,
                          color:
                            Number(tx.amount) >= 0
                              ? 'var(--color-success)'
                              : 'var(--color-error)',
                        }}
                      >
                        {tx.amount}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  );
}
