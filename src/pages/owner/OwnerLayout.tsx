import { NavLink, Outlet } from 'react-router-dom';
import { BarChart3, Building2, CalendarCheck, CalendarX, FileCheck2, Wallet } from 'lucide-react';

const LINKS = [
  { to: '/owner', label: 'Overview & Analytics', icon: BarChart3, end: true },
  { to: '/owner/properties', label: 'Properties, Rooms & Beds', icon: Building2 },
  { to: '/owner/availability', label: 'Availability & Blocks', icon: CalendarX },
  { to: '/owner/bookings', label: 'Bookings, Check-In & Walk-In', icon: CalendarCheck },
  { to: '/owner/payouts', label: 'Payouts & Earnings', icon: Wallet },
  { to: '/owner/verification', label: 'KYC & Verification', icon: FileCheck2 },
];

export function OwnerLayout() {
  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-10">
      <div className="grid gap-6 lg:grid-cols-12">
        <aside className="glass-panel h-fit rounded-2xl p-4 lg:col-span-3" aria-label="Owner dashboard navigation">
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
        <div className="lg:col-span-9">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
