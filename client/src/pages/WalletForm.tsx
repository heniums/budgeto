import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../auth/AuthContext';
import {
  createWallet,
  getWallet,
  updateWallet,
  ApiError,
} from '../api/wallets';

const walletSchema = z.object({
  name: z.string().min(1, 'Name is required.').max(128),
  description: z.string().max(512).optional().default(''),
  color: z.string().optional().default('#1f8a4c'),
});

type WalletValues = z.infer<typeof walletSchema>;

export function WalletForm(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const { token } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(isEdit);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<WalletValues>({
    resolver: zodResolver(walletSchema),
    defaultValues: { name: '', description: '', color: '#1f8a4c' },
  });

  useEffect(() => {
    if (!id) return;
    let active = true;
    getWallet(token!, id)
      .then((wallet) => {
        if (!active) return;
        reset({
          name: wallet.name,
          description: wallet.description,
          color: wallet.color,
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
  }, [id, token, reset]);

  const onSubmit = async (values: WalletValues): Promise<void> => {
    setFormError(null);
    try {
      const wallet = isEdit
        ? await updateWallet(token!, id!, {
            name: values.name.trim(),
            description: values.description?.trim(),
            color: values.color,
          })
        : await createWallet(token!, {
            name: values.name.trim(),
            description: values.description?.trim(),
            color: values.color,
          });
      navigate(`/account/wallets/${wallet.id}`);
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
      <h1>{isEdit ? 'Edit Wallet' : 'New Wallet'}</h1>

      <Link to={isEdit ? `/account/wallets/${id}` : '/account/wallets'}>
        Back
      </Link>

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
          <label htmlFor="wallet-name">Name</label>
          <input
            id="wallet-name"
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
          <label htmlFor="wallet-desc">Description</label>
          <input
            id="wallet-desc"
            type="text"
            {...register('description')}
          />
        </div>

        <div className="field">
          <label htmlFor="wallet-color">Color</label>
          <input
            id="wallet-color"
            type="color"
            {...register('color')}
          />
        </div>

        <div className="button-row">
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save'}
          </button>
          <Link
            to={isEdit ? `/account/wallets/${id}` : '/account/wallets'}
            className="secondary"
          >
            Cancel
          </Link>
        </div>
      </form>
    </main>
  );
}
