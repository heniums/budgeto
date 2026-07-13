import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getWallet, type WalletData } from '../api/wallets';
import { getTransactions, type TransactionData } from '../api/transactions';
import { getCategories, type CategoryData } from '../api/categories';

export function Transactions(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    Promise.all([getWallet(id), getTransactions(id), getCategories()])
      .then(([w, t, c]) => {
        if (!active) return;
        setWallet(w);
        setTransactions(t.transactions);
        setCategories(c.categories);
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

  const categoryName = (categoryId: string | null): string | undefined =>
    categoryId ? categories.find((c) => c.id === categoryId)?.name : undefined;

  if (!id) {
    return (
      <main>
        <Link to="/account/wallets">Back to Wallets</Link>
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
        <Link to="/account/wallets">Back to Wallets</Link>
      </main>
    );
  }

  return (
    <main>
      <Link to={`/account/wallets/${id}`}>Back</Link>

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

          <div className="button-row" style={{ marginTop: '1rem' }}>
            <Link to={`/account/wallets/${id}/transactions/new`}>
              Add transaction
            </Link>
            <Link to={`/account/wallets/${id}/transfer`}>Transfer</Link>
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
                        {categoryName(tx.categoryId) && (
                          <span
                            style={{
                              display: 'block',
                              color: 'var(--color-muted)',
                              fontSize: '0.85rem',
                            }}
                          >
                            {categoryName(tx.categoryId)}
                          </span>
                        )}
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
