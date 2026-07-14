import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import {
  getCategory,
  updateCategory,
  type CategoryData,
} from '../api/categories';
import { ApiError } from '../api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

const editSchema = z.object({
  name: z.string().min(1, 'Name is required.').max(128),
  type: z.enum(['income', 'expense']),
  color: z.string(),
});

type EditValues = z.infer<typeof editSchema>;

export interface CategoryDetailSheetProps {
  categoryId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CategoryDetailSheet({
  categoryId,
  open,
  onOpenChange,
  onSuccess,
}: CategoryDetailSheetProps): JSX.Element {
  const [category, setCategory] = useState<CategoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { name: '', type: 'expense', color: '#ff6b6b' },
  });

  useEffect(() => {
    if (!open || !categoryId) return;
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
  }, [open, categoryId, reset]);

  const onSubmit = async (values: EditValues): Promise<void> => {
    setFormError(null);
    try {
      await updateCategory(categoryId, {
        name: values.name.trim(),
        type: values.type,
        color: values.color,
        icon: category?.icon ?? 'Tag',
      });
      onSuccess?.();
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : 'Failed to update category.',
      );
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Category Details</SheetTitle>
        </SheetHeader>

        {loading ? (
          <p className="text-muted-foreground mt-4">Loading…</p>
        ) : formError && !category ? (
          <p className="text-destructive mt-4">{formError}</p>
        ) : (
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
              <Label htmlFor="sheet-cat-name">Name</Label>
              <Input id="sheet-cat-name" type="text" {...register('name')} />
              {errors.name && (
                <span role="alert" className="text-sm text-destructive">
                  {errors.name.message}
                </span>
              )}
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 text-sm">
                  <input type="radio" value="expense" {...register('type')} />
                  Expense
                </label>
                <label className="flex items-center gap-1.5 text-sm">
                  <input type="radio" value="income" {...register('type')} />
                  Income
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sheet-cat-color">Color</Label>
              <Input id="sheet-cat-color" type="color" {...register('color')} />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Saving…' : 'Save'}
            </Button>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
