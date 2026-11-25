import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../../api/endpoints';
import { ApiClientError } from '../../api/client';
import { useToast } from '../../context/ToastContext';

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const [token, setToken] = useState(params.get('token') ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authApi.resetPassword({ token, newPassword });
      pushToast('Password reset successful. Please sign in.', 'success');
      navigate('/login');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-12">
      <div className="glass-panel w-full rounded-3xl p-8">
        <h1 className="text-2xl font-bold text-white">Set new password</h1>
        {error && <p role="alert" className="mt-4 rounded-xl bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="reset-token" className="block text-sm font-medium text-slate-200">Reset Token</label>
            <input id="reset-token" required value={token} onChange={(e) => setToken(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-2.5 text-sm text-white" />
          </div>
          <div>
            <label htmlFor="new-pw" className="block text-sm font-medium text-slate-200">New Password</label>
            <input id="new-pw" type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-2.5 text-sm text-white" />
          </div>
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-cyan-600 py-2.5 text-sm font-semibold text-white">
            {loading ? 'Updating...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
