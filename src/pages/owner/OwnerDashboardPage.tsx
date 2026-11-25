import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BedDouble, Building2, CalendarCheck, DoorOpen, Plus, Wallet } from 'lucide-react';
import { ownerApi } from '../../api/endpoints';
import { ErrorState } from '../../components/ui/ErrorState';
import { OwnerAnalyticsCharts } from '../../components/owner/OwnerAnalyticsCharts';
import { formatINR, formatIST } from '../../utils/format';

export function OwnerDashboardPage() {
  const dashQuery = useQuery({ queryKey: ['owner-dashboard'], queryFn: ownerApi.getDashboard });
  const analyticsQuery = useQuery({ queryKey: ['owner-analytics'], queryFn: ownerApi.getAnalytics });
  const propertiesQuery = useQuery({ queryKey: ['owner-properties'], queryFn: ownerApi.listProperties });
  const bookingsQuery = useQuery({
    queryKey: ['owner-bookings-inventory'],
    queryFn: () => ownerApi.getBookings({ page: 0, size: 100 }),
  });

  if (dashQuery.isLoading) return <div className="glass-panel h-72 animate-pulse rounded-2xl" />;
  if (dashQuery.isError || !dashQuery.data) {
    return <ErrorState message={(dashQuery.error as Error)?.message ?? 'Failed to load owner dashboard'} onRetry={() => void dashQuery.refetch()} />;
  }

  const d = dashQuery.data;
  const a = analyticsQuery.data;
  const properties = propertiesQuery.data ?? [];
  const bookings = bookingsQuery.data?.content ?? [];
  const nowMs = Date.now();

  const bookedBedIds = new Set(
    bookings
      .filter((b) => {
        const activeOut = new Date(b.checkOut).getTime() > nowMs;
        return activeOut && (b.bookingStatus === 'CONFIRMED' || b.bookingStatus === 'PENDING');
      })
      .map((b) => b.bedId),
  );

  const allRooms = properties.flatMap((p) => p.rooms ?? []);
  const allBeds = allRooms.flatMap((r) => r.beds ?? []);
  const allBedIds = allBeds.map((b) => b.id);
  const bedBlocksQuery = useQuery({
    queryKey: ['owner-all-bed-blocks', allBedIds.join(',')],
    queryFn: async () => {
      const results = await Promise.all(
        allBedIds.map(async (id) => ({
          id,
          blocks: await ownerApi.getBlocksForBed(id).catch(() => []),
        })),
      );
      const blocked = new Set<string>();
      for (const item of results) {
        if (
          item.blocks.some(
            (blk) => new Date(blk.startTime).getTime() <= nowMs + 60_000 && new Date(blk.endTime).getTime() > nowMs,
          )
        ) {
          blocked.add(item.id);
        }
      }
      return Array.from(blocked);
    },
    enabled: allBedIds.length > 0,
    retry: false,
  });
  const blockedBedIds = new Set(bedBlocksQuery.data ?? []);

  const totalRooms = allRooms.length;
  const totalBeds = allBeds.length;
  const occupiedBeds = allBeds.filter((b) => bookedBedIds.has(b.id)).length;
  const unavailableBeds = allBeds.filter((b) => !bookedBedIds.has(b.id) && (b.status !== 'AVAILABLE' || blockedBedIds.has(b.id))).length;
  const vacantBeds = allBeds.filter((b) => !bookedBedIds.has(b.id) && b.status === 'AVAILABLE' && !blockedBedIds.has(b.id)).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Property Owner Overview</h1>
          <p className="mt-1 text-base text-slate-300">
            Manage your hostels, PGs, bed inventory, check-ins, and earnings in one place.
          </p>
        </div>
        <Link
          to="/owner/properties"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 hover:opacity-95"
        >
          <Plus className="h-4 w-4" />
          Manage Properties
        </Link>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-300">Properties</p>
            <Building2 className="h-5 w-5 text-cyan-400" />
          </div>
          <p className="mt-3 text-4xl font-bold text-white">{d.totalProperties}</p>
          <p className="mt-1 text-xs text-slate-400">Active hostels &amp; PGs</p>
        </div>
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-300">Pending Approvals</p>
            <CalendarCheck className="h-5 w-5 text-amber-400" />
          </div>
          <p className="mt-3 text-4xl font-bold text-amber-300">{d.pendingBookings}</p>
          <p className="mt-1 text-xs text-slate-400">Awaiting owner review</p>
        </div>
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-300">Confirmed Bookings</p>
            <CalendarCheck className="h-5 w-5 text-cyan-400" />
          </div>
          <p className="mt-3 text-4xl font-bold text-cyan-300">{d.confirmedBookings}</p>
          <p className="mt-1 text-xs text-slate-400">Upcoming &amp; active stays</p>
        </div>
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-300">Net Earnings</p>
            <Wallet className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="mt-3 text-4xl font-bold text-emerald-300">{formatINR(d.netEarnings)}</p>
          <p className="mt-1 text-xs text-slate-400">Total settled &amp; accrued</p>
        </div>
      </div>

      {/* Rooms & Bed Occupancy Inventory */}
      <div className="glass-panel rounded-2xl p-6 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BedDouble className="h-5 w-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">Rooms &amp; Bed Inventory</h2>
          </div>
          <Link to="/owner/properties" className="text-sm font-medium text-cyan-300 hover:text-cyan-200">
            Add or edit rooms
          </Link>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
            <p className="text-sm text-slate-400">Total Rooms</p>
            <p className="mt-1.5 text-2xl font-bold text-white">{totalRooms}</p>
          </div>
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
            <p className="text-sm text-slate-400">Total Beds</p>
            <p className="mt-1.5 text-2xl font-bold text-cyan-300">{totalBeds}</p>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <p className="text-sm text-emerald-200/80">Vacant Beds</p>
            <p className="mt-1.5 text-2xl font-bold text-emerald-300">{vacantBeds}</p>
          </div>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <p className="text-sm text-amber-200/80">Booked / Occupied Beds</p>
            <p className="mt-1.5 text-2xl font-bold text-amber-300">
              {occupiedBeds}
              {unavailableBeds > 0 && (
                <span className="ml-2 text-xs font-normal text-slate-400">
                  (+{unavailableBeds} blocked)
                </span>
              )}
            </p>
          </div>
        </div>

        {properties.length > 0 && (
          <div className="mt-5 space-y-3">
            {properties.map((prop) => {
              const rooms = prop.rooms ?? [];
              const propBeds = rooms.flatMap((r) => r.beds ?? []);
              const propOccupied = propBeds.filter((b) => bookedBedIds.has(b.id)).length;
              const propVacant = propBeds.filter((b) => !bookedBedIds.has(b.id) && b.status === 'AVAILABLE' && !blockedBedIds.has(b.id)).length;

              return (
                <div key={prop.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <DoorOpen className="h-4 w-4 text-indigo-300" />
                      <span className="text-base font-semibold text-white">{prop.name}</span>
                      <span className="text-xs text-slate-400">({prop.city})</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-slate-200">
                        {rooms.length} {rooms.length === 1 ? 'Room' : 'Rooms'}
                      </span>
                      <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 font-medium text-emerald-300">
                        {propVacant} Vacant
                      </span>
                      <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 font-medium text-amber-300">
                        {propOccupied} Booked
                      </span>
                    </div>
                  </div>

                  {rooms.length === 0 ? (
                    <p className="mt-2 text-xs text-slate-400">
                      No rooms added yet.{' '}
                      <Link to="/owner/properties" className="text-cyan-300 hover:underline">
                        Add rooms &amp; beds
                      </Link>
                    </p>
                  ) : (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {rooms.map((room) => (
                        <div key={room.id} className="rounded-lg border border-slate-800/90 bg-slate-950/70 p-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-200">
                              Room {room.roomNumber} · {room.roomType}
                            </span>
                            <span className="text-slate-400">{room.beds?.length ?? 0} beds</span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {(room.beds ?? []).map((bed) => {
                              const isBooked = bookedBedIds.has(bed.id);
                              const isMaint = !isBooked && (bed.status !== 'AVAILABLE' || blockedBedIds.has(bed.id));
                              return (
                                <span
                                  key={bed.id}
                                  className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
                                    isBooked
                                      ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30'
                                      : isMaint
                                      ? 'bg-slate-800 text-slate-300 border border-slate-700'
                                      : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                  }`}
                                >
                                  Bed {bed.bedNumber} · {isBooked ? 'Occupied' : isMaint ? (blockedBedIds.has(bed.id) ? 'Blocked' : bed.status) : 'Vacant'}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <OwnerAnalyticsCharts
        dashboard={d}
        analytics={a}
        properties={properties}
        bookings={bookings}
        totalRooms={totalRooms}
        totalBeds={totalBeds}
        vacantBeds={vacantBeds}
        occupiedBeds={occupiedBeds}
        unavailableBeds={unavailableBeds}
      />

      {a && (
        <div className="glass-panel rounded-2xl p-6 sm:p-7">
          <h2 className="text-lg font-semibold text-white">Analytics Summary</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
              <p className="text-sm text-slate-400">Total Bookings</p>
              <p className="mt-1.5 text-2xl font-bold text-white">{a.totalBookings}</p>
            </div>
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
              <p className="text-sm text-slate-400">Completed Stays</p>
              <p className="mt-1.5 text-2xl font-bold text-cyan-300">{a.completedBookings}</p>
            </div>
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
              <p className="text-sm text-slate-400">Cancelled</p>
              <p className="mt-1.5 text-2xl font-bold text-rose-300">{a.cancelledBookings}</p>
            </div>
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
              <p className="text-sm text-slate-400">Net Revenue</p>
              <p className="mt-1.5 text-2xl font-bold text-emerald-300">{formatINR(a.netRevenue)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="glass-panel rounded-2xl p-6 sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">Upcoming Check-Ins (Next 7 Days)</h2>
          <Link to="/owner/bookings" className="text-sm font-medium text-cyan-300 hover:text-cyan-200">
            View all bookings
          </Link>
        </div>
        {d.upcomingCheckIns.length ? (
          <div className="mt-4 space-y-3">
            {d.upcomingCheckIns.map((b) => (
              <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <div>
                  <span className="font-mono text-xs text-cyan-300">{b.bookingReference}</span>
                  <p className="mt-0.5 text-base font-medium text-white">{b.guestName} ({b.guestPhone})</p>
                  <p className="text-sm text-slate-400">{b.propertyName} · Room {b.roomNumber} · Bed {b.bedNumber}</p>
                </div>
                <span className="text-sm font-medium text-slate-200">{formatIST(b.checkIn)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-base text-slate-400">No upcoming check-ins in the next 7 days.</p>
        )}
      </div>
    </div>
  );
}
