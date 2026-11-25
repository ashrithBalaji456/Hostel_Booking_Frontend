import { NavLink, Outlet } from 'react-router-dom';
import { Bell, Calendar, Heart, LifeBuoy, Scale, ShieldAlert, User } from 'lucide-react';

const LINKS = [
  { to: '/account/bookings', label: 'My Bookings', icon: Calendar },
  { to: '/account/profile', label: 'Profile', icon: User },
  { to: '/account/favorites', label: 'Favorites', icon: Heart },
  { to: '/account/notifications', label: 'Notifications', icon: Bell },
  { to: '/account/support', label: 'Support Tickets', icon: LifeBuoy },
  { to: '/account/disputes', label: 'Disputes', icon: Scale },
  { to: '/account/safety', label: 'Safety Report', icon: ShieldAlert },
];

export function CustomerLayout() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-12">
        <aside className="glass-panel h-fit rounded-2xl p-3 lg:col-span-3" aria-label="Customer account navigation">
          <nav className="flex flex-wrap gap-1 lg:flex-col">
            {LINKS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                      isActive ? 'bg-cyan-500/15 text-cyan-300' : 'text-slate-300 hover:bg-slate-800/70'
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
