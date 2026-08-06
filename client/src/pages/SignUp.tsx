import { useId } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../auth/AuthContext';
import { register as apiRegister } from '../api/auth';
import { FormError } from '../components/FormError';
import { FormAlert } from '../components/FormAlert';
import { Button } from '@/components/ui/button';

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
      signIn(user);
      navigate('/home');
    } catch (err) {
      setError('root', {
        message: err instanceof Error ? err.message : 'Something went wrong.',
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center gradient-mesh p-4">
      <div className="glass w-full max-w-md rounded-2xl p-8">
        <h1 className="mb-2 text-2xl font-semibold text-foreground">
          Create your account
        </h1>
        <p className="mb-6 text-muted-foreground">
          Ready to take control of your budget? A few details and you&rsquo;re
          set.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="space-y-2">
            <label htmlFor={ids.name} className="text-sm font-medium text-foreground">
              Full name
            </label>
            <input
              id={ids.name}
              type="text"
              autoComplete="name"
              placeholder="Jane Doe"
              {...register('name')}
              aria-invalid={errors.name ? true : undefined}
              aria-describedby={errors.name ? `${ids.name}-error` : undefined}
              className="glass w-full rounded-lg border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <FormError id={`${ids.name}-error`} message={errors.name?.message} />
          </div>

          <div className="space-y-2">
            <label htmlFor={ids.email} className="text-sm font-medium text-foreground">
              Email address
            </label>
            <input
              id={ids.email}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              {...register('email')}
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? `${ids.email}-error` : undefined}
              className="glass w-full rounded-lg border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <FormError
              id={`${ids.email}-error`}
              message={errors.email?.message}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor={ids.password} className="text-sm font-medium text-foreground">
              Password
            </label>
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
              className="glass w-full rounded-lg border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <FormError
              id={`${ids.password}-error`}
              message={errors.password?.message}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor={ids.confirm} className="text-sm font-medium text-foreground">
              Confirm password
            </label>
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
              className="glass w-full rounded-lg border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <FormError
              id={`${ids.confirm}-error`}
              message={errors.confirm?.message}
            />
          </div>

          <FormAlert message={errors.root?.message} />

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
