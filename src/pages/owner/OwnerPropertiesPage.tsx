import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ownerApi } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';
import type { GenderPolicy, PropertyDetailResponse, PropertyType, RoomType } from '../../types/api';

export function OwnerPropertiesPage() {
  const { pushToast } = useToast();
  const [createdProp, setCreatedProp] = useState<PropertyDetailResponse | null>(null);
  const [targetPropertyId, setTargetPropertyId] = useState('');

  // Create Property fields
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

  // Room fields
  const [roomNumber, setRoomNumber] = useState('101');
  const [roomType, setRoomType] = useState<RoomType>('DOUBLE');
  const [capacity, setCapacity] = useState('2');

  const createPropMutation = useMutation({
    mutationFn: () =>
      ownerApi.createProperty({
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
      }),
    onSuccess: (res) => {
      setCreatedProp(res);
      setTargetPropertyId(res.id);
      pushToast(`Property created (${res.id}) — pending admin verification`, 'success');
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

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-2xl p-6">
        <h1 className="text-xl font-bold text-white">Create Property Listing</h1>
        <p className="mt-1 text-xs text-slate-400">
          Note: The backend does not yet expose GET /api/v1/owner/properties; save your Property ID after creation to add rooms/beds.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            createPropMutation.mutate();
          }}
          className="mt-4 grid gap-3 sm:grid-cols-2"
        >
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
          <input required type="number" step="any" min="-90" max="90" value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="Latitude (-90 to 90)" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
          <input required type="number" step="any" min="-180" max="180" value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="Longitude (-180 to 180)" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
          <select value={genderPolicy} onChange={(e) => setGenderPolicy(e.target.value as GenderPolicy)} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white">
            <option value="CO_ED">Co-Ed</option>
            <option value="MALE_ONLY">Male Only</option>
            <option value="FEMALE_ONLY">Female Only</option>
          </select>
          <input required type="number" value={nightlyRate} onChange={(e) => setNightlyRate(e.target.value)} placeholder="Nightly Rate ₹" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
          <input type="number" value={monthlyRate} onChange={(e) => setMonthlyRate(e.target.value)} placeholder="Monthly Rate ₹" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
          <input type="number" value={securityDeposit} onChange={(e) => setSecurityDeposit(e.target.value)} placeholder="Security Deposit ₹" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
          <button type="submit" disabled={createPropMutation.isPending} className="rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white sm:col-span-2">
            {createPropMutation.isPending ? 'Creating...' : 'Create Property'}
          </button>
        </form>

        {createdProp && (
          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200">
            Created Property ID: <span className="font-mono">{createdProp.id}</span> · Verification: {createdProp.verificationStatus}
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
