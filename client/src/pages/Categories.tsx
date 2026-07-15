import { useEffect, useState } from 'react';
import { getCategories, type CategoryData } from '../api/categories';
import { Button } from '@/components/ui/button';
import { getIcon } from '../lib/icons';
import { CategoryModal } from '../components/CategoryModal';

export function Categories(): JSX.Element {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view' | null>(
    null,
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );

  const load = (): void => {
    setLoading(true);
    setError(null);
    getCategories()
      .then((res) => {
        setCategories(res.categories);
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
      <h1>Categories</h1>

      {error && (
        <div role="alert" className="form-error">
          {error}
        </div>
      )}

      <div style={{ marginBottom: '1rem' }}>
        <Button onClick={() => setModalMode('create')}>New Category</Button>
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : categories.length === 0 ? (
        <p>No categories yet.</p>
      ) : (
        <ul className="wallet-list" role="list">
          {categories.map((category) => {
            const Icon = getIcon(category.icon);
            return (
              <li key={category.id} className="profile-card">
                <div className="wallet-row">
                  <div className="wallet-info">
                    {Icon ? (
                      <Icon size={20} className="wallet-icon" aria-hidden />
                    ) : null}
                    <span
                      className="wallet-color"
                      style={{ background: category.color }}
                      aria-hidden
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategoryId(category.id);
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
                      {category.name}
                    </button>
                    <span className="wallet-balance">{category.type}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategoryId(category.id);
                        setModalMode('edit');
                      }}
                      className="wallet-delete"
                      style={{ color: 'var(--color-accent)' }}
                      aria-label={`Edit ${category.name}`}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <CategoryModal
        open={modalMode !== null}
        onOpenChange={(open) => {
          if (!open) {
            setModalMode(null);
            setSelectedCategoryId(null);
          }
        }}
        categoryId={
          modalMode === 'create' ? undefined : (selectedCategoryId ?? undefined)
        }
        onSuccess={() => {
          setModalMode(null);
          setSelectedCategoryId(null);
          load();
        }}
      />
    </main>
  );
}
