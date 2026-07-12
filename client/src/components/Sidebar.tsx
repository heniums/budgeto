import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getWallets, type WalletData } from '../api/wallets';

export function Sidebar(): JSX.Element {
  const { token } = useAuth();
  const location = useLocation();
  const [wallets, setWallets] = useState<WalletData[]>([]);

  useEffect(() => {
    if (!token) return;
    let active = true;
    getWallets(token)
      .then((res) => {
        if (!active) return;
        setWallets(res.wallets);
      })
      .catch(() => {
        if (!active) return;
      });
    return () => {
      active = false;
    };
  }, [token, location.pathname]);

  return (
    <aside className="sidebar">
      <nav>
        <h2 className="sidebar-heading">Wallets</h2>
        <ul className="sidebar-list" role="list">
          {wallets.map((w) => {
            const active = location.pathname === `/account/wallets/${w.id}`;
            return (
              <li key={w.id}>
                <Link
                  to={`/account/wallets/${w.id}`}
                  className={`sidebar-item ${active ? 'active' : ''}`}
                >
                  <span
                    className="wallet-color"
                    style={{ background: w.color }}
                    aria-hidden
                  />
                  <span className="sidebar-name">{w.name}</span>
                  <span className="wallet-balance">{w.balance}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <Link to="/account/wallets" className="sidebar-manage">
        Manage wallets
      </Link>
    </aside>
  );
}
