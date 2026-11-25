import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  Building2,
  CalendarCheck,
  Compass,
  Menu,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  Wallet,
  X,
  Zap,
  Briefcase,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AmbientBackground } from './AmbientBackground';

export function AppLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const isOwner = isAuthenticated && user?.role === 'PROPERTY_OWNER';
  const isAdmin = isAuthenticated && user?.role === 'ADMIN';
  const homePath = isOwner ? '/owner' : isAdmin ? '/admin' : '/';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive ? 'bg-cyan-500/15 text-cyan-300' : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
    }`;

  return (
    <div className="relative flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <AmbientBackground />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-cyan-600 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>

      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-4 py-3 sm:px-6 lg:px-10">
          <Link to={homePath} className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-600 text-slate-950 shadow-lg shadow-cyan-500/20">
              <Sparkles className="h-5 w-5" />
            </span>
            <span>Spatial Stay</span>
          </Link>

          <nav aria-label="Primary navigation" className="hidden items-center gap-1 md:flex">
            {isOwner ? (
              <>
                <NavLink to="/owner" end className={navLinkClass}>
                  <BarChart3 className="h-4 w-4 text-indigo-300" />
                  Overview
                </NavLink>
                <NavLink to="/owner/properties" className={navLinkClass}>
                  <Building2 className="h-4 w-4 text-cyan-300" />
                  Properties
                </NavLink>
                <NavLink to="/owner/bookings" className={navLinkClass}>
                  <CalendarCheck className="h-4 w-4 text-emerald-300" />
                  Bookings
                </NavLink>
                <NavLink to="/owner/payouts" className={navLinkClass}>
                  <Wallet className="h-4 w-4 text-amber-300" />
                  Payouts
                </NavLink>
              </>
            ) : isAdmin ? (
              <>
                <NavLink to="/admin" end className={navLinkClass}>
                  <ShieldCheck className="h-4 w-4 text-emerald-300" />
                  Admin Console
                </NavLink>
                <NavLink to="/admin/users" className={navLinkClass}>
                  <Users className="h-4 w-4 text-cyan-300" />
                  Users &amp; Properties
                </NavLink>
                <NavLink to="/admin/verifications" className={navLinkClass}>
                  <Building2 className="h-4 w-4 text-indigo-300" />
                  Verifications
                </NavLink>
                <NavLink to="/admin/finance" className={navLinkClass}>
                  <Wallet className="h-4 w-4 text-amber-300" />
                  Finance
                </NavLink>
              </>
            ) : (
              <>
                <NavLink to="/search" className={navLinkClass}>
                  <Compass className="h-4 w-4" />
                  Explore
                </NavLink>
                <NavLink to="/emergency" className={navLinkClass}>
                  <Zap className="h-4 w-4 text-amber-400" />
                  Emergency Stay
                </NavLink>
                <NavLink to="/interview-mode" className={navLinkClass}>
                  <Briefcase className="h-4 w-4 text-cyan-400" />
                  Interview Mode
                </NavLink>
                {isAuthenticated && user?.role === 'CUSTOMER' && (
                  <NavLink to="/account/bookings" className={navLinkClass}>
                    <User className="h-4 w-4" />
                    My Stays
                  </NavLink>
                )}
              </>
            )}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {isAuthenticated && user ? (
              <>
                <Link
                  to="/account/notifications"
                  aria-label="Notifications"
                  className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  <Bell className="h-5 w-5" />
                </Link>
                <Link
                  to="/account/profile"
                  className="rounded-xl border border-slate-700/80 bg-slate-900/80 px-3 py-1.5 text-sm font-medium text-slate-200 hover:border-cyan-500/50"
                >
                  {user.fullName.split(' ')[0]} · {user.role.replace('_', ' ')}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="Log out"
                  className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-xl px-3.5 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 hover:opacity-95"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 md:hidden"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t border-slate-800 bg-slate-950 px-4 py-4 md:hidden">
            <div className="flex flex-col gap-2">
              {isOwner ? (
                <>
                  <Link to="/owner" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 text-sm text-indigo-300 hover:bg-slate-800">
                    Overview &amp; Analytics
                  </Link>
                  <Link to="/owner/properties" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-slate-800">
                    Properties, Rooms &amp; Beds
                  </Link>
                  <Link to="/owner/availability" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-slate-800">
                    Availability &amp; Blocks
                  </Link>
                  <Link to="/owner/bookings" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-slate-800">
                    Bookings &amp; Check-In
                  </Link>
                  <Link to="/owner/payouts" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-slate-800">
                    Payouts &amp; Earnings
                  </Link>
                  <Link to="/owner/verification" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-slate-800">
                    KYC &amp; Verification
                  </Link>
                </>
              ) : isAdmin ? (
                <>
                  <Link to="/admin" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 text-sm text-emerald-300 hover:bg-slate-800">
                    Admin Console
                  </Link>
                  <Link to="/admin/users" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-slate-800">
                    Users &amp; Properties
                  </Link>
                  <Link to="/admin/verifications" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-slate-800">
                    Owner Verifications
                  </Link>
                  <Link to="/admin/finance" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-slate-800">
                    Finance &amp; Payouts
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/search" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-slate-800">
                    Explore Stays
                  </Link>
                  <Link to="/emergency" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 text-sm text-amber-300 hover:bg-slate-800">
                    Emergency Stay
                  </Link>
                  <Link to="/interview-mode" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 text-sm text-cyan-300 hover:bg-slate-800">
                    Interview Mode
                  </Link>
                </>
              )}
              {isAuthenticated && user ? (
                <>
                  {!isOwner && !isAdmin && (
                    <Link to="/account/bookings" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-slate-800">
                      My Bookings
                    </Link>
                  )}
                  <Link to="/account/profile" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-slate-800">
                    Profile &amp; Account
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      void handleLogout();
                    }}
                    className="rounded-lg px-3 py-2 text-left text-sm text-rose-300 hover:bg-slate-800"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="mt-2 flex gap-2">
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="flex-1 rounded-xl border border-slate-700 py-2 text-center text-sm">
                    Sign In
                  </Link>
                  <Link to="/register" onClick={() => setMobileOpen(false)} className="flex-1 rounded-xl bg-cyan-600 py-2 text-center text-sm font-semibold text-white">
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <main id="main-content" className="relative z-10 flex-1">
        <Outlet />
      </main>

      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950/85 py-8 text-sm text-slate-400 backdrop-blur-sm">
        <div className="mx-auto flex max-w-screen-2xl flex-col items-start justify-between gap-4 px-4 sm:flex-row sm:items-center sm:px-6 lg:px-10">
          <div>
            <p className="font-semibold text-slate-200">Spatial Stay</p>
            <p className="text-xs text-slate-400">
              “No one should have to give up an opportunity because they couldn’t find accommodation.”
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-xs">
            {isOwner ? (
              <>
                <Link to="/owner" className="hover:text-cyan-300">Overview</Link>
                <Link to="/owner/properties" className="hover:text-cyan-300">Properties</Link>
                <Link to="/owner/bookings" className="hover:text-cyan-300">Bookings</Link>
                <Link to="/owner/payouts" className="hover:text-cyan-300">Payouts</Link>
                <Link to="/account/support" className="hover:text-cyan-300">Support</Link>
              </>
            ) : isAdmin ? (
              <>
                <Link to="/admin" className="hover:text-cyan-300">Admin Console</Link>
                <Link to="/admin/verifications" className="hover:text-cyan-300">Verifications</Link>
                <Link to="/admin/finance" className="hover:text-cyan-300">Finance</Link>
                <Link to="/admin/moderation" className="hover:text-cyan-300">Moderation</Link>
              </>
            ) : (
              <>
                <Link to="/search" className="hover:text-cyan-300">Search Stays</Link>
                <Link to="/emergency" className="hover:text-cyan-300">Emergency Stay</Link>
                <Link to="/interview-mode" className="hover:text-cyan-300">Interview Mode</Link>
                <Link to="/account/support" className="hover:text-cyan-300">Support</Link>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
