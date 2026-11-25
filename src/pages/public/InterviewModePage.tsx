import { lazy, Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Briefcase, List, Map as MapIcon, MapPin, ShieldCheck } from 'lucide-react';
import { propertyApi } from '../../api/endpoints';
import { ErrorState } from '../../components/ui/ErrorState';
import { defaultCheckInLocal, defaultCheckOutLocal, formatINR, toIsoUtc } from '../../utils/format';

const PropertyMap = lazy(() => import('../../components/map/PropertyMap'));

export function InterviewModePage() {
  const [interviewLat, setInterviewLat] = useState('12.9716');
  const [interviewLon, setInterviewLon] = useState('77.5946');
  const [radiusKm, setRadiusKm] = useState('10');
  const [checkIn, setCheckIn] = useState(defaultCheckInLocal());
  const [checkOut, setCheckOut] = useState(defaultCheckOutLocal(24));
  const [maxBudget, setMaxBudget] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const query = useQuery({
    queryKey: ['interview-mode', interviewLat, interviewLon, radiusKm, checkIn, checkOut, maxBudget],
    queryFn: () =>
      propertyApi.searchInterviewMode({
        interviewLat: Number(interviewLat),
        interviewLon: Number(interviewLon),
        radiusKm: Number(radiusKm),
        checkIn: toIsoUtc(checkIn),
        checkOut: toIsoUtc(checkOut),
        maxBudget: maxBudget || undefined,
      }),
    enabled: Boolean(interviewLat && interviewLon && checkIn && checkOut),
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="glass-panel rounded-3xl border-cyan-500/30 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 text-cyan-300">
              <Briefcase className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-wider">Job Seeker &amp; Exam Travel Mode</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold text-white">Interview Mode</h1>
            <p className="mt-1 text-sm text-slate-300">
              Search verified beds near your interview location coordinates with straight-line distance from the backend.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-xl border border-slate-700 bg-slate-900 p-0.5 text-xs" role="group" aria-label="Interview results view">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 font-medium ${viewMode === 'list' ? 'bg-cyan-600 text-white' : 'text-slate-300'}`}
              >
                <List className="h-3.5 w-3.5" /> List
              </button>
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 font-medium ${viewMode === 'map' ? 'bg-cyan-600 text-white' : 'text-slate-300'}`}
              >
                <MapIcon className="h-3.5 w-3.5" /> Map
              </button>
            </div>
            <Link to="/search" className="rounded-xl border border-slate-700 px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800">
              Standard Search
            </Link>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <div>
            <label htmlFor="im-lat" className="block text-xs text-slate-400">Venue Latitude</label>
            <input id="im-lat" type="number" step="any" min="-90" max="90" value={interviewLat} onChange={(e) => setInterviewLat(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
          </div>
          <div>
            <label htmlFor="im-lon" className="block text-xs text-slate-400">Venue Longitude</label>
            <input id="im-lon" type="number" step="any" min="-180" max="180" value={interviewLon} onChange={(e) => setInterviewLon(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
          </div>
          <div>
            <label htmlFor="im-rad" className="block text-xs text-slate-400">Radius (km)</label>
            <input id="im-rad" type="number" min="1" value={radiusKm} onChange={(e) => setRadiusKm(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
          </div>
          <div>
            <label htmlFor="im-in" className="block text-xs text-slate-400">Check-in</label>
            <input id="im-in" type="datetime-local" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
          </div>
          <div>
            <label htmlFor="im-out" className="block text-xs text-slate-400">Check-out</label>
            <input id="im-out" type="datetime-local" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
          </div>
          <div>
            <label htmlFor="im-budget" className="block text-xs text-slate-400">Max Budget ₹</label>
            <input id="im-budget" type="number" value={maxBudget} onChange={(e) => setMaxBudget(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {query.isLoading ? (
          <div className="glass-panel h-40 animate-pulse rounded-2xl" />
        ) : query.isError ? (
          <ErrorState message={(query.error as Error).message} onRetry={() => void query.refetch()} />
        ) : query.data?.length ? (
          viewMode === 'map' ? (
            <Suspense fallback={<div className="glass-panel h-[420px] animate-pulse rounded-2xl" />}>
              <PropertyMap
                venuePoint={{
                  latitude: Number(interviewLat),
                  longitude: Number(interviewLon),
                  label: 'Interview Location',
                }}
                markers={query.data
                  .filter((item) => item.latitude != null && item.longitude != null)
                  .map((item) => ({
                    id: item.propertyId,
                    name: item.propertyName,
                    address: `${item.address}, ${item.city}`,
                    latitude: item.latitude!,
                    longitude: item.longitude!,
                    startingPrice: item.startingPrice,
                    availableBedCount: item.availableBeds,
                    distanceKm: item.distanceKm,
                  }))}
              />
            </Suspense>
          ) : (
            query.data.map((item) => (
              <div key={item.propertyId} className="glass-panel flex flex-col justify-between gap-4 rounded-2xl p-5 sm:flex-row sm:items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-white">{item.propertyName}</h2>
                    {item.verificationStatus === 'APPROVED' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs text-emerald-300">
                        <ShieldCheck className="h-3 w-3" /> Verified
                      </span>
                    )}
                  </div>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                    <MapPin className="h-3.5 w-3.5" /> {item.address}, {item.city}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs">
                    {item.distanceKm != null && (
                      <span className="text-cyan-300">{item.distanceKm} km straight-line distance</span>
                    )}
                    <span className="text-emerald-300">{item.availableBeds} beds available</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Starting at</p>
                    <p className="text-xl font-bold text-white">{formatINR(item.startingPrice)}</p>
                  </div>
                  <Link
                    to={`/properties/${item.propertyId}?checkIn=${encodeURIComponent(item.checkIn)}&checkOut=${encodeURIComponent(item.checkOut)}`}
                    className="rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-500"
                  >
                    Select Bed
                  </Link>
                </div>
              </div>
            ))
          )
        ) : (
          <div className="glass-panel rounded-2xl p-8 text-center text-sm text-slate-400">
            No nearby verified properties found for this interview location and radius.
          </div>
        )}
      </div>
    </div>
  );
}
