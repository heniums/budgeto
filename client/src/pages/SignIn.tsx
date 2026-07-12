import { useId, useState } from 'react';
import type { FormEvent } from 'react';
import type { Location } from 'react-router-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ApiError, login } from '../api/auth';

interface FormErrors {
  email?: string;
  password?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(values: { email: string; password: string }): FormErrors {
  const errors: FormErrors = {};
  if (!values.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!EMAIL_RE.test(values.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }
  if (!values.password) {
    errors.password = 'Password is required.';
  }
  return errors;
}

export function SignIn(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const { login: signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const ids = {
    email: useId(),
    password: useId(),
  };

  const from = (location.state as { from?: Location } | null)?.from;
  const redirectTo = from?.pathname ?? '/account/profile';

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setFormError(null);
    const found = validate({ email, password });
    setErrors(found);
    if (Object.keys(found).length > 0) {
      return;
    }
    setSubmitting(true);
    try {
      const { token, user } = await login({
        email: email.trim(),
        password,
      });
      signIn(token, user);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setFormError('Invalid email or password.');
      } else if (error instanceof ApiError) {
        setFormError(error.message);
      } else {
        setFormError('Something went wrong. Please try again.');
      }
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <h1>Welcome back</h1>
      <p className="auth-lead">Sign in to pick up where you left off.</p>
      {formError && (
        <div role="alert" className="form-error">
          {formError}
        </div>
      )}
      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor={ids.email}>Email address</label>
          <input
            id={ids.email}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? `${ids.email}-error` : undefined}
          />
          {errors.email && (
            <span id={`${ids.email}-error`} role="alert" className="field-error">
              {errors.email}
            </span>
          )}
        </div>
        <div className="field">
          <label htmlFor={ids.password}>Password</label>
          <input
            id={ids.password}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={
              errors.password ? `${ids.password}-error` : undefined
            }
          />
          {errors.password && (
            <span
              id={`${ids.password}-error`}
              role="alert"
              className="field-error"
            >
              {errors.password}
            </span>
          )}
        </div>
        <button type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="auth-switch">
        New here? <Link to="/signup">Create an account</Link>
      </p>
    </main>
  );
}
