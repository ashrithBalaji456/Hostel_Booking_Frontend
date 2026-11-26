import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/endpoints';
import { ErrorState } from '../../components/ui/ErrorState';
import { formatINR } from '../../utils/format';

export function AdminDashboardPage() {
  const dashQuery = useQuery({ queryKey: ['admin-dashboard'], queryFn: adminApi.getDashboard });
  const analyticsQuery = useQuery({ queryKey: ['admin-analytics'], queryFn: adminApi.getAnalytics });

  if (dashQuery.isLoading) return <div className="glass-panel h-64 animate-pulse rounded-2xl" />;
  if (dashQuery.isError || !dashQuery.data) {
    return <ErrorState message={(dashQuery.error as Error)?.message ?? 'Failed to load admin dashboard'} onRetry={() => void dashQuery.refetch()} />;
  }

  const d = dashQuery.data;
  const a = analyticsQuery.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Platform Admin Overview</h1>
        <p className="mt-1 text-base text-slate-300">
          Monitor customers, property owners, verifications, bookings, and platform trust metrics.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <div className="glass-panel rounded-2xl p-6">
          <p className="text-sm font-medium text-slate-300">Total Users</p>
          <p className="mt-2 text-3xl font-bold text-white sm:text-4xl">{d.totalUsers}</p>
        </div>
        <div className="glass-panel rounded-2xl p-6">
          <p className="text-sm font-medium text-slate-300">Pending Verifications</p>
          <p className="mt-2 text-3xl font-bold text-amber-300 sm:text-4xl">{d.pendingPropertyVerifications}</p>
        </div>
        <div className="glass-panel rounded-2xl p-6">
          <p className="text-sm font-medium text-slate-300">Confirmed Bookings</p>
          <p className="mt-2 text-3xl font-bold text-cyan-300 sm:text-4xl">{d.confirmedBookings} / {d.totalBookings}</p>
        </div>
        <div className="glass-panel rounded-2xl p-6">
          <p className="text-sm font-medium text-slate-300">Net Revenue</p>
          <p className="mt-2 text-3xl font-bold text-emerald-300 sm:text-4xl">{formatINR(d.netPlatformRevenue)}</p>
        </div>
      </div>

      {a && (
        <div className="glass-panel rounded-2xl p-6 sm:p-7">
          <h2 className="text-lg font-semibold text-white">Operational &amp; Trust Metrics</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
              <p className="text-sm font-medium text-slate-300">Customers</p>
              <p className="mt-2 text-2xl font-bold text-cyan-300 sm:text-3xl">{a.totalCustomers}</p>
            </div>
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
              <p className="text-sm font-medium text-slate-300">Property Owners</p>
              <p className="mt-2 text-2xl font-bold text-indigo-300 sm:text-3xl">{a.totalOwners}</p>
            </div>
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
              <p className="text-sm font-medium text-slate-300">Approved Properties</p>
              <p className="mt-2 text-2xl font-bold text-emerald-300 sm:text-3xl">{a.approvedProperties} / {a.totalProperties}</p>
            </div>
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
              <p className="text-sm font-medium text-slate-300">Open Disputes</p>
              <p className="mt-2 text-2xl font-bold text-amber-300 sm:text-3xl">{a.openDisputes}</p>
            </div>
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
              <p className="text-sm font-medium text-slate-300">Open Safety Complaints</p>
              <p className="mt-2 text-2xl font-bold text-rose-300 sm:text-3xl">{a.openSafetyComplaints}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
