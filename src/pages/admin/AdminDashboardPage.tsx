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
      <h1 className="text-2xl font-bold text-white">Platform Admin Overview</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass-panel rounded-2xl p-5"><p className="text-xs text-slate-400">Total Users</p><p className="mt-1 text-2xl font-bold text-white">{d.totalUsers}</p></div>
        <div className="glass-panel rounded-2xl p-5"><p className="text-xs text-slate-400">Pending Verifications</p><p className="mt-1 text-2xl font-bold text-amber-300">{d.pendingPropertyVerifications}</p></div>
        <div className="glass-panel rounded-2xl p-5"><p className="text-xs text-slate-400">Confirmed Bookings</p><p className="mt-1 text-2xl font-bold text-cyan-300">{d.confirmedBookings} / {d.totalBookings}</p></div>
        <div className="glass-panel rounded-2xl p-5"><p className="text-xs text-slate-400">Net Revenue</p><p className="mt-1 text-2xl font-bold text-emerald-300">{formatINR(d.netPlatformRevenue)}</p></div>
      </div>

      {a && (
        <div className="glass-panel rounded-2xl p-6">
          <h2 className="text-base font-semibold text-white">Operational &amp; Trust Metrics</h2>
          <div className="mt-4 grid gap-4 text-sm sm:grid-cols-4">
            <div><p className="text-xs text-slate-400">Customers / Owners</p><p className="font-semibold text-white">{a.totalCustomers} / {a.totalOwners}</p></div>
            <div><p className="text-xs text-slate-400">Approved Properties</p><p className="font-semibold text-emerald-300">{a.approvedProperties} / {a.totalProperties}</p></div>
            <div><p className="text-xs text-slate-400">Open Disputes</p><p className="font-semibold text-amber-300">{a.openDisputes}</p></div>
            <div><p className="text-xs text-slate-400">Open Safety Complaints</p><p className="font-semibold text-rose-300">{a.openSafetyComplaints}</p></div>
          </div>
        </div>
      )}
    </div>
  );
}
