import { lazy, Suspense, useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  Car,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  Flame,
  Heart,
  Images,
  Lock,
  MapPin,
  Navigation,
  ShieldCheck,
  Shirt,
  Sparkles,
  Star,
  Utensils,
  Wifi,
  Wind,
} from 'lucide-react';
import { propertyApi, userApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { InteractiveBedSelector } from '../../components/property/InteractiveBedSelector';
import { PriceCalculatorCard } from '../../components/property/PriceCalculatorCard';
import { PropertyGalleryModal } from '../../components/property/PropertyGalleryModal';
import { ErrorState } from '../../components/ui/ErrorState';
import { SelectDropdown } from '../../components/ui/SelectDropdown';
import { DateTimePicker } from '../../components/ui/DateTimePicker';
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
  const [selectedBeds, setSelectedBeds] = useState<AvailableBedInfo[]>([]);
  const [appliedCouponCode, setAppliedCouponCode] = useState('');
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);

  const detailsQuery = useQuery({
    queryKey: ['property-detail', propertyId],
    queryFn: () => propertyApi.getDetails(propertyId),
    enabled: Boolean(propertyId),
  });

  const imagesCount = detailsQuery.data?.images?.length ?? 0;

  useEffect(() => {
    setActiveImageIdx(0);
  }, [propertyId]);

  useEffect(() => {
    if (imagesCount <= 1 || carouselPaused) return;
    const timer = window.setInterval(() => {
      setActiveImageIdx((prev) => (prev + 1) % imagesCount);
    }, 3500);
    return () => window.clearInterval(timer);
  }, [imagesCount, carouselPaused]);

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

  const handleToggleBed = (bed: AvailableBedInfo) => {
    setSelectedBeds((prev) =>
      prev.some((b) => b.bedId === bed.bedId) ? prev.filter((b) => b.bedId !== bed.bedId) : [...prev, bed],
    );
  };

  const handleProceedToCheckout = async () => {
    if (selectedBeds.length === 0) {
      pushToast('Please select at least one available bed first', 'info');
      return;
    }
    // Revalidate availability for all selected beds before navigating to checkout
    const fresh = await availabilityQuery.refetch();
    const availIds = new Set(fresh.data?.availableBeds.map((b) => b.bedId) ?? []);
    const unavailable = selectedBeds.filter((b) => !availIds.has(b.bedId));
    if (unavailable.length > 0) {
      pushToast('One or more selected beds were just booked or held. Please review your selection.', 'error');
      setSelectedBeds((prev) => prev.filter((b) => availIds.has(b.bedId)));
      return;
    }
    const firstBed = selectedBeds[0];
    const qs = new URLSearchParams({
      propertyId: p.id,
      bedId: firstBed.bedId,
      bedIds: selectedBeds.map((b) => b.bedId).join(','),
      bedLabels: selectedBeds.map((b) => `Room ${b.roomNumber} · ${b.bedNumber}`).join(','),
      bedNumber: selectedBeds.map((b) => b.bedNumber).join(', '),
      roomNumber: Array.from(new Set(selectedBeds.map((b) => b.roomNumber))).join(', '),
      propertyName: p.name,
      checkIn: toIsoUtc(checkIn),
      checkOut: toIsoUtc(checkOut),
      stayType,
      instantBooking: String(p.instantBookingEnabled),
      ...(appliedCouponCode ? { couponCode: appliedCouponCode } : {}),
    });
    navigate(`/checkout?${qs.toString()}`);
  };

  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-10">
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

          <div className="flex flex-wrap items-center gap-3">
            {p.latitude != null && p.longitude != null && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${p.latitude},${p.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3.5 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/25"
              >
                <Navigation className="h-4 w-4" /> Directions
              </a>
            )}
            {p.images.length > 0 && (
              <button
                type="button"
                onClick={() => setGalleryOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-3.5 py-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/25"
              >
                <Images className="h-4 w-4" /> Gallery ({p.images.length})
              </button>
            )}
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
          <div
            className="relative mt-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950"
            onMouseEnter={() => setCarouselPaused(true)}
            onMouseLeave={() => setCarouselPaused(false)}
          >
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${activeImageIdx * 100}%)` }}
            >
              {p.images.map((img) => (
                <div key={img.id} className="relative h-64 w-full shrink-0 sm:h-80">
                  <img
                    src={img.imageUrl}
                    alt={`${p.name} - ${img.imageType}`}
                    loading="lazy"
                    className="h-full w-full cursor-pointer object-contain bg-slate-950"
                    onClick={() => setGalleryOpen(true)}
                  />
                  <span className="absolute left-3 top-3 rounded-full border border-white/15 bg-slate-950/75 px-3 py-1 text-[11px] font-medium text-cyan-200 backdrop-blur-md">
                    {img.imageType.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>

            {p.images.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous photo"
                  onClick={() => setActiveImageIdx((prev) => (prev - 1 + p.images.length) % p.images.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-slate-950/75 p-2 text-white backdrop-blur-md hover:border-cyan-400/50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Next photo"
                  onClick={() => setActiveImageIdx((prev) => (prev + 1) % p.images.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-slate-950/75 p-2 text-white backdrop-blur-md hover:border-cyan-400/50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/15 bg-slate-950/75 px-3 py-1.5 backdrop-blur-md">
                  {p.images.map((img, idx) => (
                    <button
                      key={img.id}
                      type="button"
                      aria-label={`View photo ${idx + 1}`}
                      onClick={() => setActiveImageIdx(idx)}
                      className={`h-2 rounded-full transition-all ${
                        idx === activeImageIdx ? 'w-5 bg-cyan-400' : 'w-2 bg-slate-500 hover:bg-slate-300'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
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
          <div className="mt-6 rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-slate-900/90 to-slate-950/90 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                Facilities &amp; Amenities
              </h2>
              <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-medium text-cyan-200">
                {p.amenities.length} included
              </span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {p.amenities.map((a) => {
                const key = a.toUpperCase();
                const Icon =
                  key === 'WIFI'
                    ? Wifi
                    : key === 'AC'
                    ? Wind
                    : key === 'FOOD'
                    ? Utensils
                    : key === 'WASHING_MACHINE' || key === 'LAUNDRY'
                    ? Shirt
                    : key === 'PARKING'
                    ? Car
                    : key === 'LOCKER'
                    ? Lock
                    : key === 'HOT_WATER'
                    ? Flame
                    : key === 'STUDY_ROOM'
                    ? BookOpen
                    : CheckCircle2;
                const label =
                  key === 'WIFI'
                    ? 'Wi-Fi'
                    : key === 'AC'
                    ? 'AC'
                    : key === 'FOOD'
                    ? 'Food / Meals'
                    : a
                        .replace(/_/g, ' ')
                        .toLowerCase()
                        .replace(/\b\w/g, (ch) => ch.toUpperCase());

                return (
                  <span
                    key={a}
                    className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/35 bg-cyan-500/10 px-3.5 py-2 text-xs font-semibold text-cyan-100 shadow-sm"
                  >
                    <Icon className="h-3.5 w-3.5 text-cyan-300" />
                    {label}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {galleryOpen && p.images.length > 0 && (
        <PropertyGalleryModal
          propertyName={p.name}
          images={p.images}
          onClose={() => setGalleryOpen(false)}
        />
      )}

      {/* Stay window + Interactive Bed Selector */}
      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <div className="glass-panel rounded-2xl p-5">
            <h2 className="text-base font-semibold text-white">Choose Stay Window</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="pd-in" className="block text-xs text-slate-400">Check-in</label>
                <DateTimePicker id="pd-in" ariaLabel="Check-in" value={checkIn} onChange={(val) => { setCheckIn(val); setSelectedBeds([]); }} className="mt-1" />
              </div>
              <div>
                <label htmlFor="pd-out" className="block text-xs text-slate-400">Check-out</label>
                <DateTimePicker id="pd-out" ariaLabel="Check-out" value={checkOut} onChange={(val) => { setCheckOut(val); setSelectedBeds([]); }} className="mt-1" />
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
            selectedBedIds={selectedBeds.map((b) => b.bedId)}
            isLoadingAvailability={availabilityQuery.isFetching}
            onRefreshAvailability={() => void availabilityQuery.refetch()}
            onSelectBed={handleToggleBed}
          />
        </div>

        <aside className="glass-panel h-fit rounded-2xl p-5 lg:col-span-4">
          <h2 className="text-lg font-semibold text-white">Reservation Summary</h2>
          <p className="mt-1 text-xs text-slate-400">
            Final price including taxes, discounts, and deposits is calculated authoritatively by the backend on booking creation.
          </p>

          <div className="mt-4 space-y-2 rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm">
            <div className="flex items-start justify-between gap-2">
              <span className="text-slate-400">
                Selected Bed{selectedBeds.length > 1 ? `s (${selectedBeds.length})` : ''}
              </span>
              {selectedBeds.length === 0 ? (
                <span className="font-medium text-white">None selected</span>
              ) : (
                <div className="flex flex-wrap justify-end gap-1">
                  {selectedBeds.map((b) => (
                    <span
                      key={b.bedId}
                      className="rounded-md border border-cyan-500/40 bg-cyan-500/15 px-2 py-0.5 text-xs font-medium text-cyan-200"
                    >
                      {b.bedNumber}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Stay Type</span>
              <span className="font-medium text-white">{stayType.replace('_', ' ')}</span>
            </div>
            {selectedBeds[0]?.nightlyRate != null && (
              <div className="flex justify-between">
                <span className="text-slate-400">Nightly Rate (per bed)</span>
                <span className="font-medium text-cyan-300">{formatINR(selectedBeds[0].nightlyRate)}</span>
              </div>
            )}
          </div>

          <PriceCalculatorCard
            propertyId={p.id}
            pricing={p.pricing}
            bedCount={Math.max(1, selectedBeds.length)}
            hourlyRateOverride={selectedBeds[0]?.hourlyRate}
            nightlyRateOverride={selectedBeds[0]?.nightlyRate}
            checkIn={checkIn}
            checkOut={checkOut}
            stayType={stayType}
            minShortStayHours={p.minShortStayHours}
            maxShortStayDays={p.maxShortStayDays}
            minLongStayDays={p.minLongStayDays}
            maxLongStayMonths={p.maxLongStayMonths}
            appliedCouponCode={appliedCouponCode}
            onCouponApplied={setAppliedCouponCode}
            onChangeDuration={(nextOut, nextType) => {
              setCheckOut(nextOut);
              setStayType(nextType);
              setSelectedBeds([]);
            }}
          />

          <button
            type="button"
            disabled={selectedBeds.length === 0}
            onClick={() => void handleProceedToCheckout()}
            className="mt-5 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isAuthenticated
              ? `Continue to Booking (${selectedBeds.length || 1} Bed${selectedBeds.length > 1 ? 's' : ''})`
              : 'Sign in to Book'}
          </button>
        </aside>
      </div>

      {/* Location Map */}
      {p.latitude != null && p.longitude != null && (
        <section className="glass-panel mt-6 rounded-2xl p-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-white">Location</h2>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${p.latitude},${p.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3.5 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/25"
            >
              <Navigation className="h-3.5 w-3.5" /> Open Directions in Google Maps
            </a>
          </div>
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
