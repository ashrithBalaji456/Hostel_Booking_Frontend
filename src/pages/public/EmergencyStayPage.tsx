import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Zap } from 'lucide-react';
import { propertyApi } from '../../api/endpoints';
import { PropertyCard } from '../../components/property/PropertyCard';
import { ErrorState } from '../../components/ui/ErrorState';
import { defaultCheckInLocal, defaultCheckOutLocal, toIsoUtc } from '../../utils/format';

export function EmergencyStayPage() {
  const [city, setCity] = useState('Bengaluru');
  const [checkIn, setCheckIn] = useState(defaultCheckInLocal());
  const [checkOut, setCheckOut] = useState(defaultCheckOutLocal(12));
  const [maxBudget, setMaxBudget] = useState('');

  const query = useQuery({
    queryKey: ['emergency-stays', city, checkIn, checkOut, maxBudget],
    queryFn: () =>
      propertyApi.searchEmergency({
        city: city || undefined,
        checkIn: toIsoUtc(checkIn),
        checkOut: toIsoUtc(checkOut),
        maxBudget: maxBudget || undefined,
        page: 0,
        size: 12,
      }),
    enabled: Boolean(checkIn && checkOut),
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="glass-panel rounded-3xl border-amber-500/30 p-6">
        <div className="flex items-center gap-2 text-amber-300">
          <Zap className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">Urgent / Same-Day Accommodation</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold text-white">Emergency Stay Finder</h1>
        <p className="mt-1 text-sm text-slate-300">
          Only properties that have explicitly enabled emergency bookings and accept your arrival window are shown.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <div>
            <label htmlFor="em-city" className="block text-xs text-slate-400">City</label>
            <input id="em-city" value={city} onChange={(e) => setCity(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
          </div>
          <div>
            <label htmlFor="em-in" className="block text-xs text-slate-400">Arrival Time</label>
            <input id="em-in" type="datetime-local" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
          </div>
          <div>
            <label htmlFor="em-out" className="block text-xs text-slate-400">Check-out Time</label>
            <input id="em-out" type="datetime-local" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
          </div>
          <div>
            <label htmlFor="em-budget" className="block text-xs text-slate-400">Max Budget (₹)</label>
            <input id="em-budget" type="number" value={maxBudget} onChange={(e) => setMaxBudget(e.target.value)} placeholder="1000" className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
          </div>
        </div>
      </div>

      <div className="mt-6">
        {query.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => <div key={i} className="glass-panel h-72 animate-pulse rounded-2xl" />)}
          </div>
        ) : query.isError ? (
          <ErrorState message={(query.error as Error).message} onRetry={() => void query.refetch()} />
        ) : query.data?.content.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {query.data.content.map((p) => <PropertyCard key={p.id} property={p} />)}
          </div>
        ) : (
          <div className="glass-panel rounded-2xl p-8 text-center text-sm text-slate-400">
            No emergency-enabled properties match this arrival window right now. Try adjusting your city or check-in time.
          </div>
        )}
      </div>
    </div>
  );
}
