import { lazy, Suspense, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle2, Crosshair, MapPin, Search } from 'lucide-react';
import { ownerApi, propertyApi } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';
import type { GenderPolicy, PropertyDetailResponse, PropertyType, RoomType } from '../../types/api';

const LocationPickerMap = lazy(() => import('../../components/map/LocationPickerMap'));

interface GeocodingSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

export function OwnerPropertiesPage() {
  const { pushToast } = useToast();
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editPropertyId, setEditPropertyId] = useState('');
  const [loadingExisting, setLoadingExisting] = useState(false);

  const [createdProp, setCreatedProp] = useState<PropertyDetailResponse | null>(null);
  const [targetPropertyId, setTargetPropertyId] = useState('');

  // Property fields
  const [name, setName] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType>('HOSTEL');
  const [genderPolicy, setGenderPolicy] = useState<GenderPolicy>('CO_ED');
  const [address, setAddress] = useState('');
  const [locality, setLocality] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [state, setState] = useState('Karnataka');
  const [pincode, setPincode] = useState('560038');
  const [latitude, setLatitude] = useState('12.9716');
  const [longitude, setLongitude] = useState('77.5946');
  const [nightlyRate, setNightlyRate] = useState('500');
  const [monthlyRate, setMonthlyRate] = useState('9000');
  const [securityDeposit, setSecurityDeposit] = useState('2000');

  // Location capture & explicit confirmation state
  const [accuracyMeters, setAccuracyMeters] = useState<number | null>(null);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
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

  const handleUseCurrentLocation = () => {
    setGeoError(null);
    if (!('geolocation' in navigator)) {
      setGeoError('Device geolocation is not supported in this browser. Search by address or place the pin manually.');
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(String(Number(pos.coords.latitude.toFixed(6))));
        setLongitude(String(Number(pos.coords.longitude.toFixed(6))));
        setAccuracyMeters(pos.coords.accuracy ? Math.round(pos.coords.accuracy) : null);
        setLocationConfirmed(false);
        setGeoLoading(false);
        pushToast('Location captured. Please review the map pin and confirm before saving.', 'info');
      },
      (err) => {
        setGeoLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError('Location permission was denied. Use address search below or drag/click the map pin manually.');
        } else {
          setGeoError('Unable to determine current location. Use address search below or place the pin manually.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
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
      setCreatedProp(res);
      setTargetPropertyId(res.id);
      pushToast(
        formMode === 'edit'
          ? `Property updated (${res.id})`
          : `Property created (${res.id}) — pending admin verification`,
        'success',
      );
    },
    onError: (e: Error) => pushToast(e.message, 'error'),
  });

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
                setLocationConfirmed(false);
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
          <div className="grid gap-3 sm:grid-cols-2">
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Property Name" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
            <select value={propertyType} onChange={(e) => setPropertyType(e.target.value as PropertyType)} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white">
              <option value="HOSTEL">Hostel</option>
              <option value="PG">PG</option>
              <option value="DORMITORY">Dormitory</option>
              <option value="CO_LIVING">Co-Living</option>
            </select>
            <input required value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street Address" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white sm:col-span-2" />
            <input value={locality} onChange={(e) => setLocality(e.target.value)} placeholder="Locality" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
            <input required value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
            <input required value={state} onChange={(e) => setState(e.target.value)} placeholder="State" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
            <input required value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="Pincode (6 digits)" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
            <select value={genderPolicy} onChange={(e) => setGenderPolicy(e.target.value as GenderPolicy)} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white">
              <option value="CO_ED">Co-Ed</option>
              <option value="MALE_ONLY">Male Only</option>
              <option value="FEMALE_ONLY">Female Only</option>
            </select>
            <input required type="number" value={nightlyRate} onChange={(e) => setNightlyRate(e.target.value)} placeholder="Nightly Rate ₹" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
            <input type="number" value={monthlyRate} onChange={(e) => setMonthlyRate(e.target.value)} placeholder="Monthly Rate ₹" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
            <input type="number" value={securityDeposit} onChange={(e) => setSecurityDeposit(e.target.value)} placeholder="Security Deposit ₹" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
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
                disabled={geoLoading}
                onClick={handleUseCurrentLocation}
                className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-3.5 py-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/25 disabled:opacity-50"
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
                onChange={(e) => setGeocodeQuery(e.target.value)}
                placeholder="Search address / landmark (e.g. Indiranagar Metro, Bengaluru)"
                className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
              />
              <button
                type="button"
                disabled={geocodingLoading}
                onClick={() => void handleGeocodeSearch()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700"
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
                  type="number"
                  step="any"
                  min="-90"
                  max="90"
                  value={latitude}
                  onChange={(e) => {
                    setLatitude(e.target.value);
                    setLocationConfirmed(false);
                  }}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label htmlFor="prop-lng" className="block text-xs text-slate-400">Longitude (-180 to 180)</label>
                <input
                  id="prop-lng"
                  required
                  type="number"
                  step="any"
                  min="-180"
                  max="180"
                  value={longitude}
                  onChange={(e) => {
                    setLongitude(e.target.value);
                    setLocationConfirmed(false);
                  }}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
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
                  onChangeLocation={handlePinMoved}
                />
              </Suspense>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <span className={`text-xs font-medium ${locationConfirmed ? 'text-emerald-300' : 'text-amber-300'}`}>
                {locationConfirmed
                  ? '✓ Pin location confirmed for saving'
                  : 'Pin location is unconfirmed — please confirm before saving'}
              </span>
              <button
                type="button"
                disabled={!coordsValid}
                onClick={() => setLocationConfirmed(true)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold ${
                  locationConfirmed
                    ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-emerald-600 text-white hover:bg-emerald-500'
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {locationConfirmed ? 'Location Confirmed' : 'Confirm Pin Location'}
              </button>
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
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addRoomMutation.mutate();
          }}
          className="mt-4 grid gap-3 sm:grid-cols-4"
        >
          <input required value={targetPropertyId} onChange={(e) => setTargetPropertyId(e.target.value)} placeholder="Property UUID" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white sm:col-span-2" />
          <input required value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} placeholder="Room # (e.g. 101)" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
          <select value={roomType} onChange={(e) => setRoomType(e.target.value as RoomType)} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white">
            <option value="SINGLE">Single</option>
            <option value="DOUBLE">Double</option>
            <option value="TRIPLE">Triple</option>
            <option value="DORMITORY">Dormitory</option>
          </select>
          <input required type="number" min="1" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="Bed Capacity" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
          <button type="submit" disabled={addRoomMutation.isPending} className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white">
            Add Room + Beds
          </button>
        </form>
      </div>
    </div>
  );
}
