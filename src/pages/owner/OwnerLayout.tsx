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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-12">
        <aside className="glass-panel h-fit rounded-2xl p-3 lg:col-span-3" aria-label="Owner dashboard navigation">
          <nav className="flex flex-wrap gap-1 lg:flex-col">
            {LINKS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                      isActive ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-300 hover:bg-slate-800/70'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
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
