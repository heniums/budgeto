import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ApiError, changePassword, updateName } from '../api/auth';

const MIN_PASSWORD = 8;

export function Profile(): JSX.Element {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameFormError, setNameFormError] = useState<string | null>(null);
  const [nameSaving, setNameSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwFormError, setPwFormError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  async function saveName(): Promise<void> {
    if (!name.trim()) {
      setNameError('Please enter a display name.');
      return;
    }
    setNameError(null);
    setNameFormError(null);
    setNameSaving(true);
    try {
      const updated = await updateName(token as string, name.trim());
      setName(updated.name);
      setEditing(false);
    } catch (error) {
      setNameFormError(
        error instanceof ApiError ? error.message : 'Could not save your name.',
      );
      setNameSaving(false);
    }
  }

  function validatePassword(): boolean {
    if (newPassword.length < MIN_PASSWORD) {
      setPwError(`Password must be at least ${MIN_PASSWORD} characters.`);
      return false;
    }
    if (newPassword !== confirmPassword) {
      setPwError('Passwords do not match.');
      return false;
    }
    setPwError(null);
    return true;
  }

  async function submitPassword(
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    setPwSuccess(false);
    if (!validatePassword()) {
      return;
    }
    setPwFormError(null);
    setPwSaving(true);
    try {
      await changePassword(token as string, {
        currentPassword,
        newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPwSuccess(true);
      setPwSaving(false);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setPwFormError('Current password is incorrect.');
      } else if (error instanceof ApiError) {
        setPwFormError(error.message);
      } else {
        setPwFormError('Could not update your password.');
      }
      setPwSaving(false);
    }
  }

  function handleSignOut(): void {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <main className="auth-page">
      <h1>Your profile</h1>
      <section className="profile-card" aria-labelledby="name-heading">
        <h2 id="name-heading">Display name</h2>
        {!editing ? (
          <div className="profile-name-row">
            <p data-testid="profile-name">{name || user?.name || '—'}</p>
            <p className="profile-email">{user?.email}</p>
            <button
              type="button"
              onClick={() => {
                setName(user?.name ?? '');
                setEditing(true);
              }}
            >
              Edit name
            </button>
          </div>
        ) : (
          <div className="field">
            <label htmlFor="display-name">Display name</label>
            <input
              id="display-name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={nameError ? true : undefined}
              aria-describedby={nameError ? 'display-name-error' : undefined}
            />
            {nameError && (
              <span id="display-name-error" role="alert" className="field-error">
                {nameError}
              </span>
            )}
            {nameFormError && (
              <div role="alert" className="form-error">
                {nameFormError}
              </div>
            )}
            <div className="button-row">
              <button
                type="button"
                onClick={saveName}
                disabled={nameSaving}
              >
                {nameSaving ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setName(user?.name ?? '');
                  setNameError(null);
                }}
                disabled={nameSaving}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="profile-card" aria-labelledby="pw-heading">
        <h2 id="pw-heading">Change password</h2>
        <form onSubmit={submitPassword} noValidate>
          <div className="field">
            <label htmlFor="current-password">Current password</label>
            <input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="new-password">New password</label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="confirm-password">Confirm new password</label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              aria-invalid={pwError ? true : undefined}
              aria-describedby={pwError ? 'pw-error' : undefined}
            />
            {pwError && (
              <span id="pw-error" role="alert" className="field-error">
                {pwError}
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
              Password updated.
            </div>
          )}
          <button type="submit" disabled={pwSaving}>
            {pwSaving ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </section>

      <button type="button" className="sign-out" onClick={handleSignOut}>
        Sign out
      </button>
    </main>
  );
}
