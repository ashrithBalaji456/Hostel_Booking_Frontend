import { useState } from 'react';
import { BedDouble, Check, RefreshCw } from 'lucide-react';
import { SelectDropdown } from '../ui/SelectDropdown';
import type { AvailableBedInfo, PropertyAvailabilityResponse, RoomResponse } from '../../types/api';
import { formatINR } from '../../utils/format';

interface InteractiveBedSelectorProps {
  rooms: RoomResponse[];
  availability?: PropertyAvailabilityResponse;
  selectedBedId: string | null;
  isLoadingAvailability: boolean;
  onRefreshAvailability: () => void;
  onSelectBed: (bed: AvailableBedInfo) => void;
}

export function InteractiveBedSelector({
  rooms,
  availability,
  selectedBedId,
  isLoadingAvailability,
  onRefreshAvailability,
  onSelectBed,
}: InteractiveBedSelectorProps) {
  const [viewMode, setViewMode] = useState<'spatial' | 'list'>('spatial');
  const [selectedFloor, setSelectedFloor] = useState<string>('ALL');
  const [selectedSharing, setSelectedSharing] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'default' | 'avail_desc' | 'occ_asc' | 'occ_desc' | 'cap_asc' | 'cap_desc'>('default');

  const floors = Array.from(new Set(rooms.map((r) => r.floor))).sort((a, b) => a - b);
  const sharingTypes = Array.from(new Set(rooms.map((r) => r.roomType)));

  const availableMap = new Map<string, AvailableBedInfo>();
  availability?.availableBeds.forEach((b) => availableMap.set(b.bedId, b));

  const getRoomFreeCount = (room: RoomResponse) =>
    room.beds.filter((b) => availableMap.has(b.id)).length;

  const getRoomOccupancyRatio = (room: RoomResponse) => {
    const total = room.beds.length || room.capacity || 1;
    const free = getRoomFreeCount(room);
    return (total - free) / total;
  };

  const filteredRooms = rooms
    .filter((r) => (selectedFloor === 'ALL' ? true : r.floor === Number(selectedFloor)))
    .filter((r) => (selectedSharing === 'ALL' ? true : r.roomType === selectedSharing))
    .slice()
    .sort((a, b) => {
      if (sortBy === 'avail_desc') return getRoomFreeCount(b) - getRoomFreeCount(a);
      if (sortBy === 'occ_asc') return getRoomOccupancyRatio(a) - getRoomOccupancyRatio(b);
      if (sortBy === 'occ_desc') return getRoomOccupancyRatio(b) - getRoomOccupancyRatio(a);
      if (sortBy === 'cap_asc') return a.capacity - b.capacity;
      if (sortBy === 'cap_desc') return b.capacity - a.capacity;
      return a.floor - b.floor || a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true });
    });

  return (
    <div className="glass-panel flex min-h-[430px] flex-col rounded-2xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Room &amp; Bed Selector</h2>
          <p className="text-xs text-slate-400">
            {availability
              ? `${availability.availableBedsCount} of ${availability.totalBeds} beds available for your selected window`
              : 'Select check-in and check-out times to check live bed availability'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl border border-slate-700 bg-slate-900 p-0.5 text-xs" role="group" aria-label="Bed selector view mode">
            <button
              type="button"
              onClick={() => setViewMode('spatial')}
              className={`rounded-lg px-2.5 py-1 font-medium ${viewMode === 'spatial' ? 'bg-cyan-600 text-white' : 'text-slate-300'}`}
            >
              Spatial Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`rounded-lg px-2.5 py-1 font-medium ${viewMode === 'list' ? 'bg-cyan-600 text-white' : 'text-slate-300'}`}
            >
              Accessible List
            </button>
          </div>
          <button
            type="button"
            onClick={onRefreshAvailability}
            disabled={isLoadingAvailability}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoadingAvailability ? 'animate-spin' : ''}`} />
            Revalidate
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-300">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-emerald-400/60 bg-emerald-500/20" /> Available
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-cyan-400 bg-cyan-500/40" /> Selected
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-slate-700 bg-slate-800/80" /> Unavailable / Held / Maintenance
        </span>
      </div>

      {rooms.length > 0 && (
        <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
          <div>
            <label htmlFor="bed-filter-floor" className="mb-1 block text-[11px] text-slate-400">
              Filter by Floor
            </label>
            <SelectDropdown
              id="bed-filter-floor"
              ariaLabel="Filter by Floor"
              value={selectedFloor}
              onChange={setSelectedFloor}
              options={[
                { value: 'ALL', label: 'All Floors' },
                ...floors.map((fl) => ({
                  value: String(fl),
                  label: fl === 0 ? 'Ground Floor' : `Floor ${fl}`,
                })),
              ]}
            />
          </div>
          <div>
            <label htmlFor="bed-filter-sharing" className="mb-1 block text-[11px] text-slate-400">
              Room Sharing
            </label>
            <SelectDropdown
              id="bed-filter-sharing"
              ariaLabel="Room Sharing"
              value={selectedSharing}
              onChange={setSelectedSharing}
              options={[
                { value: 'ALL', label: 'All Sharing Types' },
                ...sharingTypes.map((st) => ({
                  value: st,
                  label: st.replace(/_/g, ' '),
                })),
              ]}
            />
          </div>
          <div>
            <label htmlFor="bed-sort-occ" className="mb-1 block text-[11px] text-slate-400">
              Sort by Occupancy
            </label>
            <SelectDropdown
              id="bed-sort-occ"
              ariaLabel="Sort by Occupancy"
              value={sortBy}
              onChange={(val) => setSortBy(val as typeof sortBy)}
              options={[
                { value: 'default', label: 'Floor & Room Order' },
                { value: 'avail_desc', label: 'Most Free Beds First' },
                { value: 'occ_asc', label: 'Lowest Occupancy First' },
                { value: 'occ_desc', label: 'Highest Occupancy First' },
                { value: 'cap_asc', label: 'Sharing: Low to High' },
                { value: 'cap_desc', label: 'Sharing: High to Low' },
              ]}
            />
          </div>
        </div>
      )}

      {rooms.length === 0 ? (
        <p className="mt-6 text-sm text-slate-400">No rooms configured for this property yet.</p>
      ) : filteredRooms.length === 0 ? (
        <div className="mt-6 flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
          <span>No rooms match the selected floor or sharing filter.</span>
          <button
            type="button"
            onClick={() => {
              setSelectedFloor('ALL');
              setSelectedSharing('ALL');
            }}
            className="rounded-lg border border-cyan-500/40 bg-cyan-500/15 px-3 py-1 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/25"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'spatial' ? (
        <div className="mt-5 grid max-h-[400px] flex-1 gap-4 overflow-y-auto pr-1 md:grid-cols-2">
          {filteredRooms.map((room) => (
            <div key={room.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Room {room.roomNumber} · {room.roomType}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {room.floor === 0 ? 'Ground Floor' : `Floor ${room.floor}`} · Capacity {room.capacity}
                  </p>
                </div>
                {room.nightlyRate != null && (
                  <span className="text-xs font-semibold text-cyan-300">{formatINR(room.nightlyRate)}/night</span>
                )}
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {room.beds.map((bed) => {
                  const availInfo = availableMap.get(bed.id);
                  const isAvailable = Boolean(availInfo);
                  const isSelected = selectedBedId === bed.id;

                  return (
                    <button
                      key={bed.id}
                      type="button"
                      disabled={!isAvailable}
                      aria-pressed={isSelected}
                      aria-label={`Bed ${bed.bedNumber} in Room ${room.roomNumber} - ${
                        isSelected ? 'Selected' : isAvailable ? 'Available' : 'Unavailable'
                      }`}
                      onClick={() => availInfo && onSelectBed(availInfo)}
                      className={`flex items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-left text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-500/25 text-white'
                          : isAvailable
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20'
                          : 'cursor-not-allowed border-slate-800 bg-slate-950/60 text-slate-500 line-through'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 whitespace-nowrap">
                        <BedDouble className="h-3.5 w-3.5 shrink-0" />
                        {bed.bedNumber}
                      </span>
                      {isSelected ? (
                        <Check className="h-3.5 w-3.5 shrink-0 text-cyan-300" />
                      ) : (
                        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide">
                          {isAvailable ? 'Free' : bed.status === 'MAINTENANCE' ? 'Maint' : 'Held'}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-5 max-h-[400px] flex-1 divide-y divide-slate-800 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900/60">
          {filteredRooms.flatMap((room) =>
            room.beds.map((bed) => {
              const availInfo = availableMap.get(bed.id);
              const isAvailable = Boolean(availInfo);
              const isSelected = selectedBedId === bed.id;
              return (
                <div key={bed.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium text-white">
                      Room {room.roomNumber} ({room.roomType}) — Bed {bed.bedNumber}
                    </p>
                    <p className="text-xs text-slate-400">
                      Status: {isSelected ? 'Selected' : isAvailable ? 'Available' : `Unavailable (${bed.status})`}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={!isAvailable}
                    onClick={() => availInfo && onSelectBed(availInfo)}
                    className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950'
                        : isAvailable
                        ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                        : 'cursor-not-allowed bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isSelected ? 'Selected' : isAvailable ? 'Select' : 'Unavailable'}
                  </button>
                </div>
              );
            }),
          )}
        </div>
      )}
    </div>
  );
}
