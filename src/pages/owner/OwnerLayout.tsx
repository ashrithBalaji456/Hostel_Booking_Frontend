import { Link, NavLink, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Building2, CalendarCheck, CalendarX, FileCheck2, Sparkles, Wallet } from 'lucide-react';
import { ownerApi } from '../../api/endpoints';
import { PieChart3DCard } from '../../components/owner/OwnerAnalyticsCharts';

const LINKS = [
  { to: '/owner', label: 'Overview & Analytics', icon: BarChart3, end: true },
  { to: '/owner/properties', label: 'Properties, Rooms & Beds', icon: Building2 },
  { to: '/owner/availability', label: 'Availability & Blocks', icon: CalendarX },
  { to: '/owner/bookings', label: 'Bookings, Check-In & Walk-In', icon: CalendarCheck },
  { to: '/owner/payouts', label: 'Payouts & Earnings', icon: Wallet },
  { to: '/owner/verification', label: 'KYC & Verification', icon: FileCheck2 },
];

export function OwnerLayout() {
  const dashQuery = useQuery({ queryKey: ['owner-dashboard'], queryFn: ownerApi.getDashboard, retry: false });
  const analyticsQuery = useQuery({ queryKey: ['owner-analytics'], queryFn: ownerApi.getAnalytics, retry: false });
  const propertiesQuery = useQuery({ queryKey: ['owner-properties'], queryFn: ownerApi.listProperties, retry: false });
  const bookingsQuery = useQuery({
    queryKey: ['owner-bookings-inventory'],
    queryFn: () => ownerApi.getBookings({ page: 0, size: 100 }),
    retry: false,
  });

  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-10">
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-3 lg:sticky lg:top-20 lg:self-start">
          <aside className="glass-panel h-fit rounded-2xl p-4" aria-label="Owner dashboard navigation">
            <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-indigo-300">Owner Workspace</p>
            <nav className="flex flex-wrap gap-1.5 lg:flex-col">
              {LINKS.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-medium transition ${
                        isActive ? 'bg-indigo-500/20 text-indigo-200' : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
          </aside>

          <PieChart3DCard
            properties={propertiesQuery.data ?? []}
            bookings={bookingsQuery.data?.content ?? []}
            dashboard={dashQuery.data}
            analytics={analyticsQuery.data}
          />

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-300">
              <Sparkles className="h-3.5 w-3.5" />
              Quick Actions
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <Link to="/owner/properties" className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 font-medium text-slate-200 transition hover:-translate-y-0.5 hover:border-cyan-400/40 hover:text-white">
                + Add Room
              </Link>
              <Link to="/owner/bookings" className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 font-medium text-slate-200 transition hover:-translate-y-0.5 hover:border-cyan-400/40 hover:text-white">
                Walk-In Check-In
              </Link>
              <Link to="/owner/availability" className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 font-medium text-slate-200 transition hover:-translate-y-0.5 hover:border-cyan-400/40 hover:text-white">
                Block Dates
              </Link>
              <Link to="/owner/verification" className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 font-medium text-slate-200 transition hover:-translate-y-0.5 hover:border-cyan-400/40 hover:text-white">
                Submit KYC
              </Link>
            </div>
          </div>
        </div>
        <div className="lg:col-span-9">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
