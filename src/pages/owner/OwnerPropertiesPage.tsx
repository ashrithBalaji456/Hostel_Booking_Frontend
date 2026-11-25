import { lazy, Suspense, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Crosshair, MapPin, Pencil, Search, Trash2 } from 'lucide-react';
import { ownerApi, propertyApi } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';
import { resolveCurrentLocation, reverseGeocode } from '../../utils/geolocation';
import { SelectDropdown } from '../../components/ui/SelectDropdown';
import type { GenderPolicy, PropertyDetailResponse, PropertyType, RoomType } from '../../types/api';

const LocationPickerMap = lazy(() => import('../../components/map/LocationPickerMap'));

interface GeocodingSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

const DRAFT_KEY = 'spatial_stay_owner_property_draft';

interface PropertyDraft {
  formMode: 'create' | 'edit';
  editPropertyId: string;
  targetPropertyId: string;
  createdProp: PropertyDetailResponse | null;
  name: string;
  propertyType: PropertyType;
  genderPolicy: GenderPolicy;
  address: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  latitude: string;
  longitude: string;
  hourlyRate: string;
  nightlyRate: string;
  monthlyRate: string;
  securityDeposit: string;
  accuracyMeters: number | null;
  locationConfirmed: boolean;
}

function readDraft(): Partial<PropertyDraft> {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Partial<PropertyDraft>) : {};
  } catch {
    return {};
  }
}

