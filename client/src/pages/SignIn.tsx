import { useId } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../api/client';
import { login } from '../api/auth';

const signInSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required.')
    .email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

type SignInValues = z.infer<typeof signInSchema>;

export function SignIn(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const { login: signIn } = useAuth();
  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/';
  const ids = {
    email: useId(),
    password: useId(),
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: SignInValues): Promise<void> => {
    try {
      const { user, token } = await login({
        email: data.email.trim(),
        password: data.password,
      });
      signIn(user, token);
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('root', { message: 'Invalid email or password.' });
      } else {
        setError('root', {
          message: err instanceof Error ? err.message : 'Something went wrong.',
        });
      }
    }
  };

  return (
    <main className="auth-page">
      <h1>Welcome back</h1>
      <p className="auth-lead">Sign in to continue to Budgeto.</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="field">
          <label htmlFor={ids.email}>Email address</label>
          <input
            id={ids.email}
            type="email"
            autoComplete="email"
            autoFocus
            {...register('email')}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? `${ids.email}-error` : undefined}
          />
          {errors.email && (
            <span
              id={`${ids.email}-error`}
              role="alert"
              className="field-error"
            >
              {errors.email.message}
            </span>
          )}
        </div>

        <div className="field">
          <label htmlFor={ids.password}>Password</label>
          <input
            id={ids.password}
            type="password"
            autoComplete="current-password"
            {...register('password')}
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
              {errors.password.message}
            </span>
          )}
        </div>

        {errors.root && (
          <div role="alert" className="form-error">
            {errors.root.message}
          </div>
        )}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="auth-link">
        Don&rsquo;t have an account? <Link to="/signup">Create one</Link>
      </p>
    </main>
  );
}
