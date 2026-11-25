import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Briefcase, CalendarClock, Clock, Compass, ShieldCheck, Zap } from 'lucide-react';
import { propertyApi } from '../../api/endpoints';
import { PropertyCard } from '../../components/property/PropertyCard';
import { defaultCheckInLocal, defaultCheckOutLocal, toIsoUtc } from '../../utils/format';

const SpatialHeroScene = lazy(() => import('../../components/three/SpatialHeroScene'));

export function LandingPage() {
  const navigate = useNavigate();
  const [city, setCity] = useState('Bengaluru');
  const [checkIn, setCheckIn] = useState(defaultCheckInLocal());
  const [checkOut, setCheckOut] = useState(defaultCheckOutLocal(24));
  const [stayType, setStayType] = useState<'SHORT_STAY' | 'LONG_STAY'>('SHORT_STAY');
  const [maxPrice, setMaxPrice] = useState('');
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
  }, []);

  const featuredQuery = useQuery({
    queryKey: ['featured-properties'],
    queryFn: () => propertyApi.search({ verifiedOnly: true, size: 6, page: 0 }),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const sp = new URLSearchParams();
    if (city) sp.set('city', city);
    if (checkIn) sp.set('checkIn', toIsoUtc(checkIn));
    if (checkOut) sp.set('checkOut', toIsoUtc(checkOut));
    sp.set('stayType', stayType);
    if (maxPrice) sp.set('maxPrice', maxPrice);
    navigate(`/search?${sp.toString()}`);
  };

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-cyan-500/10 via-indigo-500/5 to-transparent" />

      <section className="mx-auto max-w-7xl px-4 pb-12 pt-10 sm:px-6 lg:pt-16">
        <div className="grid items-center gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              Verified Hostels &amp; PGs across India
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              Stay anywhere, <span className="bg-gradient-to-r from-cyan-300 to-indigo-400 bg-clip-text text-transparent">from 3 hours to 12 months.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base text-slate-300 sm:text-lg">
              “No one should have to give up an opportunity because they couldn’t find accommodation.”
              Book verified beds near your exam center, interview venue, college, or workplace.
            </p>

            <form onSubmit={handleSearch} className="glass-panel spatial-glow mt-8 rounded-2xl p-4 sm:p-5">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <div>
                  <label htmlFor="hero-city" className="block text-xs font-medium text-slate-400">City</label>
                  <input
                    id="hero-city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Bengaluru, Hyderabad..."
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/90 px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label htmlFor="hero-checkin" className="block text-xs font-medium text-slate-400">Check-in</label>
                  <input
                    id="hero-checkin"
                    type="datetime-local"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/90 px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label htmlFor="hero-checkout" className="block text-xs font-medium text-slate-400">Check-out</label>
                  <input
                    id="hero-checkout"
                    type="datetime-local"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/90 px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label htmlFor="hero-staytype" className="block text-xs font-medium text-slate-400">Stay Type</label>
                  <select
                    id="hero-staytype"
                    value={stayType}
                    onChange={(e) => setStayType(e.target.value as 'SHORT_STAY' | 'LONG_STAY')}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/90 px-3 py-2 text-sm text-white"
                  >
                    <option value="SHORT_STAY">Short Stay (Hours/Days)</option>
                    <option value="LONG_STAY">Long Stay (Weeks/Months)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="hero-budget" className="block text-xs font-medium text-slate-400">Max Nightly ₹</label>
                  <input
                    id="hero-budget"
                    type="number"
                    min="0"
                    placeholder="e.g. 800"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/90 px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-400">Concurrency-safe bed holds · Instant &amp; owner-approved options</p>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20"
                >
                  <Compass className="h-4 w-4" />
                  Search Stays
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-5">
            <div className="glass-panel rounded-3xl p-4">
              {!prefersReducedMotion ? (
                <Suspense
                  fallback={
                    <div className="flex h-64 items-center justify-center rounded-2xl bg-slate-900/60 text-sm text-slate-400">
                      Spatial Stay Preview
                    </div>
                  }
                >
                  <SpatialHeroScene />
                </Suspense>
              ) : (
                <div className="flex h-64 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-950/60 to-indigo-950/60 p-6 text-center">
                  <p className="text-sm text-cyan-200">Verified beds across Hostels, PGs, Dormitories &amp; Co-Living.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 4 Direct Entry Points Bento */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link to="/emergency" className="glass-panel rounded-2xl p-5 transition hover:border-amber-400/50">
            <Zap className="h-6 w-6 text-amber-400" />
            <h2 className="mt-3 text-base font-semibold text-white">Emergency Stay</h2>
            <p className="mt-1 text-xs text-slate-400">Same-day &amp; late-night check-in hostels when you need a bed tonight.</p>
          </Link>
          <Link to="/interview-mode" className="glass-panel rounded-2xl p-5 transition hover:border-cyan-400/50">
            <Briefcase className="h-6 w-6 text-cyan-400" />
            <h2 className="mt-3 text-base font-semibold text-white">Interview Mode</h2>
            <p className="mt-1 text-xs text-slate-400">Find verified beds near your interview or exam center with travel estimates.</p>
          </Link>
          <Link to="/search?stayType=SHORT_STAY" className="glass-panel rounded-2xl p-5 transition hover:border-indigo-400/50">
            <Clock className="h-6 w-6 text-indigo-400" />
            <h2 className="mt-3 text-base font-semibold text-white">Short Stay</h2>
            <p className="mt-1 text-xs text-slate-400">Hourly, overnight, or multi-night stays with transparent pricing.</p>
          </Link>
          <Link to="/search?stayType=LONG_STAY" className="glass-panel rounded-2xl p-5 transition hover:border-emerald-400/50">
            <CalendarClock className="h-6 w-6 text-emerald-400" />
            <h2 className="mt-3 text-base font-semibold text-white">Long Stay &amp; PG</h2>
            <p className="mt-1 text-xs text-slate-400">Weekly or monthly PGs with rent schedules, deposits, and extensions.</p>
          </Link>
        </div>

        {/* Backend-driven Featured Properties */}
        <div className="mt-12">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Verified Properties</h2>
            <Link to="/search" className="text-sm font-medium text-cyan-300 hover:underline">View all</Link>
          </div>
          {featuredQuery.isLoading ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-panel h-72 animate-pulse rounded-2xl bg-slate-900/50" />
              ))}
            </div>
          ) : featuredQuery.data?.content.length ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featuredQuery.data.content.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          ) : (
            <div className="glass-panel mt-4 rounded-2xl p-6 text-sm text-slate-400">
              No approved properties found yet. Property owners can list and submit properties for verification.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
