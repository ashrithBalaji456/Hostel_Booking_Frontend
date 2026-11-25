import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authApi } from '../../api/endpoints';
import { ApiClientError } from '../../api/client';

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const [token, setToken] = useState(params.get('token') ?? '');
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authApi.verifyEmail(token);
      setVerified(true);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-12">
      <div className="glass-panel w-full rounded-3xl p-8">
        <h1 className="text-2xl font-bold text-white">Verify your email</h1>
        {verified ? (
          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
            Email verified successfully! <Link to="/search" className="font-semibold text-cyan-300 underline">Browse Stays</Link>
          </div>
        ) : (
          <form onSubmit={handleVerify} className="mt-6 space-y-4">
            {error && <p role="alert" className="rounded-xl bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}
            <div>
              <label htmlFor="verify-token" className="block text-sm font-medium text-slate-200">Verification Token</label>
              <input id="verify-token" required value={token} onChange={(e) => setToken(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-2.5 text-sm text-white" />
            </div>
            <button type="submit" disabled={loading} className="w-full rounded-xl bg-cyan-600 py-2.5 text-sm font-semibold text-white">
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
