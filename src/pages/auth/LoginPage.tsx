import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { authApi } from '../../api/endpoints';
import { ApiClientError } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { setSession } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginForm) => {
    setServerError(null);
    try {
      const auth = await authApi.login(values);
      setSession(auth);
      pushToast(`Welcome back, ${auth.user.fullName}`, 'success');
      const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else if (auth.user.role === 'PROPERTY_OWNER') {
        navigate('/owner', { replace: true });
      } else if (auth.user.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/search', { replace: true });
      }
    } catch (err) {
      setServerError(err instanceof ApiClientError ? err.message : 'Unable to sign in');
    }
  };

  return (
    <div className="mx-auto flex min-h-[75vh] max-w-md items-center px-4 py-12">
      <div className="glass-panel w-full rounded-3xl p-8">
        <h1 className="text-2xl font-bold text-white">Sign in to Spatial Stay</h1>
        <p className="mt-1 text-sm text-slate-400">Access bookings, emergency stays, or your owner dashboard.</p>

        {serverError && (
          <div role="alert" className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-200">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register('email')}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
            />
            {errors.email && <p className="mt-1 text-xs text-rose-400">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-200">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register('password')}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
            />
            {errors.password && <p className="mt-1 text-xs text-rose-400">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 disabled:opacity-60"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between text-xs text-slate-400">
          <Link to="/forgot-password" className="hover:text-cyan-300">Forgot password?</Link>
          <Link to="/register" className="text-cyan-300 hover:underline">Create an account</Link>
        </div>
      </div>
    </div>
  );
}
