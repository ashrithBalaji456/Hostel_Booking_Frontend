import { lazy, Suspense, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart, MapPin, ShieldCheck, Star, Clock, Flag } from 'lucide-react';
import { propertyApi, userApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { InteractiveBedSelector } from '../../components/property/InteractiveBedSelector';
import { ErrorState } from '../../components/ui/ErrorState';
import { SelectDropdown } from '../../components/ui/SelectDropdown';
import { defaultCheckInLocal, defaultCheckOutLocal, formatINR, toIsoUtc } from '../../utils/format';
import type { AvailableBedInfo, StayType } from '../../types/api';

const PropertyMap = lazy(() => import('../../components/map/PropertyMap'));

export function PropertyDetailPage() {
  const { propertyId = '' } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();

  const [checkIn, setCheckIn] = useState(
    searchParams.get('checkIn') ? searchParams.get('checkIn')!.slice(0, 16) : defaultCheckInLocal(),
  );
  const [checkOut, setCheckOut] = useState(
    searchParams.get('checkOut') ? searchParams.get('checkOut')!.slice(0, 16) : defaultCheckOutLocal(24),
  );
  const [stayType, setStayType] = useState<StayType>('SHORT_STAY');
  const [selectedBed, setSelectedBed] = useState<AvailableBedInfo | null>(null);

  const detailsQuery = useQuery({
    queryKey: ['property-detail', propertyId],
    queryFn: () => propertyApi.getDetails(propertyId),
    enabled: Boolean(propertyId),
  });

  const availabilityQuery = useQuery({
    queryKey: ['property-availability', propertyId, checkIn, checkOut],
    queryFn: () => propertyApi.getAvailability(propertyId, toIsoUtc(checkIn), toIsoUtc(checkOut)),
    enabled: Boolean(propertyId && checkIn && checkOut),
  });

  const reviewsQuery = useQuery({
    queryKey: ['property-reviews', propertyId],
    queryFn: () => propertyApi.getReviews(propertyId),
    enabled: Boolean(propertyId),
  });

  const favMutation = useMutation({
    mutationFn: () => userApi.addFavorite(propertyId),
    onSuccess: () => {
      pushToast('Saved to favorites', 'success');
      void queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
    onError: (err: Error) => pushToast(err.message, 'error'),
  });

  if (detailsQuery.isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="glass-panel h-96 animate-pulse rounded-3xl" />
      </div>
    );
  }

  if (detailsQuery.isError || !detailsQuery.data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <ErrorState message={(detailsQuery.error as Error)?.message ?? 'Property not found'} onRetry={() => void detailsQuery.refetch()} />
      </div>
    );
  }

  const p = detailsQuery.data;

  const handleProceedToCheckout = async () => {
    if (!selectedBed) {
      pushToast('Please select an available bed first', 'info');
      return;
    }
    // Revalidate availability before navigating to checkout
    const fresh = await availabilityQuery.refetch();
    const stillAvailable = fresh.data?.availableBeds.some((b) => b.bedId === selectedBed.bedId);
    if (!stillAvailable) {
      pushToast('That bed was just booked or held. Please choose another bed.', 'error');
      setSelectedBed(null);
      return;
    }
    const qs = new URLSearchParams({
      propertyId: p.id,
      bedId: selectedBed.bedId,
      bedNumber: selectedBed.bedNumber,
      roomNumber: selectedBed.roomNumber,
      propertyName: p.name,
      checkIn: toIsoUtc(checkIn),
      checkOut: toIsoUtc(checkOut),
      stayType,
      instantBooking: String(p.instantBookingEnabled),
    });
    navigate(`/checkout?${qs.toString()}`);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="glass-panel rounded-3xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-cyan-500/15 px-3 py-0.5 text-xs font-semibold text-cyan-300">
                {p.propertyType.replace('_', ' ')}
              </span>
              <span className="rounded-full bg-slate-800 px-3 py-0.5 text-xs text-slate-300">
                {p.genderPolicy.replace('_', ' ')}
              </span>
              {p.verificationStatus === 'APPROVED' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-0.5 text-xs font-medium text-emerald-300">
                  <ShieldCheck className="h-3.5 w-3.5" /> Admin Verified
                </span>
              )}
            </div>
            <h1 className="mt-3 text-2xl font-bold text-white sm:text-3xl">{p.name}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-300">
              <MapPin className="h-4 w-4 text-cyan-400" />
              {p.address}, {p.locality ? `${p.locality}, ` : ''}{p.city}, {p.state} - {p.pincode}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {p.averageRating != null && (
              <div className="flex items-center gap-1.5 rounded-xl bg-amber-500/15 px-3 py-2 text-sm font-semibold text-amber-300">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                {p.averageRating.toFixed(1)} ({p.reviewCount})
              </div>
            )}
            {isAuthenticated && (
              <>
                <button
                  type="button"
                  onClick={() => favMutation.mutate()}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 px-3.5 py-2 text-xs font-medium text-slate-200 hover:border-rose-400/50 hover:text-rose-300"
                >
                  <Heart className="h-4 w-4" /> Save
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/account/safety?propertyId=${p.id}`)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-amber-300"
                >
                  <Flag className="h-4 w-4" /> Report Issue
                </button>
              </>
            )}
          </div>
        </div>

        {p.images.length > 0 && (
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {p.images.slice(0, 3).map((img) => (
              <img
                key={img.id}
                src={img.imageUrl}
                alt={`${p.name} - ${img.imageType}`}
                loading="lazy"
                className="h-48 w-full rounded-2xl object-cover"
              />
            ))}
          </div>
        )}

        {p.description && <p className="mt-5 text-sm leading-relaxed text-slate-300">{p.description}</p>}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs text-slate-400">Check-in / Check-out</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-white">
              <Clock className="h-4 w-4 text-cyan-400" /> {p.checkInTime} / {p.checkOutTime}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs text-slate-400">Nightly / Hourly</p>
            <p className="mt-1 text-sm font-semibold text-white">
              {formatINR(p.pricing?.nightlyRate)} / night
              {p.pricing?.hourlyRate ? ` · ${formatINR(p.pricing.hourlyRate)}/hr` : ''}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs text-slate-400">Monthly / Security Deposit</p>
            <p className="mt-1 text-sm font-semibold text-white">
              {p.pricing?.monthlyRate ? `${formatINR(p.pricing.monthlyRate)}/mo` : 'N/A'} · Deposit {formatINR(p.pricing?.securityDeposit)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs text-slate-400">Booking Policy</p>
            <p className="mt-1 text-sm font-semibold text-white">
              {p.instantBookingEnabled ? 'Instant Booking' : 'Owner Approval Required'}
            </p>
          </div>
        </div>

        {p.amenities.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {p.amenities.map((a) => (
              <span key={a} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-200">
                {a.replace('_', ' ')}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Stay window + Interactive Bed Selector */}
      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <div className="glass-panel rounded-2xl p-5">
            <h2 className="text-base font-semibold text-white">Choose Stay Window</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="pd-in" className="block text-xs text-slate-400">Check-in</label>
                <input id="pd-in" type="datetime-local" value={checkIn} onChange={(e) => { setCheckIn(e.target.value); setSelectedBed(null); }} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label htmlFor="pd-out" className="block text-xs text-slate-400">Check-out</label>
                <input id="pd-out" type="datetime-local" value={checkOut} onChange={(e) => { setCheckOut(e.target.value); setSelectedBed(null); }} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label htmlFor="pd-stay" className="block text-xs text-slate-400">Stay Type</label>
                <SelectDropdown
                  id="pd-stay"
                  ariaLabel="Stay Type"
                  value={stayType}
                  onChange={(val) => setStayType(val)}
                  className="mt-1"
                  options={[
                    { value: 'SHORT_STAY', label: `Short Stay (Min ${p.minShortStayHours}h, Max ${p.maxShortStayDays}d)` },
                    { value: 'LONG_STAY', label: `Long Stay (Min ${p.minLongStayDays}d, Max ${p.maxLongStayMonths}mo)` },
                  ]}
                />
              </div>
            </div>
          </div>

          <InteractiveBedSelector
            rooms={p.rooms}
            availability={availabilityQuery.data}
            selectedBedId={selectedBed?.bedId ?? null}
            isLoadingAvailability={availabilityQuery.isFetching}
            onRefreshAvailability={() => void availabilityQuery.refetch()}
            onSelectBed={setSelectedBed}
          />
        </div>

        <aside className="glass-panel h-fit rounded-2xl p-5 lg:col-span-4">
          <h2 className="text-lg font-semibold text-white">Reservation Summary</h2>
          <p className="mt-1 text-xs text-slate-400">
            Final price including taxes, discounts, and deposits is calculated authoritatively by the backend on booking creation.
          </p>

          <div className="mt-4 space-y-2 rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Selected Bed</span>
              <span className="font-medium text-white">
                {selectedBed ? `Room ${selectedBed.roomNumber} · ${selectedBed.bedNumber}` : 'None selected'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Stay Type</span>
              <span className="font-medium text-white">{stayType.replace('_', ' ')}</span>
            </div>
            {selectedBed?.nightlyRate != null && (
              <div className="flex justify-between">
                <span className="text-slate-400">Nightly Rate</span>
                <span className="font-medium text-cyan-300">{formatINR(selectedBed.nightlyRate)}</span>
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={!selectedBed}
            onClick={() => void handleProceedToCheckout()}
            className="mt-5 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isAuthenticated ? 'Continue to Booking & Payment' : 'Sign in to Book'}
          </button>
        </aside>
      </div>

      {/* Location Map */}
      {p.latitude != null && p.longitude != null && (
        <section className="glass-panel mt-6 rounded-2xl p-6">
          <h2 className="mb-3 text-lg font-semibold text-white">Location</h2>
          <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-slate-900" />}>
            <PropertyMap
              heightClass="h-64"
              markers={[
                {
                  id: p.id,
                  name: p.name,
                  address: `${p.address}, ${p.city}`,
                  latitude: p.latitude,
                  longitude: p.longitude,
                  startingPrice: p.pricing?.nightlyRate,
                },
              ]}
            />
          </Suspense>
        </section>
      )}

      {/* Reviews */}
      <section className="glass-panel mt-8 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white">Guest Reviews</h2>
        {reviewsQuery.data?.content.length ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {reviewsQuery.data.content.map((rev) => (
              <div key={rev.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">{rev.reviewerName}</span>
                  <span className="text-xs font-semibold text-amber-300">★ {rev.rating}/5</span>
                </div>
                {rev.comment && <p className="mt-2 text-sm text-slate-300">{rev.comment}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-400">No reviews yet for this property.</p>
        )}
      </section>
    </div>
  );
}
