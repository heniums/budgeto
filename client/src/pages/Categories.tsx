import { useEffect, useMemo, useState } from 'react';
import { getCategories, type CategoryData } from '../api/categories';
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
import { getIcon } from '../lib/icons';
import { CategoryModal } from '../components/CategoryModal';
import { FormAlert } from '../components/FormAlert';
import { Skeleton } from '@/components/ui/skeleton';
import { FloatingActionButton } from '@/components/FloatingActionButton';

export function Categories(): JSX.Element {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
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

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, search]);

  const formatDate = (iso: string): string => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6 min-w-0 pb-20">
      <h1 className="text-2xl font-semibold text-foreground">Categories</h1>

      <FormAlert message={error} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button onClick={() => setModalMode('create')}>New Category</Button>
        <Input
          type="search"
          placeholder="Search categories…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-xs"
          aria-label="Search categories"
        />
      </div>

      {loading ? (
        <div className="rounded-md border px-2 py-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Color</TableHead>
                <TableHead className="hidden md:table-cell text-right">
                  Created
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-5 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-3 w-3 rounded-full" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-right">
                    <Skeleton className="ml-auto h-4 w-20" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : categories.length === 0 ? (
        <p>No categories yet.</p>
      ) : (
        <div className="rounded-md border px-2 py-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Color</TableHead>
                <TableHead className="hidden md:table-cell text-right">
                  Created
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-muted-foreground"
                  >
                    No categories match your search.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((category) => {
                  const Icon = getIcon(category.icon);
                  return (
                    <TableRow
                      key={category.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        setSelectedCategoryId(category.id);
                        setModalMode('edit');
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
                          {Icon ? <Icon size={18} aria-hidden /> : null}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCategoryId(category.id);
                              setModalMode('edit');
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
                      <TableCell className="hidden md:table-cell text-right text-muted-foreground text-sm">
                        {formatDate(category.createdAt)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
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
        onSuccess={(cat) => {
          setModalMode(null);
          setSelectedCategoryId(null);
          if (cat) {
            setCategories((prev) => {
              const exists = prev.some((c) => c.id === cat.id);
              if (exists) {
                return prev.map((c) => (c.id === cat.id ? cat : c));
              }
              return [...prev, cat];
            });
          } else {
            load();
          }
        }}
        onDelete={(id) => {
          setCategories((prev) => prev.filter((c) => c.id !== id));
          setModalMode(null);
          setSelectedCategoryId(null);
        }}
      />

      <FloatingActionButton
        onClick={() => setModalMode('create')}
        label="New Category"
      />
    </div>
  );
}
