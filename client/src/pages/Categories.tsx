import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getCategories,
  deleteCategory,
  type CategoryData,
} from '../api/categories';
import { getIcon } from '../lib/icons';

export function Categories(): JSX.Element {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getCategories()
      .then((res) => {
        if (!active) return;
        setCategories(res.categories);
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

  const handleDelete = async (category: CategoryData): Promise<void> => {
    if (
      !window.confirm(
        `Delete category "${category.name}"? This cannot be undone.`,
      )
    ) {
      return;
    }
    try {
      await deleteCategory(category.id);
      setCategories((prev) => prev.filter((c) => c.id !== category.id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete category.',
      );
    }
  };

  return (
    <main>
      <h1>Categories</h1>

      {error && (
        <div role="alert" className="form-error">
          {error}
        </div>
      )}

      <div style={{ marginBottom: '1rem' }}>
        <Link to="/settings/categories/new">New Category</Link>
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
                    <span className="wallet-name">{category.name}</span>
                    <span className="wallet-balance">{category.type}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link
                      to={`/settings/categories/${category.id}/edit`}
                      className="wallet-delete"
                      style={{ color: 'var(--color-accent)' }}
                      aria-label={`Edit ${category.name}`}
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      className="wallet-delete"
                      onClick={() => handleDelete(category)}
                      aria-label={`Delete ${category.name}`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
