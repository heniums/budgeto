import { useId } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../auth/AuthContext';
import { login as apiLogin, register as apiRegister } from '../api/auth';

const signUpSchema = z
  .object({
    name: z.string().min(1, 'Please tell us your name.'),
    email: z
      .string()
      .min(1, 'Email is required.')
      .email('Enter a valid email address.'),
    password: z.string().min(8, 'Password must be at least 8 characters.'),
    confirm: z.string().min(1, 'Please confirm your password.'),
  })
  .refine((data) => data.password === data.confirm, {
    message: 'Passwords do not match.',
    path: ['confirm'],
  });

type SignUpValues = z.infer<typeof signUpSchema>;

export function SignUp(): JSX.Element {
  const navigate = useNavigate();
  const { login: signIn } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: '', email: '', password: '', confirm: '' },
  });
  const ids = {
    name: useId(),
    email: useId(),
    password: useId(),
    confirm: useId(),
  };

  const onSubmit = async (data: SignUpValues): Promise<void> => {
    try {
      const user = await apiRegister({
        name: data.name.trim(),
        email: data.email.trim(),
        password: data.password,
      });
      const { token } = await apiLogin({
        email: data.email.trim(),
        password: data.password,
      });
      signIn(user, token);
      navigate('/dashboard');
    } catch (err) {
      setError('root', {
        message: err instanceof Error ? err.message : 'Something went wrong.',
      });
    }
  };

  return (
    <main className="auth-page">
      <h1>Create your account</h1>
      <p className="auth-lead">
        Ready to take control of your budget? A few details and you&rsquo;re
        set.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="field">
          <label htmlFor={ids.name}>Full name</label>
          <input
            id={ids.name}
            type="text"
            autoComplete="name"
            placeholder="Jane Doe"
            {...register('name')}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? `${ids.name}-error` : undefined}
          />
          {errors.name && (
            <span id={`${ids.name}-error`} role="alert" className="field-error">
              {errors.name.message}
            </span>
          )}
        </div>

        <div className="field">
          <label htmlFor={ids.email}>Email address</label>
          <input
            id={ids.email}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
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
            autoComplete="new-password"
            placeholder="At least 8 characters"
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

        <div className="field">
          <label htmlFor={ids.confirm}>Confirm password</label>
          <input
            id={ids.confirm}
            type="password"
            autoComplete="new-password"
            placeholder="Re-enter password"
            {...register('confirm')}
            aria-invalid={errors.confirm ? true : undefined}
            aria-describedby={
              errors.confirm ? `${ids.confirm}-error` : undefined
            }
          />
          {errors.confirm && (
            <span
              id={`${ids.confirm}-error`}
              role="alert"
              className="field-error"
            >
              {errors.confirm.message}
            </span>
          )}
        </div>

        {errors.root && (
          <div role="alert" className="form-error">
            {errors.root.message}
          </div>
        )}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="auth-link">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </main>
  );
}
