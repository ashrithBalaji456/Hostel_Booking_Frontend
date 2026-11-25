import { lazy, Suspense, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Filter, List, Map as MapIcon, Search } from 'lucide-react';
import { propertyApi } from '../../api/endpoints';
import { PropertyCard } from '../../components/property/PropertyCard';
import { ErrorState } from '../../components/ui/ErrorState';
import { SelectDropdown } from '../../components/ui/SelectDropdown';
import { ApiClientError } from '../../api/client';

const PropertyMap = lazy(() => import('../../components/map/PropertyMap'));

const AMENITIES = ['WIFI', 'AC', 'FOOD', 'WASHING_MACHINE', 'PARKING', 'LOCKER', 'HOT_WATER', 'STUDY_ROOM'];

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const paramsObj = {
    city: searchParams.get('city') ?? '',
    locality: searchParams.get('locality') ?? '',
    pincode: searchParams.get('pincode') ?? '',
    stayType: searchParams.get('stayType') ?? '',
    propertyType: searchParams.get('propertyType') ?? '',
    genderPolicy: searchParams.get('genderPolicy') ?? '',
    minPrice: searchParams.get('minPrice') ?? '',
    maxPrice: searchParams.get('maxPrice') ?? '',
    checkIn: searchParams.get('checkIn') ?? '',
    checkOut: searchParams.get('checkOut') ?? '',
    availableOnly: searchParams.get('availableOnly') === 'true',
    verifiedOnly: searchParams.get('verifiedOnly') !== 'false',
    sortBy: searchParams.get('sortBy') ?? 'price_asc',
    page: Number(searchParams.get('page') ?? 0),
    size: 12,
  };

  const selectedAmenities = searchParams.getAll('amenities');

  const query = useQuery({
    queryKey: ['properties-search', searchParams.toString()],
    queryFn: () =>
      propertyApi.search({
        ...paramsObj,
        amenities: selectedAmenities.length ? selectedAmenities : undefined,
      }),
  });

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.set('page', '0');
    setSearchParams(next);
  };

  const toggleAmenity = (code: string) => {
    const next = new URLSearchParams(searchParams);
    const current = next.getAll('amenities');
    next.delete('amenities');
    if (current.includes(code)) {
      current.filter((a) => a !== code).forEach((a) => next.append('amenities', a));
    } else {
      [...current, code].forEach((a) => next.append('amenities', a));
    }
    next.set('page', '0');
    setSearchParams(next);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {paramsObj.stayType === 'SHORT_STAY'
              ? 'Short Stays (Hourly & Nightly)'
              : paramsObj.stayType === 'LONG_STAY'
              ? 'Monthly PGs & Long-Term Stays'
              : 'Explore Hostels & PGs'}
          </h1>
          <p className="text-sm text-slate-400">
            {paramsObj.stayType === 'SHORT_STAY'
              ? 'Flexible 3-hour to 14-day stays with live half-open interval bed checks.'
              : paramsObj.stayType === 'LONG_STAY'
              ? 'Weekly & monthly PGs with transparent monthly rent schedules and security deposit tracking.'
              : 'Live backend search with verified availability and half-open interval checks.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-xl border border-slate-700 bg-slate-900 p-0.5 text-xs" role="group" aria-label="Results view mode">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium ${viewMode === 'list' ? 'bg-cyan-600 text-white' : 'text-slate-300'}`}
            >
              <List className="h-3.5 w-3.5" /> List
            </button>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium ${viewMode === 'map' ? 'bg-cyan-600 text-white' : 'text-slate-300'}`}
            >
              <MapIcon className="h-3.5 w-3.5" /> Map
            </button>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="sortBy" className="text-xs text-slate-400">Sort by</label>
            <SelectDropdown
              id="sortBy"
              ariaLabel="Sort by"
              value={paramsObj.sortBy}
              onChange={(val) => updateParam('sortBy', val)}
              className="w-48"
              options={[
                { value: 'price_asc', label: 'Price: Low to High' },
                { value: 'price_desc', label: 'Price: High to Low' },
                { value: 'rating', label: 'Top Rated' },
                { value: 'distance', label: 'Distance' },
              ]}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        <aside className="glass-panel h-fit rounded-2xl p-5 lg:col-span-3" aria-label="Search filters">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Filter className="h-4 w-4 text-cyan-400" />
            Filters
          </div>

          <div className="mt-4 space-y-4 text-sm">
            <div>
              <label htmlFor="f-city" className="block text-xs text-slate-400">City</label>
              <input id="f-city" value={paramsObj.city} onChange={(e) => updateParam('city', e.target.value)} placeholder="Bengaluru" className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white" />
            </div>
            <div>
              <label htmlFor="f-locality" className="block text-xs text-slate-400">Locality / Area</label>
              <input id="f-locality" value={paramsObj.locality} onChange={(e) => updateParam('locality', e.target.value)} placeholder="Indiranagar" className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white" />
            </div>
            <div>
              <label htmlFor="f-pincode" className="block text-xs text-slate-400">Pincode</label>
              <input id="f-pincode" value={paramsObj.pincode} onChange={(e) => updateParam('pincode', e.target.value)} placeholder="560038" className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white" />
            </div>
            <div>
              <label htmlFor="f-stay" className="block text-xs text-slate-400">Stay Type</label>
              <SelectDropdown
                id="f-stay"
                ariaLabel="Stay Type"
                value={paramsObj.stayType}
                onChange={(val) => updateParam('stayType', val)}
                className="mt-1"
                options={[
                  { value: '', label: 'Any Stay Type' },
                  { value: 'SHORT_STAY', label: 'Short Stay' },
                  { value: 'LONG_STAY', label: 'Long Stay' },
                ]}
              />
            </div>
            <div>
              <label htmlFor="f-ptype" className="block text-xs text-slate-400">Property Type</label>
              <SelectDropdown
                id="f-ptype"
                ariaLabel="Property Type"
                value={paramsObj.propertyType}
                onChange={(val) => updateParam('propertyType', val)}
                className="mt-1"
                options={[
                  { value: '', label: 'All Types' },
                  { value: 'HOSTEL', label: 'Hostel' },
                  { value: 'PG', label: 'PG' },
                  { value: 'DORMITORY', label: 'Dormitory' },
                  { value: 'CO_LIVING', label: 'Co-Living' },
                ]}
              />
            </div>
            <div>
              <label htmlFor="f-gender" className="block text-xs text-slate-400">Gender Policy</label>
              <SelectDropdown
                id="f-gender"
                ariaLabel="Gender Policy"
                value={paramsObj.genderPolicy}
                onChange={(val) => updateParam('genderPolicy', val)}
                className="mt-1"
                options={[
                  { value: '', label: 'Any Policy' },
                  { value: 'MALE_ONLY', label: 'Male Only' },
                  { value: 'FEMALE_ONLY', label: 'Female Only' },
                  { value: 'CO_ED', label: 'Co-Ed' },
                ]}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="f-min" className="block text-xs text-slate-400">Min ₹</label>
                <input id="f-min" type="number" value={paramsObj.minPrice} onChange={(e) => updateParam('minPrice', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-2 text-white" />
              </div>
              <div>
                <label htmlFor="f-max" className="block text-xs text-slate-400">Max ₹</label>
                <input id="f-max" type="number" value={paramsObj.maxPrice} onChange={(e) => updateParam('maxPrice', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-2 text-white" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={paramsObj.availableOnly}
                onChange={(e) => updateParam('availableOnly', e.target.checked ? 'true' : '')}
              />
              Available beds only
            </label>
            <div>
              <p className="text-xs text-slate-400">Amenities</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {AMENITIES.map((code) => {
                  const active = selectedAmenities.includes(code);
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => toggleAmenity(code)}
                      className={`rounded-lg border px-2 py-1 text-xs ${
                        active ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200' : 'border-slate-700 text-slate-300'
                      }`}
                    >
                      {code.replace('_', ' ')}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>

        <section className="lg:col-span-9">
          {query.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="glass-panel h-72 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : query.isError ? (
            <ErrorState
              message={query.error instanceof ApiClientError ? query.error.message : 'Failed to load properties'}
              onRetry={() => void query.refetch()}
            />
          ) : query.data && query.data.content.length > 0 ? (
            <>
              <p className="mb-4 text-xs text-slate-400">
                Showing {query.data.content.length} of {query.data.totalElements} properties
              </p>
              {viewMode === 'map' ? (
                <Suspense fallback={<div className="glass-panel h-[420px] animate-pulse rounded-2xl" />}>
                  <PropertyMap
                    markers={query.data.content
                      .filter((p) => p.latitude != null && p.longitude != null)
                      .map((p) => ({
                        id: p.id,
                        name: p.name,
                        address: [p.locality, p.city].filter(Boolean).join(', '),
                        latitude: p.latitude!,
                        longitude: p.longitude!,
                        startingPrice: p.startingPrice,
                        availableBedCount: p.availableBedCount,
                        distanceKm: p.distanceKm,
                      }))}
                  />
                </Suspense>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {query.data.content.map((p) => (
                    <PropertyCard key={p.id} property={p} />
                  ))}
                </div>
              )}
              {query.data.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    disabled={paramsObj.page <= 0}
                    onClick={() => updateParam('page', String(paramsObj.page - 1))}
                    className="rounded-xl border border-slate-700 px-4 py-2 text-sm disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-slate-400">
                    Page {query.data.page + 1} of {query.data.totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={query.data.page + 1 >= query.data.totalPages}
                    onClick={() => updateParam('page', String(paramsObj.page + 1))}
                    className="rounded-xl border border-slate-700 px-4 py-2 text-sm disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="glass-panel rounded-2xl p-10 text-center">
              <Search className="mx-auto h-8 w-8 text-slate-500" />
              <h2 className="mt-3 text-base font-semibold text-white">No matching stays found</h2>
              <p className="mt-1 text-sm text-slate-400">Try broadening your city, budget, or date filters.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
