import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  createCategory,
  getCategory,
  updateCategory,
  deleteCategory,
  type CategoryData,
} from '../api/categories';
import { ApiError } from '../api/client';
import { ICONS } from '../lib/icons';
import { cn } from '@/lib/utils';
import {
  DEFAULT_COLOR,
  DEFAULT_ICON_NAME,
  MAX_NAME_LENGTH,
  LABEL,
  ERR,
} from '../lib/constants';

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required.').max(MAX_NAME_LENGTH),
  type: z.enum(['income', 'expense']),
  color: z.string(),
  icon: z.string(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export interface CategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId?: string;
  onSuccess?: (category?: CategoryData) => void;
}

export function CategoryModal({
  open,
  onOpenChange,
  categoryId,
  onSuccess,
}: CategoryModalProps): JSX.Element {
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      type: 'expense',
      color: DEFAULT_COLOR,
      icon: DEFAULT_ICON_NAME,
    },
  });

  const selectedColor = watch('color');
  const selectedIcon = watch('icon');

  const isCreate = !categoryId;

  useEffect(() => {
    if (!open) return;

    if (isCreate) {
      setLoading(false);
      reset({
        name: '',
        type: 'expense',
        color: DEFAULT_COLOR,
        icon: DEFAULT_ICON_NAME,
      });
      setFormError(null);
      return;
    }

    let active = true;
    setLoading(true);
    setFormError(null);
    if (!categoryId) return;
    getCategory(categoryId)
      .then((c) => {
        if (!active) return;
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
        setFormError(ERR.FAILED_TO_LOAD('category'));
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
        err instanceof ApiError ? err.message : ERR.FAILED_TO_SAVE('category'),
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
        err instanceof ApiError ? err.message : ERR.FAILED_TO_SAVE('category'),
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
        err instanceof ApiError
          ? err.message
          : ERR.FAILED_TO_DELETE('category'),
      );
    }
  };

  const title = isCreate ? 'New Category' : 'Edit Category';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {loading && <p className="text-muted-foreground mt-4">Loading…</p>}

        {!loading && (
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
              <Label htmlFor="cat-modal-name">{LABEL.NAME}</Label>
              <Input id="cat-modal-name" type="text" {...register('name')} />
              {errors.name && (
                <span role="alert" className="text-sm text-destructive">
                  {errors.name.message}
                </span>
              )}
            </div>

            <div className="space-y-2">
              <Label>{LABEL.TYPE}</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input type="radio" value="expense" {...register('type')} />
                  Expense
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" value="income" {...register('type')} />
                  Income
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cat-modal-color">{LABEL.COLOR}</Label>
              <Input id="cat-modal-color" type="color" {...register('color')} />
            </div>

            <div className="space-y-2">
              <Label>{LABEL.ICON}</Label>
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
                        selectedIcon === iconName ? selectedColor : undefined,
                    }}
                  >
                    <Icon size={18} />
                  </button>
                ))}
              </div>
            </div>

            <div
              className={`flex ${!isCreate ? 'justify-between' : 'justify-end'} gap-2`}
            >
              {!isCreate && (
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
                  disabled={isSubmitting || (!isCreate && !isDirty)}
                >
                  {isSubmitting
                    ? isCreate
                      ? 'Creating…'
                      : 'Saving…'
                    : isCreate
                      ? 'Create'
                      : 'Save Changes'}
                </Button>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
