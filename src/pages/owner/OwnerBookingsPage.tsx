import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ownerApi } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ErrorState } from '../../components/ui/ErrorState';
import { formatINR, formatIST, toIsoUtc } from '../../utils/format';

export function OwnerBookingsPage() {
  const { pushToast } = useToast();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [walkInBedId, setWalkInBedId] = useState('');
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInCheckIn, setWalkInCheckIn] = useState('');
  const [walkInCheckOut, setWalkInCheckOut] = useState('');

  const query = useQuery({
    queryKey: ['owner-bookings', statusFilter],
    queryFn: () => ownerApi.getBookings({ status: statusFilter || undefined, page: 0, size: 20 }),
  });

  const refresh = () => void qc.invalidateQueries({ queryKey: ['owner-bookings'] });

  const walkInMutation = useMutation({
    mutationFn: () =>
      ownerApi.createWalkIn({
        bedId: walkInBedId,
        checkIn: toIsoUtc(walkInCheckIn),
        checkOut: toIsoUtc(walkInCheckOut),
        stayType: 'SHORT_STAY',
        guestName: walkInName,
        guestPhone: walkInPhone,
        paidAtDesk: true,
      }),
    onSuccess: (res) => {
      pushToast(`Walk-in booking created (${res.bookingReference})`, 'success');
      refresh();
    },
    onError: (e: Error) => pushToast(e.message, 'error'),
  });

  return (
    <div className="space-y-6">
      {/* Walk-in booking form */}
      <div className="glass-panel rounded-2xl p-6">
        <h2 className="text-base font-semibold text-white">Record Walk-In Booking</h2>
        <form onSubmit={(e) => { e.preventDefault(); walkInMutation.mutate(); }} className="mt-3 grid gap-3 sm:grid-cols-3">
          <input required value={walkInBedId} onChange={(e) => setWalkInBedId(e.target.value)} placeholder="Bed UUID" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
          <input required value={walkInName} onChange={(e) => setWalkInName(e.target.value)} placeholder="Guest Name" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
          <input required value={walkInPhone} onChange={(e) => setWalkInPhone(e.target.value)} placeholder="Guest Phone" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
          <input required type="datetime-local" value={walkInCheckIn} onChange={(e) => setWalkInCheckIn(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
          <input required type="datetime-local" value={walkInCheckOut} onChange={(e) => setWalkInCheckOut(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
          <button type="submit" disabled={walkInMutation.isPending} className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white">
            Create Walk-In
          </button>
        </form>
      </div>

      {/* Bookings list */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Property Bookings</h1>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white">
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {query.isLoading ? (
        <div className="glass-panel h-48 animate-pulse rounded-2xl" />
      ) : query.isError ? (
        <ErrorState message={(query.error as Error).message} onRetry={() => void query.refetch()} />
      ) : (
        <div className="space-y-3">
          {query.data?.content.map((b) => (
            <div key={b.id} className="glass-panel rounded-2xl p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-mono text-xs text-cyan-300">{b.bookingReference}</span>
                  <h3 className="text-sm font-semibold text-white">{b.guestName} ({b.guestPhone}) · {b.propertyName}</h3>
                  <p className="text-xs text-slate-400">
                    Room {b.roomNumber} · Bed {b.bedNumber} · {formatIST(b.checkIn)} → {formatIST(b.checkOut)} · {formatINR(b.totalAmount)}
                  </p>
                </div>
                <StatusBadge status={b.bookingStatus} />
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {b.bookingStatus === 'PENDING' && b.approvalRequired && (
                  <>
                    <button type="button" onClick={() => void ownerApi.approveBooking(b.id).then(() => { pushToast('Approved', 'success'); refresh(); }).catch((e: Error) => pushToast(e.message, 'error'))} className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
                      Approve
                    </button>
                    <button type="button" onClick={() => void ownerApi.rejectBooking(b.id, 'Unavailable').then(() => { pushToast('Rejected', 'info'); refresh(); }).catch((e: Error) => pushToast(e.message, 'error'))} className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-semibold text-white">
                      Reject
                    </button>
                  </>
                )}
                {b.bookingStatus === 'CONFIRMED' && (
                  <>
                    <button type="button" onClick={() => void ownerApi.checkIn(b.id).then(() => { pushToast('Checked in', 'success'); refresh(); }).catch((e: Error) => pushToast(e.message, 'error'))} className="rounded-lg bg-cyan-600 px-3 py-1 text-xs font-semibold text-white">
                      Check-In
                    </button>
                    <button type="button" onClick={() => void ownerApi.checkOut(b.id).then(() => { pushToast('Checked out', 'success'); refresh(); }).catch((e: Error) => pushToast(e.message, 'error'))} className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
                      Check-Out
                    </button>
                    <button type="button" onClick={() => void ownerApi.markNoShow(b.id).then(() => { pushToast('Marked no-show', 'info'); refresh(); }).catch((e: Error) => pushToast(e.message, 'error'))} className="rounded-lg border border-amber-500/40 px-3 py-1 text-xs text-amber-300">
                      No-Show
                    </button>
                  </>
                )}
                {b.depositAmount > 0 && (
                  <button type="button" onClick={() => void ownerApi.settleDeposit(b.id, 0).then(() => { pushToast('Deposit settled', 'success'); refresh(); }).catch((e: Error) => pushToast(e.message, 'error'))} className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-200">
                    Refund Full Deposit
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
