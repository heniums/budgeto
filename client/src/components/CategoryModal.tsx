import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required.').max(128),
  type: z.enum(['income', 'expense']),
  color: z.string(),
  icon: z.string(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

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
  const [category, setCategory] = useState<CategoryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', type: 'expense', color: '#1f8a4c', icon: 'Tag' },
  });

  const selectedColor = watch('color');
  const selectedIcon = watch('icon');

  const isCreate = mode === 'create';
  const isEdit = mode === 'edit';
  const isView = mode === 'view';

  useEffect(() => {
    if (!open) return;

    if (isCreate) {
      setLoading(false);
      setCategory(null);
      reset({
        name: '',
        type: 'expense',
        color: '#1f8a4c',
        icon: 'Tag',
      });
      setFormError(null);
      return;
    }

    if (!categoryId) return;

    let active = true;
    setLoading(true);
    setFormError(null);
    getCategory(categoryId)
      .then((c) => {
        if (!active) return;
        setCategory(c);
        reset({
          name: c.name,
          type: c.type,
          color: c.color,
          icon: c.icon,
        });
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setFormError('Failed to load category.');
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, categoryId, isCreate, reset]);

  const onCreate = async (values: CategoryFormValues): Promise<void> => {
    setFormError(null);
    try {
      const cat = await createCategory({
        name: values.name.trim(),
        type: values.type,
        color: values.color,
        icon: values.icon,
      });
      onSuccess?.(cat);
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : 'Failed to save category.',
      );
    }
  };

  const onUpdate = async (values: CategoryFormValues): Promise<void> => {
    if (!categoryId) return;
    setFormError(null);
    try {
      await updateCategory(categoryId, {
        name: values.name.trim(),
        type: values.type,
        color: values.color,
        icon: values.icon,
      });
      onSuccess?.();
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : 'Failed to save category.',
      );
    }
  };

  const onSubmit = isCreate ? onCreate : onUpdate;

  const handleDelete = async (): Promise<void> => {
    if (!categoryId) return;
    setFormError(null);
    try {
      await deleteCategory(categoryId);
      onSuccess?.();
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : 'Failed to delete category.',
      );
    }
  };

  const ViewIcon = category ? getIcon(category.icon) : undefined;

  const title = isCreate
    ? 'New Category'
    : isEdit
      ? 'Edit Category'
      : 'Category Details';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>

        {loading && (
          <p className="text-muted-foreground mt-4">Loading…</p>
        )}

        {!loading && (isCreate || isEdit) && (
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="space-y-4 mt-6"
          >
            {formError && (
              <div
                role="alert"
                className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive"
              >
                {formError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="cat-modal-name">Name</Label>
              <Input
                id="cat-modal-name"
                type="text"
                {...register('name')}
              />
              {errors.name && (
                <span role="alert" className="text-sm text-destructive">
                  {errors.name.message}
                </span>
              )}
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="expense"
                    {...register('type')}
                  />
                  Expense
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="income"
                    {...register('type')}
                  />
                  Income
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cat-modal-color">Color</Label>
              <Input
                id="cat-modal-color"
                type="color"
                {...register('color')}
              />
            </div>

            <div className="space-y-2">
              <Label>Icon</Label>
              <input type="hidden" {...register('icon')} />
              <div className="grid grid-cols-6 gap-1">
                {ICONS.map(({ name: iconName, Icon }) => (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() =>
                      setValue('icon', iconName, { shouldDirty: true })
                    }
                    aria-label={iconName}
                    className={cn(
                      'flex items-center justify-center p-2 rounded-md border-2',
                      selectedIcon === iconName
                        ? 'border-current'
                        : 'border-transparent hover:bg-muted',
                    )}
                    style={{
                      color:
                        selectedIcon === iconName
                          ? selectedColor
                          : undefined,
                    }}
                  >
                    <Icon size={18} />
                  </button>
                ))}
              </div>
            </div>

            <div
              className={`flex ${isEdit ? 'justify-between' : 'justify-end'} gap-2`}
            >
              {isEdit && (
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  type="button"
                  disabled={isSubmitting}
                >
                  Delete
                </Button>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  type="button"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting
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

        {!loading && isView && formError && (
          <p className="text-destructive mt-4">{formError}</p>
        )}
      </SheetContent>
    </Sheet>
  );
}
