import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building2, CalendarCheck, Plus, Wallet } from 'lucide-react';
import { ownerApi } from '../../api/endpoints';
import { ErrorState } from '../../components/ui/ErrorState';
import { formatINR, formatIST } from '../../utils/format';

export function OwnerDashboardPage() {
  const dashQuery = useQuery({ queryKey: ['owner-dashboard'], queryFn: ownerApi.getDashboard });
  const analyticsQuery = useQuery({ queryKey: ['owner-analytics'], queryFn: ownerApi.getAnalytics });

  if (dashQuery.isLoading) return <div className="glass-panel h-72 animate-pulse rounded-2xl" />;
  if (dashQuery.isError || !dashQuery.data) {
    return <ErrorState message={(dashQuery.error as Error)?.message ?? 'Failed to load owner dashboard'} onRetry={() => void dashQuery.refetch()} />;
  }

  const d = dashQuery.data;
  const a = analyticsQuery.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Property Owner Overview</h1>
          <p className="mt-1 text-base text-slate-300">
            Manage your hostels, PGs, bed inventory, check-ins, and earnings in one place.
          </p>
        </div>
        <Link
          to="/owner/properties"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 hover:opacity-95"
        >
          <Plus className="h-4 w-4" />
          Manage Properties
        </Link>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-300">Properties</p>
            <Building2 className="h-5 w-5 text-cyan-400" />
          </div>
          <p className="mt-3 text-4xl font-bold text-white">{d.totalProperties}</p>
          <p className="mt-1 text-xs text-slate-400">Active hostels &amp; PGs</p>
        </div>
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-300">Pending Approvals</p>
            <CalendarCheck className="h-5 w-5 text-amber-400" />
          </div>
          <p className="mt-3 text-4xl font-bold text-amber-300">{d.pendingBookings}</p>
          <p className="mt-1 text-xs text-slate-400">Awaiting owner review</p>
        </div>
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-300">Confirmed Bookings</p>
            <CalendarCheck className="h-5 w-5 text-cyan-400" />
          </div>
          <p className="mt-3 text-4xl font-bold text-cyan-300">{d.confirmedBookings}</p>
          <p className="mt-1 text-xs text-slate-400">Upcoming &amp; active stays</p>
        </div>
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-300">Net Earnings</p>
            <Wallet className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="mt-3 text-4xl font-bold text-emerald-300">{formatINR(d.netEarnings)}</p>
          <p className="mt-1 text-xs text-slate-400">Total settled &amp; accrued</p>
        </div>
      </div>

      {a && (
        <div className="glass-panel rounded-2xl p-6 sm:p-7">
          <h2 className="text-lg font-semibold text-white">Analytics Summary</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
              <p className="text-sm text-slate-400">Total Bookings</p>
              <p className="mt-1.5 text-2xl font-bold text-white">{a.totalBookings}</p>
            </div>
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
              <p className="text-sm text-slate-400">Completed Stays</p>
              <p className="mt-1.5 text-2xl font-bold text-cyan-300">{a.completedBookings}</p>
            </div>
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
              <p className="text-sm text-slate-400">Cancelled</p>
              <p className="mt-1.5 text-2xl font-bold text-rose-300">{a.cancelledBookings}</p>
            </div>
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
              <p className="text-sm text-slate-400">Net Revenue</p>
              <p className="mt-1.5 text-2xl font-bold text-emerald-300">{formatINR(a.netRevenue)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="glass-panel rounded-2xl p-6 sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">Upcoming Check-Ins (Next 7 Days)</h2>
          <Link to="/owner/bookings" className="text-sm font-medium text-cyan-300 hover:text-cyan-200">
            View all bookings
          </Link>
        </div>
        {d.upcomingCheckIns.length ? (
          <div className="mt-4 space-y-3">
            {d.upcomingCheckIns.map((b) => (
              <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <div>
                  <span className="font-mono text-xs text-cyan-300">{b.bookingReference}</span>
                  <p className="mt-0.5 text-base font-medium text-white">{b.guestName} ({b.guestPhone})</p>
                  <p className="text-sm text-slate-400">{b.propertyName} · Room {b.roomNumber} · Bed {b.bedNumber}</p>
                </div>
                <span className="text-sm font-medium text-slate-200">{formatIST(b.checkIn)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-base text-slate-400">No upcoming check-ins in the next 7 days.</p>
        )}
      </div>
    </div>
  );
}
