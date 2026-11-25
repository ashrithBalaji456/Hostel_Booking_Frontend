import { useState } from 'react';
import { BedDouble, Check, RefreshCw } from 'lucide-react';
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

  const availableMap = new Map<string, AvailableBedInfo>();
  availability?.availableBeds.forEach((b) => availableMap.set(b.bedId, b));

  return (
    <div className="glass-panel rounded-2xl p-5">
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

      {rooms.length === 0 ? (
        <p className="mt-6 text-sm text-slate-400">No rooms configured for this property yet.</p>
      ) : viewMode === 'spatial' ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {rooms.map((room) => (
            <div key={room.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Room {room.roomNumber} · {room.roomType}
                  </h3>
                  <p className="text-xs text-slate-400">Floor {room.floor} · Capacity {room.capacity}</p>
                </div>
                {room.nightlyRate != null && (
                  <span className="text-xs font-semibold text-cyan-300">{formatINR(room.nightlyRate)}/night</span>
                )}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
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
                      className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-500/25 text-white'
                          : isAvailable
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20'
                          : 'cursor-not-allowed border-slate-800 bg-slate-950/60 text-slate-500 line-through'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <BedDouble className="h-3.5 w-3.5" />
                        {bed.bedNumber}
                      </span>
                      {isSelected ? (
                        <Check className="h-3.5 w-3.5 text-cyan-300" />
                      ) : (
                        <span className="text-[10px] uppercase">
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
        <div className="mt-5 divide-y divide-slate-800 rounded-2xl border border-slate-800 bg-slate-900/60">
          {rooms.flatMap((room) =>
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