export function OwnerPropertiesPage() {
  const { pushToast } = useToast();
  const qc = useQueryClient();
  const initialDraft = readDraft();
  const myPropertiesQuery = useQuery({
    queryKey: ['owner-properties'],
    queryFn: ownerApi.listProperties,
    retry: false,
  });
  const [formMode, setFormMode] = useState<'create' | 'edit'>(initialDraft.formMode ?? 'create');
  const [editPropertyId, setEditPropertyId] = useState(initialDraft.editPropertyId ?? '');
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [createdProp, setCreatedProp] = useState<PropertyDetailResponse | null>(initialDraft.createdProp ?? null);
  const [targetPropertyId, setTargetPropertyId] = useState(initialDraft.targetPropertyId ?? '');

  // Property fields
  const [name, setName] = useState(initialDraft.name ?? '');
  const [propertyType, setPropertyType] = useState<PropertyType>(initialDraft.propertyType ?? 'HOSTEL');
  const [genderPolicy, setGenderPolicy] = useState<GenderPolicy>(initialDraft.genderPolicy ?? 'CO_ED');
  const [address, setAddress] = useState(initialDraft.address ?? '');
  const [locality, setLocality] = useState(initialDraft.locality ?? '');
  const [city, setCity] = useState(initialDraft.city ?? 'Bengaluru');
  const [state, setState] = useState(initialDraft.state ?? 'Karnataka');
  const [pincode, setPincode] = useState(initialDraft.pincode ?? '560038');
  const [latitude, setLatitude] = useState(initialDraft.latitude ?? '12.9716');
  const [longitude, setLongitude] = useState(initialDraft.longitude ?? '77.5946');
  const [hourlyRate, setHourlyRate] = useState(initialDraft.hourlyRate ?? '120');
  const [nightlyRate, setNightlyRate] = useState(initialDraft.nightlyRate ?? '500');
  const [monthlyRate, setMonthlyRate] = useState(initialDraft.monthlyRate ?? '9000');
  const [securityDeposit, setSecurityDeposit] = useState(initialDraft.securityDeposit ?? '2000');

  // Location capture & explicit confirmation state
  const [accuracyMeters, setAccuracyMeters] = useState<number | null>(initialDraft.accuracyMeters ?? null);
  const [locationConfirmed, setLocationConfirmed] = useState(initialDraft.locationConfirmed ?? false);
  const [showUnlockConfirm, setShowUnlockConfirm] = useState(false);

  useEffect(() => {
    try {
      const draft: PropertyDraft = {
        formMode,
        editPropertyId,
        targetPropertyId,
        createdProp,
        name,
        propertyType,
        genderPolicy,
        address,
        locality,
        city,
        state,
        pincode,
        latitude,
        longitude,
        hourlyRate,
        nightlyRate,
        monthlyRate,
        securityDeposit,
        accuracyMeters,
        locationConfirmed,
      };
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // Ignore storage quota errors
    }
  }, [
    formMode,
    editPropertyId,
    targetPropertyId,
    createdProp,
    name,
    propertyType,
    genderPolicy,
    address,
    locality,
    city,
    state,
    pincode,
    latitude,
    longitude,
    hourlyRate,
    nightlyRate,
    monthlyRate,
    securityDeposit,
    accuracyMeters,
    locationConfirmed,
  ]);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geocodeQuery, setGeocodeQuery] = useState('');
  const [geocodeResults, setGeocodeResults] = useState<GeocodingSuggestion[]>([]);
  const [geocodingLoading, setGeocodingLoading] = useState(false);

  // Room fields
  const [roomNumber, setRoomNumber] = useState('101');
  const [roomType, setRoomType] = useState<RoomType>('DOUBLE');
  const [capacity, setCapacity] = useState('2');

  const handleLoadPropertyForEdit = async () => {
    if (!editPropertyId.trim()) return;
    setLoadingExisting(true);
    try {
      const p = await propertyApi.getDetails(editPropertyId.trim());
      setName(p.name);
      setPropertyType(p.propertyType);
      setGenderPolicy(p.genderPolicy);
      setAddress(p.address);
      setLocality(p.locality ?? '');
      setCity(p.city);
      setState(p.state);
      setPincode(p.pincode);
      if (p.latitude != null) setLatitude(String(p.latitude));
      if (p.longitude != null) setLongitude(String(p.longitude));
      if (p.pricing) {
        setHourlyRate(p.pricing.hourlyRate != null ? String(p.pricing.hourlyRate) : '');
        setNightlyRate(String(p.pricing.nightlyRate));
        setMonthlyRate(p.pricing.monthlyRate != null ? String(p.pricing.monthlyRate) : '');
        setSecurityDeposit(String(p.pricing.securityDeposit ?? 0));
      }
      setAccuracyMeters(null);
      setLocationConfirmed(true);
      setTargetPropertyId(p.id);
      pushToast('Loaded existing property details', 'info');
    } catch (err) {
      pushToast((err as Error).message || 'Unable to load property', 'error');
    } finally {
      setLoadingExisting(false);
    }
  };

  const fillAddressFromCoords = async (lat: number, lon: number, overwrite = false) => {
    const rev = await reverseGeocode(lat, lon);
    if (!rev) return;
    if (rev.address && (overwrite || !address.trim())) setAddress(rev.address);
    if (rev.locality && (overwrite || !locality.trim())) setLocality(rev.locality);
    if (rev.city && (overwrite || !city.trim())) setCity(rev.city);
    if (rev.state && (overwrite || !state.trim())) setState(rev.state);
    if (rev.pincode && (overwrite || !pincode.trim())) setPincode(rev.pincode);
  };

  const handleUseCurrentLocation = async () => {
    setGeoError(null);
    setGeoLoading(true);
    try {
      const loc = await resolveCurrentLocation(true);
      setLatitude(String(Number(loc.latitude.toFixed(6))));
      setLongitude(String(Number(loc.longitude.toFixed(6))));
      setAccuracyMeters(loc.accuracyMeters);
      setLocationConfirmed(false);
      void fillAddressFromCoords(loc.latitude, loc.longitude, true);
      if (loc.source === 'ip') {
        pushToast(
          `GPS unavailable — centered map near ${loc.city || 'your network location'} and auto-filled address. Please adjust the exact pin and confirm.`,
          'info',
        );
      } else {
        pushToast('Location captured and address auto-filled. Please review the map pin and confirm before saving.', 'info');
      }
    } catch (err) {
      if ((err as Error).message === 'PERMISSION_DENIED') {
        setGeoError('Location permission was denied. Use address search below or drag/click the map pin manually.');
      } else {
        setGeoError('Unable to determine current location. Use address search below or place the pin manually.');
      }
    } finally {
      setGeoLoading(false);
    }
  };

  const handleGeocodeSearch = async () => {
    const q = geocodeQuery.trim() || [address, locality, city, state, pincode].filter(Boolean).join(', ');
    if (!q) return;
    setGeocodingLoading(true);
    setGeoError(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=3&q=${encodeURIComponent(q)}`,
      );
      if (!res.ok) throw new Error('Geocoding service unavailable');
      const data = (await res.json()) as GeocodingSuggestion[];
      setGeocodeResults(data);
      if (data.length === 0) {
        setGeoError('No matching address coordinates found. Try adjusting your query or placing the pin manually.');
      }
    } catch {
      setGeoError('Address geocoding request failed. Place the map pin manually or enter coordinates.');
    } finally {
      setGeocodingLoading(false);
    }
  };

  const handlePinMoved = (lat: number, lng: number) => {
    setLatitude(String(lat));
    setLongitude(String(lng));
    setAccuracyMeters(null);
    setLocationConfirmed(false);
    void fillAddressFromCoords(lat, lng, false);
  };

  const savePropertyMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name,
        propertyType,
        address,
        locality,
        city,
        state,
        pincode,
        latitude: Number(latitude),
        longitude: Number(longitude),
        genderPolicy,
        instantBookingEnabled: true,
        amenityCodes: ['WIFI', 'LOCKER'],
        pricing: {
          hourlyRate: hourlyRate ? Number(hourlyRate) : undefined,
          nightlyRate: Number(nightlyRate),
          monthlyRate: monthlyRate ? Number(monthlyRate) : undefined,
          securityDeposit: Number(securityDeposit || 0),
          extraCharges: 0,
          discountPercentage: 0,
        },
      };
      return formMode === 'edit' && editPropertyId.trim()
        ? ownerApi.updateProperty(editPropertyId.trim(), payload)
        : ownerApi.createProperty(payload);
    },
    onSuccess: (res) => {
      const wasCreate = formMode === 'create';
      setCreatedProp(res);
      setTargetPropertyId(res.id);
      setFormMode('edit');
      setEditPropertyId(res.id);
      void qc.invalidateQueries({ queryKey: ['owner-properties'] });
      void qc.invalidateQueries({ queryKey: ['owner-dashboard'] });
      pushToast(
        wasCreate
          ? `Property created (${res.id}) — pending admin verification`
          : `Property updated (${res.id})`,
        'success',
      );
    },
    onError: (e: Error) => pushToast(e.message, 'error'),
  });

  const deletePropertyMutation = useMutation({
    mutationFn: (propertyId: string) => ownerApi.deleteProperty(propertyId),
    onSuccess: (_, deletedId) => {
      setConfirmDeleteId(null);
      if (createdProp?.id === deletedId) setCreatedProp(null);
      if (editPropertyId === deletedId) {
        setEditPropertyId('');
        setFormMode('create');
      }
      if (targetPropertyId === deletedId) setTargetPropertyId('');
      void qc.invalidateQueries({ queryKey: ['owner-properties'] });
      void qc.invalidateQueries({ queryKey: ['owner-dashboard'] });
      pushToast('Property deleted successfully', 'success');
    },
    onError: (e: Error) => pushToast(e.message, 'error'),
  });

  const handleLoadPropertyObj = (p: PropertyDetailResponse) => {
    setFormMode('edit');
    setEditPropertyId(p.id);
    setTargetPropertyId(p.id);
    setCreatedProp(p);
    setName(p.name);
    setPropertyType(p.propertyType);
    setGenderPolicy(p.genderPolicy);
    setAddress(p.address);
    setLocality(p.locality ?? '');
    setCity(p.city);
    setState(p.state);
    setPincode(p.pincode);
    if (p.latitude != null) setLatitude(String(p.latitude));
    if (p.longitude != null) setLongitude(String(p.longitude));
    if (p.pricing) {
      setHourlyRate(p.pricing.hourlyRate != null ? String(p.pricing.hourlyRate) : '');
      setNightlyRate(String(p.pricing.nightlyRate));
      setMonthlyRate(p.pricing.monthlyRate != null ? String(p.pricing.monthlyRate) : '');
      setSecurityDeposit(String(p.pricing.securityDeposit ?? 0));
    }
    setAccuracyMeters(null);
    setLocationConfirmed(true);
    setShowUnlockConfirm(false);
    pushToast(`Loaded "${p.name}" for editing`, 'info');
  };

  const addRoomMutation = useMutation({
    mutationFn: () =>
      ownerApi.addRoom(targetPropertyId, {
        roomNumber,
        roomType,
        floor: 1,
        capacity: Number(capacity),
        autoCreateBeds: true,
      }),
    onSuccess: (res) => {
      pushToast(`Room ${res.roomNumber} created with ${res.beds.length} beds`, 'success');
    },
    onError: (e: Error) => pushToast(e.message, 'error'),
  });

  const parsedLat = Number(latitude);
  const parsedLng = Number(longitude);
  const coordsValid =
    !Number.isNaN(parsedLat) &&
    !Number.isNaN(parsedLng) &&
    parsedLat >= -90 &&
    parsedLat <= 90 &&
    parsedLng >= -180 &&
    parsedLng <= 180;

  return (
    <div className="space-y-6">
      {myPropertiesQuery.data && myPropertiesQuery.data.length > 0 && (
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-white">Your Properties ({myPropertiesQuery.data.length})</h2>
              <p className="text-xs text-slate-400">
                Edit or remove duplicate/unused listings. Deleting removes rooms and beds if no bookings exist.
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {myPropertiesQuery.data.map((prop) => (
              <div
                key={prop.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold text-white">{prop.name}</p>
                    <span className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-0.5 text-[11px] font-medium text-cyan-300">
                      {prop.propertyType}
                    </span>
                    <span className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-0.5 text-[11px] text-amber-300">
                      {prop.verificationStatus}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {prop.address}, {prop.city}, {prop.state} {prop.pincode} · {prop.rooms?.length ?? 0} rooms
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] text-slate-500">ID: {prop.id}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleLoadPropertyObj(prop)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>

                  {confirmDeleteId === prop.id ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={deletePropertyMutation.isPending}
                        onClick={() => deletePropertyMutation.mutate(prop.id)}
                        className="rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-50"
                      >
                        {deletePropertyMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(prop.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/20"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass-panel rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-white">
              {formMode === 'create' ? 'Create Property Listing' : 'Edit Property Listing'}
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Confirm exact property coordinates on the map before saving.
            </p>
          </div>
          <div className="inline-flex rounded-xl border border-slate-700 bg-slate-900 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => {
                setFormMode('create');
                setEditPropertyId('');
                setCreatedProp(null);
                setName('');
                setAddress('');
                setLocality('');
                setLocationConfirmed(false);
                setShowUnlockConfirm(false);
              }}
              className={`rounded-lg px-3 py-1.5 font-medium ${formMode === 'create' ? 'bg-indigo-600 text-white' : 'text-slate-300'}`}
            >
              Create New
            </button>
            <button
              type="button"
              onClick={() => setFormMode('edit')}
              className={`rounded-lg px-3 py-1.5 font-medium ${formMode === 'edit' ? 'bg-indigo-600 text-white' : 'text-slate-300'}`}
            >
              Edit Existing
            </button>
          </div>
        </div>

        {formMode === 'edit' && (
          <div className="mt-4 flex flex-wrap gap-2 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
            <input
              value={editPropertyId}
              onChange={(e) => setEditPropertyId(e.target.value)}
              placeholder="Enter Property UUID to edit"
              className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            />
            <button
              type="button"
              disabled={loadingExisting || !editPropertyId.trim()}
              onClick={() => void handleLoadPropertyForEdit()}
              className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-40"
            >
              {loadingExisting ? 'Loading...' : 'Load Property'}
            </button>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!locationConfirmed) {
              pushToast('Please confirm the property map pin location before saving.', 'error');
              return;
            }
            savePropertyMutation.mutate();
          }}
          className="mt-4 space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="prop-name" className="mb-1 block text-xs font-medium text-slate-300">Property Name</label>
              <input id="prop-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Zolo Indiranagar Hub" className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label htmlFor="prop-type" className="mb-1 block text-xs font-medium text-slate-300">Property Type</label>
              <SelectDropdown
                id="prop-type"
                ariaLabel="Property Type"
                value={propertyType}
                onChange={(val) => setPropertyType(val)}
                options={[
                  { value: 'HOSTEL', label: 'Hostel' },
                  { value: 'PG', label: 'PG' },
                  { value: 'DORMITORY', label: 'Dormitory' },
                  { value: 'CO_LIVING', label: 'Co-Living' },
                ]}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="prop-address" className="mb-1 block text-xs font-medium text-slate-300">Street Address</label>
              <input id="prop-address" required value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House/Plot No., Street, Landmark" className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label htmlFor="prop-locality" className="mb-1 block text-xs font-medium text-slate-300">Locality / Area</label>
              <input id="prop-locality" value={locality} onChange={(e) => setLocality(e.target.value)} placeholder="e.g. Indiranagar" className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label htmlFor="prop-city" className="mb-1 block text-xs font-medium text-slate-300">City</label>
              <input id="prop-city" required value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Bengaluru" className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label htmlFor="prop-state" className="mb-1 block text-xs font-medium text-slate-300">State</label>
              <input id="prop-state" required value={state} onChange={(e) => setState(e.target.value)} placeholder="e.g. Karnataka" className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label htmlFor="prop-pincode" className="mb-1 block text-xs font-medium text-slate-300">Pincode (6 digits)</label>
              <input id="prop-pincode" required value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="e.g. 560038" className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label htmlFor="prop-gender" className="mb-1 block text-xs font-medium text-slate-300">Gender Policy</label>
              <SelectDropdown
                id="prop-gender"
                ariaLabel="Gender Policy"
                value={genderPolicy}
                onChange={(val) => setGenderPolicy(val)}
                options={[
                  { value: 'CO_ED', label: 'Co-Ed' },
                  { value: 'MALE_ONLY', label: 'Male Only' },
                  { value: 'FEMALE_ONLY', label: 'Female Only' },
                ]}
              />
            </div>
            <div>
              <label htmlFor="prop-hourly" className="mb-1 block text-xs font-medium text-slate-300">Hourly Rate (₹ / hour)</label>
              <input id="prop-hourly" type="number" min="0" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} placeholder="e.g. 120" className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label htmlFor="prop-nightly" className="mb-1 block text-xs font-medium text-slate-300">Nightly Rate (₹ / night)</label>
              <input id="prop-nightly" required type="number" min="0" value={nightlyRate} onChange={(e) => setNightlyRate(e.target.value)} placeholder="e.g. 500" className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label htmlFor="prop-monthly" className="mb-1 block text-xs font-medium text-slate-300">Monthly Rate (₹ / month)</label>
              <input id="prop-monthly" type="number" min="0" value={monthlyRate} onChange={(e) => setMonthlyRate(e.target.value)} placeholder="e.g. 9000" className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label htmlFor="prop-deposit" className="mb-1 block text-xs font-medium text-slate-300">Security Deposit (₹)</label>
              <input id="prop-deposit" type="number" min="0" value={securityDeposit} onChange={(e) => setSecurityDeposit(e.target.value)} placeholder="e.g. 2000" className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
            </div>
          </div>

          {/* Location Capture & Confirmation Section */}
          <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="flex items-center gap-1.5 text-sm font-semibold text-white">
                  <MapPin className="h-4 w-4 text-cyan-400" /> Property Coordinates &amp; Map Pin
                </h2>
                <p className="text-xs text-slate-400">
                  Capture via GPS, search address, or drag/click the pin, then confirm before saving.
                </p>
              </div>
              <button
                type="button"
                disabled={geoLoading || locationConfirmed}
                onClick={handleUseCurrentLocation}
                className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-3.5 py-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Crosshair className="h-3.5 w-3.5" />
                {geoLoading ? 'Capturing...' : 'Use current location'}
              </button>
            </div>

            {geoError && (
              <div role="alert" className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                {geoError}
              </div>
            )}

            {/* Address Geocoding Search Fallback */}
            <div className="flex flex-wrap gap-2">
              <input
                value={geocodeQuery}
                disabled={locationConfirmed}
                onChange={(e) => setGeocodeQuery(e.target.value)}
                placeholder="Search address / landmark (e.g. Indiranagar Metro, Bengaluru)"
                className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white disabled:opacity-60"
              />
              <button
                type="button"
                disabled={geocodingLoading || locationConfirmed}
                onClick={() => void handleGeocodeSearch()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Search className="h-3.5 w-3.5" />
                {geocodingLoading ? 'Searching...' : 'Find on Map'}
              </button>
            </div>

            {geocodeResults.length > 0 && (
              <div className="space-y-1 rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs">
                {geocodeResults.map((g, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setLatitude(String(Number(Number(g.lat).toFixed(6))));
                      setLongitude(String(Number(Number(g.lon).toFixed(6))));
                      setAccuracyMeters(null);
                      setLocationConfirmed(false);
                      setGeocodeResults([]);
                    }}
                    className="block w-full rounded-lg px-2.5 py-1.5 text-left text-slate-300 hover:bg-slate-800"
                  >
                    {g.display_name}
                  </button>
                ))}
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="prop-lat" className="block text-xs text-slate-400">Latitude (-90 to 90)</label>
                <input
                  id="prop-lat"
                  required
                  disabled={locationConfirmed}
                  type="number"
                  step="any"
                  min="-90"
                  max="90"
                  value={latitude}
                  onChange={(e) => {
                    setLatitude(e.target.value);
                    setLocationConfirmed(false);
                  }}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
              <div>
                <label htmlFor="prop-lng" className="block text-xs text-slate-400">Longitude (-180 to 180)</label>
                <input
                  id="prop-lng"
                  required
                  disabled={locationConfirmed}
                  type="number"
                  step="any"
                  min="-180"
                  max="180"
                  value={longitude}
                  onChange={(e) => {
                    setLongitude(e.target.value);
                    setLocationConfirmed(false);
                  }}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </div>

            {accuracyMeters != null && (
              <p className="text-xs text-cyan-300">
                Captured GPS accuracy: ±{accuracyMeters} meters. Drag or click the pin if needed, then confirm below.
              </p>
            )}

            {coordsValid && (
              <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-slate-950" />}>
                <LocationPickerMap
                  latitude={parsedLat}
                  longitude={parsedLng}
                  accuracyMeters={accuracyMeters}
                  locked={locationConfirmed}
                  onLockedAttempt={() => setShowUnlockConfirm(true)}
                  onChangeLocation={handlePinMoved}
                />
              </Suspense>
            )}

            {showUnlockConfirm && locationConfirmed && (
              <div
                role="dialog"
                aria-label="Confirm pin unlock"
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3.5 text-xs text-amber-100"
              >
                <p className="font-medium">
                  Location pin is currently locked. Are you sure you want to unlock it to change the property coordinates?
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowUnlockConfirm(false)}
                    className="rounded-xl border border-slate-600 bg-slate-900 px-3 py-1.5 font-medium text-slate-200 hover:bg-slate-800"
                  >
                    Keep Locked
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLocationConfirmed(false);
                      setShowUnlockConfirm(false);
                    }}
                    className="rounded-xl bg-amber-500 px-3 py-1.5 font-semibold text-slate-950 hover:bg-amber-400"
                  >
                    Confirm Unlock
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <span className={`text-xs font-medium ${locationConfirmed ? 'text-emerald-300' : 'text-amber-300'}`}>
                {locationConfirmed
                  ? '✓ Pin location confirmed and locked'
                  : 'Pin location is unconfirmed — please confirm before saving'}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={!coordsValid || locationConfirmed}
                  onClick={() => void fillAddressFromCoords(parsedLat, parsedLng, true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Fill address from pin
                </button>
                {locationConfirmed ? (
                  <button
                    type="button"
                    onClick={() => setShowUnlockConfirm(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-600/20 px-4 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-600/30"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Location Locked (Change Pin)
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!coordsValid}
                    onClick={() => {
                      setLocationConfirmed(true);
                      setShowUnlockConfirm(false);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Confirm Pin Location
                  </button>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={savePropertyMutation.isPending || !locationConfirmed}
            className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
          >
            {savePropertyMutation.isPending
              ? 'Saving...'
              : formMode === 'edit'
              ? 'Update Property'
              : 'Create Property'}
          </button>
        </form>

        {createdProp && (
          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200">
            Saved Property ID: <span className="font-mono">{createdProp.id}</span> · Verification: {createdProp.verificationStatus}
          </div>
        )}
      </div>

      <div className="glass-panel rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white">Add Room &amp; Auto-Create Beds</h2>
        <p className="mt-1 text-xs text-slate-400">
          Select a property you created above (its UUID auto-fills after creating a property) or paste a Property UUID.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addRoomMutation.mutate();
          }}
          className="mt-4 grid gap-4 sm:grid-cols-4"
        >
          {myPropertiesQuery.data && myPropertiesQuery.data.length > 0 && (
            <div className="sm:col-span-4">
              <label htmlFor="room-prop-select" className="mb-1 block text-xs font-medium text-slate-300">
                Select Your Property
              </label>
              <SelectDropdown
                id="room-prop-select"
                ariaLabel="Select Your Property"
                value={targetPropertyId}
                placeholder="Choose a property…"
                onChange={(val) => setTargetPropertyId(val)}
                options={myPropertiesQuery.data.map((prop) => ({
                  value: prop.id,
                  label: `${prop.name} · ${prop.city}`,
                }))}
              />
            </div>
          )}
          <div className="sm:col-span-2">
            <label htmlFor="room-prop-uuid" className="mb-1 block text-xs font-medium text-slate-300">Property UUID</label>
            <input id="room-prop-uuid" required value={targetPropertyId} onChange={(e) => setTargetPropertyId(e.target.value)} placeholder="Auto-filled after creating a property" className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
          </div>
          <div>
            <label htmlFor="room-number" className="mb-1 block text-xs font-medium text-slate-300">Room Number</label>
            <input id="room-number" required value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} placeholder="e.g. 101" className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
          </div>
          <div>
            <label htmlFor="room-type" className="mb-1 block text-xs font-medium text-slate-300">Room Type</label>
            <SelectDropdown
              id="room-type"
              ariaLabel="Room Type"
              value={roomType}
              onChange={(val) => setRoomType(val)}
              options={[
                { value: 'SINGLE', label: 'Single' },
                { value: 'DOUBLE', label: 'Double' },
                { value: 'TRIPLE', label: 'Triple' },
                { value: 'DORMITORY', label: 'Dormitory' },
              ]}
            />
          </div>
          <div>
            <label htmlFor="room-capacity" className="mb-1 block text-xs font-medium text-slate-300">Bed Capacity</label>
            <input id="room-capacity" required type="number" min="1" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="e.g. 2" className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
          </div>
          <div className="flex items-end">
            <button type="submit" disabled={addRoomMutation.isPending} className="w-full rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500">
              Add Room + Beds
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
