import { useQuery } from '@tanstack/react-query';
import { ownerApi } from '../../api/endpoints';
import { ErrorState } from '../../components/ui/ErrorState';
import { formatINR, formatIST } from '../../utils/format';

export function OwnerDashboardPage() {
  const dashQuery = useQuery({ queryKey: ['owner-dashboard'], queryFn: ownerApi.getDashboard });
  const analyticsQuery = useQuery({ queryKey: ['owner-analytics'], queryFn: ownerApi.getAnalytics });

  if (dashQuery.isLoading) return <div className="glass-panel h-64 animate-pulse rounded-2xl" />;
  if (dashQuery.isError || !dashQuery.data) {
    return <ErrorState message={(dashQuery.error as Error)?.message ?? 'Failed to load owner dashboard'} onRetry={() => void dashQuery.refetch()} />;
  }

  const d = dashQuery.data;
  const a = analyticsQuery.data;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Property Owner Overview</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass-panel rounded-2xl p-5">
          <p className="text-xs text-slate-400">Properties</p>
          <p className="mt-1 text-2xl font-bold text-white">{d.totalProperties}</p>
        </div>
        <div className="glass-panel rounded-2xl p-5">
          <p className="text-xs text-slate-400">Pending Approvals</p>
          <p className="mt-1 text-2xl font-bold text-amber-300">{d.pendingBookings}</p>
        </div>
        <div className="glass-panel rounded-2xl p-5">
          <p className="text-xs text-slate-400">Confirmed Bookings</p>
          <p className="mt-1 text-2xl font-bold text-cyan-300">{d.confirmedBookings}</p>
        </div>
        <div className="glass-panel rounded-2xl p-5">
          <p className="text-xs text-slate-400">Net Earnings</p>
          <p className="mt-1 text-2xl font-bold text-emerald-300">{formatINR(d.netEarnings)}</p>
        </div>
      </div>

      {a && (
        <div className="glass-panel rounded-2xl p-6">
          <h2 className="text-base font-semibold text-white">Analytics Summary</h2>
          <div className="mt-4 grid gap-4 text-sm sm:grid-cols-4">
            <div><p className="text-xs text-slate-400">Total Bookings</p><p className="font-semibold text-white">{a.totalBookings}</p></div>
            <div><p className="text-xs text-slate-400">Completed Stays</p><p className="font-semibold text-cyan-300">{a.completedBookings}</p></div>
            <div><p className="text-xs text-slate-400">Cancelled</p><p className="font-semibold text-rose-300">{a.cancelledBookings}</p></div>
            <div><p className="text-xs text-slate-400">Net Revenue</p><p className="font-semibold text-emerald-300">{formatINR(a.netRevenue)}</p></div>
          </div>
        </div>
      )}

      <div className="glass-panel rounded-2xl p-6">
        <h2 className="text-base font-semibold text-white">Upcoming Check-Ins (Next 7 Days)</h2>
        {d.upcomingCheckIns.length ? (
          <div className="mt-4 space-y-2">
            {d.upcomingCheckIns.map((b) => (
              <div key={b.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-sm">
                <div>
                  <span className="font-mono text-xs text-cyan-300">{b.bookingReference}</span>
                  <p className="font-medium text-white">{b.guestName} ({b.guestPhone})</p>
                  <p className="text-xs text-slate-400">{b.propertyName} · Room {b.roomNumber} · Bed {b.bedNumber}</p>
                </div>
                <span className="text-xs text-slate-300">{formatIST(b.checkIn)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-400">No upcoming check-ins in the next 7 days.</p>
        )}
      </div>
    </div>
  );
}
