import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Briefcase, CalendarClock, Clock, Compass, Crosshair, List, ShieldCheck, Zap } from 'lucide-react';
import { propertyApi } from '../../api/endpoints';
import { PropertyCard } from '../../components/property/PropertyCard';
import { SelectDropdown } from '../../components/ui/SelectDropdown';
import { buildHeroBedSlots } from '../../utils/heroBeds';
import { resolveCurrentLocation } from '../../utils/geolocation';
import { defaultCheckInLocal, defaultCheckOutLocal, formatINR, formatIST, toIsoUtc } from '../../utils/format';
import type { PropertySearchItemResponse } from '../../types/api';

const SpatialHeroScene = lazy(() => import('../../components/three/SpatialHeroScene'));

export function LandingPage() {
  const navigate = useNavigate();
  const [city, setCity] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [checkIn, setCheckIn] = useState(defaultCheckInLocal());
  const [checkOut, setCheckOut] = useState(defaultCheckOutLocal(24));
  const [stayType, setStayType] = useState<'SHORT_STAY' | 'LONG_STAY'>('SHORT_STAY');
  const [maxPrice, setMaxPrice] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const [sceneMode, setSceneMode] = useState<'room' | 'globe'>('room');
  const [roomListFallback, setRoomListFallback] = useState(false);
  const [selectedBedId, setSelectedBedId] = useState<string | null>(null);
  const [selectedGlobeProp, setSelectedGlobeProp] = useState<PropertySearchItemResponse | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mq.matches);
    }
  }, []);

  const featuredQuery = useQuery({
    queryKey: ['featured-properties'],
    queryFn: () => propertyApi.search({ verifiedOnly: true, size: 12, page: 0 }),
  });

  const firstProperty = featuredQuery.data?.content[0];

  const previewDetailQuery = useQuery({
    queryKey: ['hero-preview-property', firstProperty?.id],
    queryFn: () => propertyApi.getDetails(firstProperty!.id),
    enabled: Boolean(firstProperty?.id),
  });

  const previewAvailQuery = useQuery({
    queryKey: ['hero-preview-avail', firstProperty?.id, checkIn, checkOut],
    queryFn: () => propertyApi.getAvailability(firstProperty!.id, toIsoUtc(checkIn), toIsoUtc(checkOut)),
    enabled: Boolean(firstProperty?.id && checkIn && checkOut && new Date(checkOut) > new Date(checkIn)),
  });

  const heroBedSlots = buildHeroBedSlots(previewDetailQuery.data?.rooms, previewAvailQuery.data?.availableBeds);
  const selectedBedSlot = heroBedSlots.find((b) => b.bedId === selectedBedId) ?? null;

  const handleUseMyLocation = async () => {
    setGeoError(null);
    setGeoLoading(true);
    try {
      const loc = await resolveCurrentLocation(false);
      setCoords({
        lat: Number(loc.latitude.toFixed(5)),
        lon: Number(loc.longitude.toFixed(5)),
      });
      setCity(loc.source === 'ip' && loc.city ? loc.city : '');
    } catch (err) {
      if ((err as Error).message === 'PERMISSION_DENIED') {
        setGeoError('Location permission denied. Enter your destination city instead.');
      } else {
        setGeoError('Unable to detect current location. Enter your destination city instead.');
      }
    } finally {
      setGeoLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!checkIn || !checkOut) {
      setFormError('Please select both check-in and check-out dates.');
      return;
    }
    if (new Date(checkOut) <= new Date(checkIn)) {
      setFormError('Check-out must be strictly after check-in.');
      return;
    }
    if (!city.trim() && !coords) {
      setFormError('Enter a city or tap "Use my location" to search.');
      return;
    }

    const sp = new URLSearchParams();
    if (city.trim()) sp.set('city', city.trim());
    if (coords && !city.trim()) {
      sp.set('latitude', String(coords.lat));
      sp.set('longitude', String(coords.lon));
      sp.set('radiusKm', '15');
    }
    sp.set('checkIn', toIsoUtc(checkIn));
    sp.set('checkOut', toIsoUtc(checkOut));
    sp.set('stayType', stayType);
    if (maxPrice) sp.set('maxPrice', maxPrice);
    navigate(`/search?${sp.toString()}`);
  };

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[360px] bg-gradient-to-b from-cyan-500/10 via-indigo-500/5 to-transparent" />

      <section className="mx-auto max-w-screen-2xl px-4 pb-8 pt-7 sm:px-6 lg:px-10 lg:pt-10">
        <div className="grid items-stretch gap-6 lg:grid-cols-12">
          <div className="flex flex-col justify-between lg:col-span-7">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              Verified Hostels &amp; PGs across India
            </span>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              Stay anywhere,{' '}
              <span className="bg-gradient-to-r from-cyan-300 to-indigo-400 bg-clip-text text-transparent">
                from 3 hours to 12 months.
              </span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
              “No one should have to give up an opportunity because they couldn’t find accommodation.”
              Book verified beds near your exam center, interview venue, college, or workplace.
            </p>

            <form onSubmit={handleSearch} className="glass-panel spatial-glow mt-5 rounded-2xl p-4 sm:p-5" noValidate>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-12">
                <div className="sm:col-span-2 lg:col-span-4">
                  <div className="flex items-center justify-between gap-2">
                    <label htmlFor="hero-city" className="block whitespace-nowrap text-xs font-medium text-slate-300">City / Area</label>
                    <button
                      type="button"
                      onClick={handleUseMyLocation}
                      disabled={geoLoading}
                      className="inline-flex items-center gap-1 whitespace-nowrap text-[11px] font-medium text-cyan-300 hover:underline disabled:opacity-50"
                    >
                      <Crosshair className="h-3 w-3" />
                      {geoLoading ? 'Locating...' : 'Use my location'}
                    </button>
                  </div>
                  <input
                    id="hero-city"
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value);
                      if (e.target.value.trim()) setCoords(null);
                    }}
                    placeholder={coords ? `Near (${coords.lat}, ${coords.lon})` : 'e.g. Bengaluru'}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/90 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div className="lg:col-span-3">
                  <label htmlFor="hero-checkin" className="block text-xs font-medium text-slate-300">Check-in</label>
                  <input
                    id="hero-checkin"
                    type="datetime-local"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/90 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div className="lg:col-span-3">
                  <label htmlFor="hero-checkout" className="block text-xs font-medium text-slate-300">Check-out</label>
                  <input
                    id="hero-checkout"
                    type="datetime-local"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/90 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div className="lg:col-span-2">
                  <label htmlFor="hero-budget" className="block text-xs font-medium text-slate-300">Max Nightly ₹</label>
                  <input
                    id="hero-budget"
                    type="number"
                    min="0"
                    placeholder="e.g. 800"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/90 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              {(formError || geoError) && (
                <p role="alert" className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                  {formError ?? geoError}
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 sm:flex-nowrap">
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 sm:flex-nowrap">
                  <div className="w-full shrink-0 sm:w-52">
                    <label htmlFor="hero-staytype" className="sr-only">Stay Type</label>
                    <SelectDropdown
                      id="hero-staytype"
                      ariaLabel="Stay Type"
                      value={stayType}
                      onChange={(val) => setStayType(val)}
                      options={[
                        { value: 'SHORT_STAY', label: 'Short Stay (Hours/Days)' },
                        { value: 'LONG_STAY', label: 'Long Stay (Weeks/Months)' },
                      ]}
                    />
                  </div>
                  <p className="min-w-0 truncate text-xs text-slate-300">
                    Searching:{' '}
                    <span className="font-medium text-cyan-300">
                      {city.trim() ? city.trim() : coords ? `GPS (${coords.lat}, ${coords.lon})` : 'Select city or GPS'}
                    </span>{' '}
                    · {formatIST(toIsoUtc(checkIn))} → {formatIST(toIsoUtc(checkOut))}
                  </p>
                </div>
                <button
                  type="submit"
                  className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 hover:opacity-95 sm:w-auto"
                >
                  <Compass className="h-4 w-4" />
                  Search Stays
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-5">
            <div className="glass-panel flex h-full flex-col justify-between rounded-3xl p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1">
                <div className="inline-flex rounded-lg border border-slate-700 bg-slate-900/90 p-0.5 text-xs" role="group" aria-label="3D Preview Mode">
                  <button
                    type="button"
                    onClick={() => setSceneMode('room')}
                    className={`rounded-md px-2.5 py-1 font-semibold transition-colors ${sceneMode === 'room' ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:text-white'}`}
                  >
                    Room &amp; Beds
                  </button>
                  <button
                    type="button"
                    onClick={() => setSceneMode('globe')}
                    className={`rounded-md px-2.5 py-1 font-semibold transition-colors ${sceneMode === 'globe' ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:text-white'}`}
                  >
                    Stay Globe
                  </button>
                </div>

                {sceneMode === 'room' && heroBedSlots.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setRoomListFallback((v) => !v)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-2.5 py-1 text-[11px] text-slate-300 hover:bg-slate-800"
                  >
                    <List className="h-3 w-3" />
                    {roomListFallback ? '3D View' : 'List View'}
                  </button>
                )}
              </div>

              <p className="mb-2 px-1 text-[11px] text-slate-400">
                {sceneMode === 'room'
                  ? firstProperty
                    ? `Previewing rooms & beds at ${firstProperty.name}`
                    : 'Room & Beds: visual preview (no verified backend property loaded yet)'
                  : featuredQuery.data?.content.length
                  ? `Stay Globe: ${featuredQuery.data.content.length} verified property locations — tap a pin`
                  : 'Stay Globe: visual preview (no verified backend coordinates loaded yet)'}
              </p>

              {sceneMode === 'room' && roomListFallback && heroBedSlots.length > 0 ? (
                <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
                  {heroBedSlots.map((slot) => (
                    <button
                      key={slot.bedId}
                      type="button"
                      disabled={slot.status !== 'AVAILABLE'}
                      onClick={() => setSelectedBedId(slot.bedId)}
                      className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-xs ${
                        selectedBedId === slot.bedId
                          ? 'border-cyan-400 bg-cyan-500/20 text-white'
                          : slot.status === 'AVAILABLE'
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                          : 'cursor-not-allowed border-slate-800 text-slate-500'
                      }`}
                    >
                      <span>Room {slot.roomNumber} · {slot.bedNumber}</span>
                      <span>{slot.status === 'AVAILABLE' ? `${formatINR(slot.nightlyRate)}/night` : 'Unavailable'}</span>
                    </button>
                  ))}
                </div>
              ) : !prefersReducedMotion ? (
                <Suspense
                  fallback={
                    <div className="flex h-60 items-center justify-center rounded-2xl bg-slate-900/60 text-sm text-slate-400 sm:h-72">
                      Loading 3D preview...
                    </div>
                  }
                >
                  <SpatialHeroScene
                    mode={sceneMode}
                    bedSlots={heroBedSlots}
                    selectedBedId={selectedBedId}
                    onSelectBed={setSelectedBedId}
                    properties={featuredQuery.data?.content ?? []}
                    selectedPropertyId={selectedGlobeProp?.id ?? null}
                    onSelectProperty={setSelectedGlobeProp}
                  />
                </Suspense>
              ) : (
                <div className="flex h-60 items-center justify-center rounded-2xl bg-slate-900/70 p-6 text-center text-sm text-cyan-200">
                  Reduced motion enabled. Use Search or List View to inspect verified beds and properties.
                </div>
              )}

              {/* Contextual interactive info panel for selected 3D bed or globe property */}
              {sceneMode === 'room' && selectedBedSlot && firstProperty && (
                <div className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-cyan-500/30 bg-slate-900/90 px-3 py-2 text-xs">
                  <div>
                    <p className="font-semibold text-white">
                      Room {selectedBedSlot.roomNumber} · {selectedBedSlot.bedNumber}
                    </p>
                    <p className="text-emerald-300">
                      Available · {formatINR(selectedBedSlot.nightlyRate)}/night
                    </p>
                  </div>
                  <Link
                    to={`/properties/${firstProperty.id}`}
                    className="rounded-lg bg-cyan-600 px-3 py-1.5 font-semibold text-white hover:bg-cyan-500"
                  >
                    Book Bed
                  </Link>
                </div>
              )}

              {sceneMode === 'globe' && selectedGlobeProp && (
                <div className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-cyan-500/30 bg-slate-900/90 px-3 py-2 text-xs">
                  <div>
                    <p className="font-semibold text-white">{selectedGlobeProp.name}</p>
                    <p className="text-slate-300">
                      {selectedGlobeProp.city} · {formatINR(selectedGlobeProp.startingPrice)} · {selectedGlobeProp.availableBedCount} beds
                    </p>
                  </div>
                  <Link
                    to={`/properties/${selectedGlobeProp.id}`}
                    className="rounded-lg bg-cyan-600 px-3 py-1.5 font-semibold text-white hover:bg-cyan-500"
                  >
                    View
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 4 Distinct Mode Entry Points */}
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link to="/emergency" className="glass-panel rounded-2xl p-4 transition hover:-translate-y-0.5 hover:border-amber-400/50">
            <Zap className="h-5 w-5 text-amber-400" />
            <h2 className="mt-2.5 text-base font-semibold text-white">Emergency Tonight</h2>
            <p className="mt-1 text-xs text-slate-400">Prioritizes arrival time, same-day availability, and late-night check-in.</p>
          </Link>
          <Link to="/interview-mode" className="glass-panel rounded-2xl p-4 transition hover:-translate-y-0.5 hover:border-cyan-400/50">
            <Briefcase className="h-5 w-5 text-cyan-400" />
            <h2 className="mt-2.5 text-base font-semibold text-white">Interview Mode</h2>
            <p className="mt-1 text-xs text-slate-400">Search by interview coordinates, date/time, and straight-line distance.</p>
          </Link>
          <Link to="/search?stayType=SHORT_STAY" className="glass-panel rounded-2xl p-4 transition hover:-translate-y-0.5 hover:border-indigo-400/50">
            <Clock className="h-5 w-5 text-indigo-400" />
            <h2 className="mt-2.5 text-base font-semibold text-white">Short Stays</h2>
            <p className="mt-1 text-xs text-slate-400">Hourly (3h+) and overnight beds for exams, transit, and short trips.</p>
          </Link>
          <Link to="/search?stayType=LONG_STAY" className="glass-panel rounded-2xl p-4 transition hover:-translate-y-0.5 hover:border-emerald-400/50">
            <CalendarClock className="h-5 w-5 text-emerald-400" />
            <h2 className="mt-2.5 text-base font-semibold text-white">Monthly PGs</h2>
            <p className="mt-1 text-xs text-slate-400">Monthly pricing, rent schedules, security deposits, and stay extensions.</p>
          </Link>
        </div>

        {/* Verified Properties Preview */}
        <div className="mt-8">
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
              {featuredQuery.data.content.slice(0, 6).map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          ) : (
            <div className="glass-panel mt-4 rounded-2xl p-6 text-sm text-slate-400">
              No approved properties found yet. Property owners can register, create listings with map coordinates, and submit for admin verification.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
