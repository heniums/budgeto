import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  createCategory,
  getCategory,
  updateCategory,
  deleteCategory,
  type CategoryData,
} from '../api/categories';
import { ApiError } from '../api/client';
import { ICONS, getIcon } from '../lib/icons';
import { cn } from '@/lib/utils';

export interface CategoryModalProps {
  mode: 'create' | 'edit' | 'view';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId?: string;
  onSuccess?: (category?: CategoryData) => void;
}

export function CategoryModal({
  mode,
  open,
  onOpenChange,
  categoryId,
  onSuccess,
}: CategoryModalProps): JSX.Element {
  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [color, setColor] = useState('#1f8a4c');
  const [icon, setIcon] = useState('Tag');
  const [category, setCategory] = useState<CategoryData | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCreate = mode === 'create';
  const isEdit = mode === 'edit';
  const isView = mode === 'view';

  useEffect(() => {
    if (!open) return;

    if (isCreate) {
      setLoading(false);
      setCategory(null);
      setName('');
      setType('expense');
      setColor('#1f8a4c');
      setIcon('Tag');
      setError(null);
      return;
    }

    if (!categoryId) return;

    let active = true;
    setLoading(true);
    setError(null);
    getCategory(categoryId)
      .then((c) => {
        if (!active) return;
        setCategory(c);
        setName(c.name);
        setType(c.type);
        setColor(c.color);
        setIcon(c.icon);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setError('Failed to load category.');
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, categoryId, isCreate]);

  const handleCreate = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const cat = await createCategory({
        name: name.trim(),
        type,
        color,
        icon,
      });
      onSuccess?.(cat);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Failed to save category.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!categoryId) return;
    setError(null);
    setSaving(true);
    try {
      await updateCategory(categoryId, {
        name: name.trim(),
        type,
        color,
        icon,
      });
      onSuccess?.();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Failed to save category.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!categoryId) return;
    setError(null);
    setSaving(true);
    try {
      await deleteCategory(categoryId);
      onSuccess?.();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Failed to delete category.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = isCreate ? handleCreate : handleUpdate;

  const FormIcon = getIcon(icon);
  const ViewIcon = category ? getIcon(category.icon) : undefined;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            {isCreate
              ? 'New Category'
              : isEdit
                ? 'Edit Category'
                : 'Category Details'}
          </SheetTitle>
        </SheetHeader>

        {loading && (
          <p className="text-muted-foreground mt-4">Loading…</p>
        )}

        {!loading && (isCreate || isEdit) && (
          <form onSubmit={handleSubmit} noValidate className="space-y-4 mt-6">
            {error && (
              <div
                role="alert"
                className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive"
              >
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="cat-modal-name">Name</Label>
              <Input
                id="cat-modal-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="expense"
                    checked={type === 'expense'}
                    onChange={() => setType('expense')}
                  />
                  Expense
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="income"
                    checked={type === 'income'}
                    onChange={() => setType('income')}
                  />
                  Income
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cat-modal-color">Color</Label>
              <input
                id="cat-modal-color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full h-10 rounded-md border border-input cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="grid grid-cols-6 gap-1">
                {ICONS.map(({ name: iconName, Icon }) => (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setIcon(iconName)}
                    aria-label={iconName}
                    className={cn(
                      'flex items-center justify-center p-2 rounded-md border-2',
                      icon === iconName
                        ? 'border-current'
                        : 'border-transparent hover:bg-muted',
                    )}
                    style={{
                      color: icon === iconName ? color : undefined,
                    }}
                  >
                    <Icon size={18} />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between gap-2">
              {isEdit && (
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  type="button"
                >
                  Delete
                </Button>
              )}
              <div
                className={`flex gap-2 ${isCreate ? 'ml-auto' : ''}`}
              >
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  type="button"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving || !name.trim()}
                >
                  {saving
                    ? isCreate
                      ? 'Creating…'
                      : 'Saving…'
                    : isCreate
                      ? 'Create'
                      : 'Save'}
                </Button>
              </div>
            </div>
          </form>
        )}

        {!loading && isView && category && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-3">
              {ViewIcon && (
                <span style={{ color: category.color }}>
                  <ViewIcon size={32} />
                </span>
              )}
              <div>
                <p className="font-semibold text-lg">{category.name}</p>
                <span
                  className="inline-block text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: category.color + '20',
                    color: category.color,
                  }}
                >
                  {category.type}
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
              }}
            >
              Close
            </Button>
          </div>
        )}

        {!loading && isView && error && (
          <p className="text-destructive mt-4">{error}</p>
        )}
      </SheetContent>
    </Sheet>
  );
}
