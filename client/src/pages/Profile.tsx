import { useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../auth/AuthContext';
import { changePassword, updateName } from '../api/auth';
import { ApiError } from '../api/client';

const nameSchema = z.object({
  name: z.string().min(1, 'Please enter a display name.'),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required.'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters.'),
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
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useAuth();
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
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const handleSignOut = (): void => {
    logout();
    navigate('/login');
  };

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
    <main className="profile-page">
      <h1>Your profile</h1>

      <section className="profile-card" aria-labelledby="name-heading">
        <h2 id="name-heading">Name</h2>

        {nameEditing ? (
          <form onSubmit={handleNameSubmit(submitName)} noValidate>
            <div className="field">
              <label htmlFor={nameId}>Name</label>
              <input
                id={nameId}
                type="text"
                autoComplete="name"
                autoFocus
                {...registerName('name')}
                aria-invalid={nameErrors.name ? true : undefined}
                aria-describedby={
                  nameErrors.name ? `${nameId}-error` : undefined
                }
              />
              {nameErrors.name && (
                <span
                  id={`${nameId}-error`}
                  role="alert"
                  className="field-error"
                >
                  {nameErrors.name.message}
                </span>
              )}
            </div>
            <div className="field-actions">
              <button type="submit" disabled={nameSaving}>
                {nameSaving ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                className="secondary"
                onClick={cancelNameEdit}
                disabled={nameSaving}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="name-display">
            <p data-testid="profile-name">{user?.name ?? 'Unnamed'}</p>
            <p className="profile-email">{user?.email}</p>
            <button
              type="button"
              onClick={startNameEdit}
              className="edit-button"
            >
              Edit name
            </button>
          </div>
        )}
      </section>

      <section className="profile-card" aria-labelledby="pw-heading">
        <h2 id="pw-heading">Change password</h2>
        <form onSubmit={handlePwSubmit(submitPassword)} noValidate>
          <div className="field">
            <label htmlFor={pwIds.currentPassword}>Current password</label>
            <input
              id={pwIds.currentPassword}
              type="password"
              autoComplete="current-password"
              {...registerPw('currentPassword')}
              aria-invalid={pwErrors.currentPassword ? true : undefined}
              aria-describedby={
                pwErrors.currentPassword
                  ? `${pwIds.currentPassword}-error`
                  : undefined
              }
            />
            {pwErrors.currentPassword && (
              <span
                id={`${pwIds.currentPassword}-error`}
                role="alert"
                className="field-error"
              >
                {pwErrors.currentPassword.message}
              </span>
            )}
          </div>
          <div className="field">
            <label htmlFor={pwIds.newPassword}>New password</label>
            <input
              id={pwIds.newPassword}
              type="password"
              autoComplete="new-password"
              {...registerPw('newPassword')}
              aria-invalid={pwErrors.newPassword ? true : undefined}
              aria-describedby={
                pwErrors.newPassword
                  ? `${pwIds.newPassword}-error`
                  : undefined
              }
            />
            {pwErrors.newPassword && (
              <span
                id={`${pwIds.newPassword}-error`}
                role="alert"
                className="field-error"
              >
                {pwErrors.newPassword.message}
              </span>
            )}
          </div>
          <div className="field">
            <label htmlFor={pwIds.confirmPassword}>
              Confirm new password
            </label>
            <input
              id={pwIds.confirmPassword}
              type="password"
              autoComplete="new-password"
              {...registerPw('confirmPassword')}
              aria-invalid={pwErrors.confirmPassword ? true : undefined}
              aria-describedby={
                pwErrors.confirmPassword
                  ? `${pwIds.confirmPassword}-error`
                  : undefined
              }
            />
            {pwErrors.confirmPassword && (
              <span
                id={`${pwIds.confirmPassword}-error`}
                role="alert"
                className="field-error"
              >
                {pwErrors.confirmPassword.message}
              </span>
            )}
          </div>
          {pwFormError && (
            <div role="alert" className="form-error">
              {pwFormError}
            </div>
          )}
          {pwSuccess && (
            <div role="status" className="form-success">
              {pwSuccess}
            </div>
          )}
          <button type="submit" disabled={pwSubmitting}>
            {pwSubmitting ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </section>

      <button type="button" className="sign-out" onClick={handleSignOut}>
        Sign out
      </button>
    </main>
  );
}
