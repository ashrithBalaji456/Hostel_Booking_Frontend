import { NavLink, Outlet } from 'react-router-dom';
import { BarChart3, Building2, ShieldAlert, Ticket, Users, Wallet } from 'lucide-react';

const LINKS = [
  { to: '/admin', label: 'Analytics & Overview', icon: BarChart3, end: true },
  { to: '/admin/users', label: 'Users & Properties', icon: Users },
  { to: '/admin/verifications', label: 'Owner Verifications', icon: Building2 },
  { to: '/admin/finance', label: 'Bookings, Payments & Payouts', icon: Wallet },
  { to: '/admin/coupons', label: 'Coupons', icon: Ticket },
  { to: '/admin/moderation', label: 'Support, Disputes & Safety', icon: ShieldAlert },
];

export function AdminLayout() {
  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-10">
      <div className="grid gap-6 lg:grid-cols-12">
        <aside className="glass-panel h-fit rounded-2xl p-3 lg:col-span-3" aria-label="Admin console navigation">
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
                      isActive ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-300 hover:bg-slate-800/70'
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
