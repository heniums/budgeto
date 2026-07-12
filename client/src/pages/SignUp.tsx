import { useId, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ApiError, login, register } from '../api/auth';

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

function validate(values: {
  name: string;
  email: string;
  password: string;
  confirm: string;
}): FormErrors {
  const errors: FormErrors = {};
  if (!values.name.trim()) {
    errors.name = 'Please tell us your name.';
  }
  if (!values.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!EMAIL_RE.test(values.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }
  if (!values.password) {
    errors.password = `Password must be at least ${MIN_PASSWORD} characters.`;
  } else if (values.password.length < MIN_PASSWORD) {
    errors.password = `Password must be at least ${MIN_PASSWORD} characters.`;
  }
  if (values.confirm !== values.password) {
    errors.confirm = 'Passwords do not match.';
  }
  return errors;
}

export function SignUp(): JSX.Element {
  const navigate = useNavigate();
  const { login: signIn } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const ids = {
    name: useId(),
    email: useId(),
    password: useId(),
    confirm: useId(),
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setFormError(null);
    const found = validate({ name, email, password, confirm });
    setErrors(found);
    if (Object.keys(found).length > 0) {
      return;
    }
    setSubmitting(true);
    try {
      const user = await register({ name: name.trim(), email: email.trim(), password });
      const { token } = await login({ email: email.trim(), password });
      signIn(token, user);
      navigate('/account/profile');
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message);
      } else {
        setFormError('Something went wrong. Please try again.');
      }
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <h1>Create your account</h1>
      <p className="auth-lead">
        A few details and you&rsquo;re ready to take control of your budget.
      </p>
      {formError && (
        <div role="alert" className="form-error">
          {formError}
        </div>
      )}
      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor={ids.name}>Full name</label>
          <input
            id={ids.name}
            type="text"
            autoComplete="name"
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? `${ids.name}-error` : undefined}
          />
          {errors.name && (
            <span id={`${ids.name}-error`} role="alert" className="field-error">
              {errors.name}
            </span>
          )}
        </div>
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
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={errors.password ? `${ids.password}-error` : undefined}
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
        <div className="field">
          <label htmlFor={ids.confirm}>Confirm password</label>
          <input
            id={ids.confirm}
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            aria-invalid={errors.confirm ? true : undefined}
            aria-describedby={errors.confirm ? `${ids.confirm}-error` : undefined}
          />
          {errors.confirm && (
            <span
              id={`${ids.confirm}-error`}
              role="alert"
              className="field-error"
            >
              {errors.confirm}
            </span>
          )}
        </div>
        <button type="submit" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="auth-switch">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </main>
  );
}
