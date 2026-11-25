import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../api/endpoints';
import { ApiClientError } from '../../api/client';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<{ message: string; token?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(email);
      setResult(res);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-12">
      <div className="glass-panel w-full rounded-3xl p-8">
        <h1 className="text-2xl font-bold text-white">Reset your password</h1>
        <p className="mt-1 text-sm text-slate-400">Enter your registered email to receive reset instructions.</p>

        {error && <p role="alert" className="mt-4 rounded-xl bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}
        {result && (
          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
            <p>{result.message}</p>
            {result.token && (
              <Link to={`/reset-password?token=${encodeURIComponent(result.token)}`} className="mt-2 inline-block font-semibold text-cyan-300 underline">
                Continue to Reset Password
              </Link>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="fp-email" className="block text-sm font-medium text-slate-200">Email</label>
            <input
              id="fp-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-2.5 text-sm text-white"
            />
          </div>
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-cyan-600 py-2.5 text-sm font-semibold text-white">
            {loading ? 'Sending...' : 'Request Reset Token'}
          </button>
        </form>
      </div>
    </div>
  );
}
