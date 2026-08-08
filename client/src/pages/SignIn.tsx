import { useId } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../api/client';
import { login } from '../api/auth';
import { FormError } from '../components/FormError';
import { FormAlert } from '../components/FormAlert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
    (location.state as { from?: { pathname: string } })?.from?.pathname ??
    '/home';
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
      const user = await login({
        email: data.email.trim(),
        password: data.password,
      });
      signIn(user);
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
    <div className="flex min-h-screen items-center justify-center gradient-mesh p-4">
      <Card className="w-full max-w-md rounded-2xl p-8">
        <h1 className="mb-2 text-2xl font-semibold text-foreground">
          Welcome back
        </h1>
        <p className="mb-6 text-muted-foreground">
          Sign in to continue to Budgeto.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={ids.email} className="text-sm font-medium text-foreground">
              Email address
            </Label>
            <Input
              id={ids.email}
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              {...register('email')}
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? `${ids.email}-error` : undefined}
            />
            <FormError
              id={`${ids.email}-error`}
              message={errors.email?.message}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={ids.password} className="text-sm font-medium text-foreground">
              Password
            </Label>
            <Input
              id={ids.password}
              type="password"
              autoComplete="current-password"
              placeholder="Your password"
              {...register('password')}
              aria-invalid={errors.password ? true : undefined}
              aria-describedby={
                errors.password ? `${ids.password}-error` : undefined
              }
            />
            <FormError
              id={`${ids.password}-error`}
              message={errors.password?.message}
            />
          </div>

          <FormAlert message={errors.root?.message} />

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&rsquo;t have an account?{' '}
          <Link to="/signup" className="font-medium text-primary hover:underline">
            Create one
          </Link>
        </p>
      </Card>
    </div>
  );
}
