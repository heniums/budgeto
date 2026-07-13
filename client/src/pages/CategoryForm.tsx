import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ICONS } from '../lib/icons';

import { createCategory, getCategory, updateCategory } from '../api/categories';
import { ApiError } from '../api/client';

// Icons are imported from '../lib/icons'.

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required.').max(128),
  type: z.enum(['expense', 'income']),
  color: z.string(),
  icon: z.string(),
});

type CategoryValues = z.infer<typeof categorySchema>;

export function CategoryForm(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(isEdit);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CategoryValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      type: 'expense',
      color: '#1f8a4c',
      icon: 'Tag',
    },
  });

  const selectedColor = watch('color');

  useEffect(() => {
    if (!id) return;
    let active = true;
    getCategory(id)
      .then((category) => {
        if (!active) return;
        reset({
          name: category.name,
          type: category.type,
          color: category.color,
          icon: category.icon,
        });
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setFormError(err.message);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, reset]);

  const onSubmit = async (values: CategoryValues): Promise<void> => {
    setFormError(null);
    try {
      if (isEdit) {
        if (!id) {
          setFormError('Category ID is missing.');
          return;
        }
        await updateCategory(id, {
          name: values.name.trim(),
          type: values.type,
          color: values.color,
          icon: values.icon,
        });
      } else {
        await createCategory({
          name: values.name.trim(),
          type: values.type,
          color: values.color,
          icon: values.icon,
        });
      }
      navigate('/account/categories');
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message);
      } else {
        setFormError('An unexpected error occurred.');
      }
    }
  };

  if (loading) {
    return (
      <main>
        <p>Loading…</p>
      </main>
    );
  }

  return (
    <main>
      <h1>{isEdit ? 'Edit Category' : 'New Category'}</h1>

      <Link to="/account/categories">Back</Link>

      {formError && (
        <div role="alert" className="form-error">
          {formError}
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        style={{ marginTop: '1rem' }}
      >
        <div className="field">
          <label htmlFor="category-name">Name</label>
          <input
            id="category-name"
            type="text"
            autoFocus
            {...register('name')}
            aria-invalid={errors.name ? true : undefined}
          />
          {errors.name && (
            <span role="alert" className="field-error">
              {errors.name.message}
            </span>
          )}
        </div>

        <div className="field">
          <label>Type</label>
          <div
            style={{ display: 'flex', gap: '1.5rem', paddingTop: '0.35rem' }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontWeight: 400,
              }}
            >
              <input type="radio" value="expense" {...register('type')} />
              Expense
            </label>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontWeight: 400,
              }}
            >
              <input type="radio" value="income" {...register('type')} />
              Income
            </label>
          </div>
        </div>

        <div className="field">
          <label htmlFor="category-color">Color</label>
          <input id="category-color" type="color" {...register('color')} />
        </div>

        <div className="field">
          <label>Icon</label>
          <Controller
            name="icon"
            control={control}
            render={({ field }) => (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))',
                  gap: '0.35rem',
                  marginTop: '0.35rem',
                }}
              >
                {ICONS.map(({ name, Icon }) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => field.onChange(name)}
                    aria-label={name}
                    title={name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      aspectRatio: '1',
                      padding: '0.35rem',
                      background:
                        field.value === name ? selectedColor : 'transparent',
                      border:
                        field.value === name
                          ? `2px solid ${selectedColor}`
                          : '1px solid var(--color-border)',
                      borderRadius: 'var(--radius)',
                      color:
                        field.value === name ? '#fff' : 'var(--color-text)',
                      cursor: 'pointer',
                    }}
                  >
                    <Icon size={20} />
                  </button>
                ))}
              </div>
            )}
          />
        </div>

        <div className="button-row">
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save'}
          </button>
          <Link to="/account/categories" className="secondary">
            Cancel
          </Link>
        </div>
      </form>
    </main>
  );
}
