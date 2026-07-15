import { useEffect, useMemo, useState } from 'react';
import {
  getCategories,
  deleteCategory,
  type CategoryData,
} from '../api/categories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getIcon } from '../lib/icons';
import { CategoryModal } from '../components/CategoryModal';

export function Categories(): JSX.Element {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view' | null>(
    null,
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [deleting, setDeleting] = useState<string | null>(null);

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

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return categories;
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.type.toLowerCase().includes(q),
    );
  }, [categories, search]);

  const handleDelete = async (id: string, name: string): Promise<void> => {
    if (!window.confirm(`Delete category "${name}"? This cannot be undone.`))
      return;
    setDeleting(id);
    try {
      await deleteCategory(id);
      load();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete category',
      );
    } finally {
      setDeleting(null);
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
      <h1>Categories</h1>

      {error && (
        <div role="alert" className="form-error">
          {error}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          marginBottom: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <Button onClick={() => setModalMode('create')}>New Category</Button>
        <div style={{ flex: 1, minWidth: '200px', maxWidth: '320px' }}>
          <Input
            type="search"
            placeholder="Search categories…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search categories"
          />
        </div>
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : categories.length === 0 ? (
        <p>No categories yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Color</TableHead>
              <TableHead className="text-right">Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground"
                >
                  No categories match your search.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((category) => {
                const Icon = getIcon(category.icon);
                return (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        {Icon ? <Icon size={18} aria-hidden /> : null}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCategoryId(category.id);
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
                          {category.name}
                        </button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          category.type === 'income' ? 'default' : 'secondary'
                        }
                      >
                        {category.type}
                      </Badge>
                    </TableCell>
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
                            background: category.color,
                            flexShrink: 0,
                          }}
                          aria-hidden
                        />
                        <span className="text-sm text-muted-foreground">
                          {category.color}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {formatDate(category.createdAt)}
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
                            setSelectedCategoryId(category.id);
                            setModalMode('edit');
                          }}
                          aria-label={`Edit ${category.name}`}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            handleDelete(category.id, category.name)
                          }
                          disabled={deleting === category.id}
                          aria-label={`Delete ${category.name}`}
                        >
                          {deleting === category.id ? 'Deleting…' : 'Delete'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
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
