import { useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { useAuth } from '../auth/AuthContext';
import { changePassword, updateName } from '../api/auth';
import { ApiError } from '../api/client';
import { FormError } from '../components/FormError';
import { FormAlert } from '../components/FormAlert';

const nameSchema = z.object({
  name: z.string().min(1, 'Please enter a display name.'),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required.'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters.'),
    confirmPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

type NameValues = z.infer<typeof nameSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;

export function Profile(): JSX.Element {
  const { user, refreshUser } = useAuth();
  const [nameEditing, setNameEditing] = useState(false);
  const [pwFormError, setPwFormError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);

  const nameId = useId();
  const pwIds = {
    currentPassword: useId(),
    newPassword: useId(),
    confirmPassword: useId(),
  };

  const {
    register: registerName,
    handleSubmit: handleNameSubmit,
    formState: { errors: nameErrors, isSubmitting: nameSaving },
    setError: setNameError,
    reset: resetNameForm,
  } = useForm<NameValues>({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: user?.name ?? '' },
  });

  const {
    register: registerPw,
    handleSubmit: handlePwSubmit,
    formState: { errors: pwErrors, isSubmitting: pwSubmitting },
    reset: resetPwForm,
  } = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const submitName = async (values: NameValues): Promise<void> => {
    try {
      await updateName(values.name.trim());
      await refreshUser();
      setNameEditing(false);
    } catch {
      setNameError('name', {
        message: 'Could not save your name.',
      });
    }
  };

  const submitPassword = async (values: PasswordValues): Promise<void> => {
    setPwFormError(null);
    setPwSuccess(null);
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      setPwSuccess('Password updated.');
      resetPwForm();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setPwFormError('Current password is incorrect.');
        } else {
          setPwFormError(err.message);
        }
      } else {
        setPwFormError('An unexpected error occurred.');
      }
    }
  };

  const cancelNameEdit = (): void => {
    resetNameForm();
    setNameEditing(false);
  };

  const startNameEdit = (): void => {
    resetNameForm({ name: user?.name ?? '' });
    setNameEditing(true);
  };

  return (
    <main className="space-y-6 min-w-0 pb-24">
      <h1 className="text-2xl font-semibold text-foreground">Your profile</h1>

      <section className="glass rounded-lg p-6" aria-labelledby="name-heading">
        <h2 id="name-heading" className="mb-4 text-lg font-semibold text-foreground">
          Name
        </h2>

        {nameEditing ? (
          <form onSubmit={handleNameSubmit(submitName)} noValidate className="space-y-4">
            <div className="space-y-2">
              <label htmlFor={nameId} className="text-sm font-medium text-foreground">
                Name
              </label>
              <input
                id={nameId}
                type="text"
                autoComplete="name"
                autoFocus
                placeholder="Your display name"
                {...registerName('name')}
                aria-invalid={nameErrors.name ? true : undefined}
                aria-describedby={
                  nameErrors.name ? `${nameId}-error` : undefined
                }
                className="glass w-full rounded-lg border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <FormError
                id={`${nameId}-error`}
                message={nameErrors.name?.message}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={cancelNameEdit}
                disabled={nameSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={nameSaving}>
                {nameSaving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-2">
            <p data-testid="profile-name" className="text-foreground">
              {user?.name ?? 'Unnamed'}
            </p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <Button type="button" variant="outline" onClick={startNameEdit}>
              Edit name
            </Button>
          </div>
        )}
      </section>

      <section className="glass rounded-lg p-6" aria-labelledby="pw-heading">
        <h2 id="pw-heading" className="mb-4 text-lg font-semibold text-foreground">
          Change password
        </h2>
        <form onSubmit={handlePwSubmit(submitPassword)} noValidate className="space-y-4">
          <div className="space-y-2">
            <label htmlFor={pwIds.currentPassword} className="text-sm font-medium text-foreground">
              Current password
            </label>
            <input
              id={pwIds.currentPassword}
              type="password"
              autoComplete="current-password"
              placeholder="Current password"
              {...registerPw('currentPassword')}
              aria-invalid={pwErrors.currentPassword ? true : undefined}
              aria-describedby={
                pwErrors.currentPassword
                  ? `${pwIds.currentPassword}-error`
                  : undefined
              }
              className="glass w-full rounded-lg border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <FormError
              id={`${pwIds.currentPassword}-error`}
              message={pwErrors.currentPassword?.message}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor={pwIds.newPassword} className="text-sm font-medium text-foreground">
              New password
            </label>
            <input
              id={pwIds.newPassword}
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              {...registerPw('newPassword')}
              aria-invalid={pwErrors.newPassword ? true : undefined}
              aria-describedby={
                pwErrors.newPassword ? `${pwIds.newPassword}-error` : undefined
              }
              className="glass w-full rounded-lg border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <FormError
              id={`${pwIds.newPassword}-error`}
              message={pwErrors.newPassword?.message}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor={pwIds.confirmPassword} className="text-sm font-medium text-foreground">
              Confirm new password
            </label>
            <input
              id={pwIds.confirmPassword}
              type="password"
              autoComplete="new-password"
              placeholder="Re-enter new password"
              {...registerPw('confirmPassword')}
              aria-invalid={pwErrors.confirmPassword ? true : undefined}
              aria-describedby={
                pwErrors.confirmPassword
                  ? `${pwIds.confirmPassword}-error`
                  : undefined
              }
              className="glass w-full rounded-lg border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <FormError
              id={`${pwIds.confirmPassword}-error`}
              message={pwErrors.confirmPassword?.message}
            />
          </div>
          <FormAlert message={pwFormError} />
          {pwSuccess && (
            <div role="status" className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-500">
              {pwSuccess}
            </div>
          )}
          <Button type="submit" disabled={pwSubmitting}>
            {pwSubmitting ? 'Updating…' : 'Update password'}
          </Button>
        </form>
      </section>
    </main>
  );
}
