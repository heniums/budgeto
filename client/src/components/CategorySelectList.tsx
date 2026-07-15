import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { getIcon, ICONS } from '../lib/icons';
import { useLongPress } from '../hooks/use-long-press';
import { updateCategory, createCategory } from '../api/categories';
import { Plus, Grid3X3 } from 'lucide-react';

interface CategoryItem {
  id: string;
  name: string;
  color: string;
  icon: string;
  type: 'income' | 'expense';
}

interface CategorySelectListProps {
  categories: CategoryItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRefresh?: () => void;
}

function CategoryEditDialog({
  open,
  onOpenChange,
  category,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: CategoryItem;
  onSaved: () => void;
}): JSX.Element {
  const [name, setName] = useState(category.name);
  const [type, setType] = useState(category.type);
  const [color, setColor] = useState(category.color);
  const [icon, setIcon] = useState(category.icon);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (): Promise<void> => {
    setError(null);
    setSaving(true);
    try {
      await updateCategory(category.id, {
        name: name.trim(),
        type,
        color,
        icon,
      });
      onSaved();
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update category',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-cat-name">Name</Label>
            <Input
              id="edit-cat-name"
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
            <Label htmlFor="edit-cat-color">Color</Label>
            <input
              id="edit-cat-color"
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
                  style={{ color: icon === iconName ? color : undefined }}
                >
                  <Icon size={18} />
                </button>
              ))}
            </div>
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              type="button"
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !name.trim()}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CategoryCreateDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}): JSX.Element {
  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [color, setColor] = useState('#1f8a4c');
  const [icon, setIcon] = useState('Tag');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (): Promise<void> => {
    setError(null);
    setSaving(true);
    try {
      await createCategory({
        name: name.trim(),
        type,
        color,
        icon,
      });
      onSaved();
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create category',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Category</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="create-cat-name">Name</Label>
            <Input
              id="create-cat-name"
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
            <Label htmlFor="create-cat-color">Color</Label>
            <input
              id="create-cat-color"
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
                  style={{ color: icon === iconName ? color : undefined }}
                >
                  <Icon size={18} />
                </button>
              ))}
            </div>
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              type="button"
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !name.trim()}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CategoryViewAllDialog({
  open,
  onOpenChange,
  categories,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CategoryItem[];
  onSelect: (id: string) => void;
}): JSX.Element {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>All Categories</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-4 gap-2">
          {categories.map((category) => {
            const Icon = getIcon(category.icon);
            return (
              <button
                key={category.id}
                type="button"
                aria-label={category.name}
                title={category.name}
                style={{ color: category.color }}
                className="flex items-center justify-center p-3 rounded-md border hover:bg-muted cursor-pointer"
                onClick={() => {
                  onSelect(category.id);
                  onOpenChange(false);
                }}
              >
                {Icon && <Icon size={24} />}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CategorySelectList({
  categories,
  selectedId,
  onSelect,
  onRefresh,
}: CategorySelectListProps): JSX.Element {
  const [editCategory, setEditCategory] = useState<CategoryItem | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showViewAll, setShowViewAll] = useState(false);

  const handleSaved = (): void => {
    onRefresh?.();
  };

  if (categories.length === 0) {
    return (
      <div
        className="text-sm text-muted-foreground py-2"
        data-testid="category-select-list"
      >
        No categories yet
      </div>
    );
  }

  const handleKeyDown = (
    e: React.KeyboardEvent,
    index: number,
    category: CategoryItem,
  ): void => {
    const options = categories.length;
    let nextIndex: number | null = null;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (index + 1) % options;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (index - 1 + options) % options;
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (e.shiftKey) {
        setEditCategory(category);
      } else {
        onSelect(category.id);
      }
      return;
    }

    if (nextIndex !== null) {
      const nextEl = document.querySelector(
        `[data-category-index="${nextIndex}"]`,
      ) as HTMLElement | null;
      nextEl?.focus();
    }
  };

  return (
    <>
      <ScrollArea className="w-full" role="listbox">
        <div
          className="flex items-center gap-2 px-0.5 py-1"
          data-testid="category-select-list"
        >
          {categories.map((category, index) => {
            const isSelected = category.id === selectedId;
            const Icon = getIcon(category.icon);
            const longPress = useLongPress({
              onLongPress: () => setEditCategory(category),
            });

            return (
              <ContextMenu key={category.id}>
                <ContextMenuTrigger asChild>
                  <button
                    type="button"
                    data-testid="category-chip"
                    data-selected={isSelected ? 'true' : 'false'}
                    data-category-index={index}
                    role="option"
                    aria-selected={isSelected}
                    aria-label={category.name}
                    title={category.name}
                    tabIndex={0}
                    style={{ color: category.color }}
                    className={cn(
                      'flex items-center justify-center w-9 h-9 rounded-full border-2 border-transparent cursor-pointer shrink-0 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 select-none',
                      isSelected
                        ? 'border-current bg-current/15'
                        : 'hover:bg-muted',
                    )}
                    onClick={() => onSelect(category.id)}
                    onKeyDown={(e) => handleKeyDown(e, index, category)}
                    {...longPress}
                  >
                    {Icon && <Icon size={18} />}
                  </button>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem
                    onClick={() => setEditCategory(category)}
                  >
                    Edit
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            );
          })}
          {onRefresh && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 h-7 w-7"
                onClick={() => setShowCreate(true)}
                aria-label="Add category"
              >
                <Plus size={16} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 h-7 w-7"
                onClick={() => setShowViewAll(true)}
                aria-label="View all categories"
              >
                <Grid3X3 size={16} />
              </Button>
            </>
          )}
        </div>
      </ScrollArea>

      {editCategory && (
        <CategoryEditDialog
          open={!!editCategory}
          onOpenChange={(open) => {
            if (!open) setEditCategory(null);
          }}
          category={editCategory}
          onSaved={handleSaved}
        />
      )}

      <CategoryCreateDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onSaved={handleSaved}
      />

      <CategoryViewAllDialog
        open={showViewAll}
        onOpenChange={setShowViewAll}
        categories={categories}
        onSelect={onSelect}
      />
    </>
  );
}
