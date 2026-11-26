import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bookingApi, customerOpsApi, paymentApi } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { ErrorState } from '../../components/ui/ErrorState';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatINR, formatIST, toIsoUtc } from '../../utils/format';
import type { PropertySearchItemResponse } from '../../types/api';

export function BookingDetailPage() {
  const { bookingId = '' } = useParams();
  const { pushToast } = useToast();
  const qc = useQueryClient();

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [extendDate, setExtendDate] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [failureReason, setFailureReason] = useState('BED_UNAVAILABLE');
  const [failureDesc, setFailureDesc] = useState('');
  const [failureResult, setFailureResult] = useState<{
    failureId: string;
    alternatives: PropertySearchItemResponse[];
  } | null>(null);

  const bookingQuery = useQuery({
    queryKey: ['booking-detail', bookingId],
    queryFn: () => bookingApi.getById(bookingId),
    enabled: Boolean(bookingId),
  });

  const historyQuery = useQuery({
    queryKey: ['booking-history', bookingId],
    queryFn: () => bookingApi.getHistory(bookingId),
    enabled: Boolean(bookingId),
  });

  const rentQuery = useQuery({
    queryKey: ['booking-rent', bookingId],
    queryFn: () => customerOpsApi.getRentSchedule(bookingId),
    enabled: Boolean(bookingId && bookingQuery.data?.stayType === 'LONG_STAY'),
  });

  const depositQuery = useQuery({
    queryKey: ['booking-deposit', bookingId],
    queryFn: () => customerOpsApi.getDeposit(bookingId),
    enabled: Boolean(bookingId && (bookingQuery.data?.depositAmount ?? 0) > 0),
  });

  const refreshAll = () => {
    void qc.invalidateQueries({ queryKey: ['booking-detail', bookingId] });
    void qc.invalidateQueries({ queryKey: ['booking-history', bookingId] });
    void qc.invalidateQueries({ queryKey: ['booking-rent', bookingId] });
    void qc.invalidateQueries({ queryKey: ['booking-deposit', bookingId] });
  };

  const cancelMutation = useMutation({
    mutationFn: () => bookingApi.cancel(bookingId, cancelReason || undefined),
    onSuccess: () => {
      pushToast('Booking cancelled', 'success');
      setCancelOpen(false);
      refreshAll();
    },
    onError: (e: Error) => pushToast(e.message, 'error'),
  });

  const extendMutation = useMutation({
    mutationFn: () => bookingApi.extend(bookingId, toIsoUtc(extendDate)),
    onSuccess: () => {
      pushToast('Booking extended successfully', 'success');
      setExtendDate('');
      refreshAll();
    },
    onError: (e: Error) => pushToast(e.message, 'error'),
  });

  const transitionMutation = useMutation({
    mutationFn: () => bookingApi.transitionLongStay(bookingId, toIsoUtc(extendDate)),
    onSuccess: () => {
      pushToast('Long-stay transition requested (awaiting owner approval)', 'success');
      refreshAll();
    },
    onError: (e: Error) => pushToast(e.message, 'error'),
  });

  const payPendingMutation = useMutation({
    mutationFn: async () => {
      const p = await paymentApi.initiate(bookingId, 'UPI', `retry-${bookingId}-${Date.now()}`);
      return paymentApi.verify(p.id, { providerTransactionId: `txn_${Date.now()}`, simulateFailure: false });
    },
    onSuccess: () => {
      pushToast('Payment succeeded', 'success');
      refreshAll();
    },
    onError: (e: Error) => pushToast(e.message, 'error'),
  });

  const reviewMutation = useMutation({
    mutationFn: () => customerOpsApi.createReview({ bookingId, rating, comment }),
    onSuccess: () => {
      pushToast('Review submitted!', 'success');
      setComment('');
    },
    onError: (e: Error) => pushToast(e.message, 'error'),
  });

  const failureMutation = useMutation({
    mutationFn: () => bookingApi.reportFailure(bookingId, { failureReason, description: failureDesc }),
    onSuccess: (res) => {
      setFailureResult({ failureId: res.failure.id, alternatives: res.alternatives });
      pushToast('Issue reported. Review available alternatives or request refund.', 'info');
    },
    onError: (e: Error) => pushToast(e.message, 'error'),
  });

  if (bookingQuery.isLoading) return <div className="glass-panel h-72 animate-pulse rounded-2xl" />;
  if (bookingQuery.isError || !bookingQuery.data) {
    return <ErrorState message={(bookingQuery.error as Error)?.message ?? 'Booking not found'} onRetry={() => void bookingQuery.refetch()} />;
  }

  const b = bookingQuery.data;
  const canCancel = b.bookingStatus === 'PENDING' || b.bookingStatus === 'CONFIRMED';
  const canModifyOrExtend = b.bookingStatus === 'PENDING' || b.bookingStatus === 'CONFIRMED';

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs text-cyan-300">{b.bookingReference}</p>
            <h1 className="mt-1 text-2xl font-bold text-white">{b.propertyName}</h1>
            <p className="text-sm text-slate-400">
              Room {b.roomNumber} · Bed {b.bedNumber} · {b.stayType.replace('_', ' ')}
            </p>
          </div>
          <StatusBadge status={b.bookingStatus} />
        </div>

        <div className="mt-5 grid gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm sm:grid-cols-4">
          <div><p className="text-xs text-slate-400">Check-in</p><p className="font-medium text-white">{formatIST(b.checkIn)}</p></div>
          <div><p className="text-xs text-slate-400">Check-out</p><p className="font-medium text-white">{formatIST(b.checkOut)}</p></div>
          <div><p className="text-xs text-slate-400">Total Amount</p><p className="font-bold text-white">{formatINR(b.totalAmount)}</p></div>
          <div><p className="text-xs text-slate-400">Paid / Refunded</p><p className="font-medium text-emerald-300">{formatINR(b.amountPaid)} / {formatINR(b.refundAmount)}</p></div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          {(b.bookingStatus === 'PENDING' || b.bookingStatus === 'CONFIRMED') && !b.approvalRequired && b.amountPaid < b.totalAmount && (
            <button
              type="button"
              disabled={payPendingMutation.isPending}
              onClick={() => payPendingMutation.mutate()}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
            >
              {payPendingMutation.isPending
                ? 'Processing...'
                : `${b.bookingStatus === 'CONFIRMED' ? 'Pay Remaining Balance' : 'Complete Payment'} (${formatINR(b.totalAmount - b.amountPaid)})`}
            </button>
          )}
          {b.bookingStatus === 'CONFIRMED' && (
            <button
              type="button"
              onClick={() => void bookingApi.confirmCheckIn(b.id).then(() => { pushToast('Check-in confirmed', 'success'); refreshAll(); }).catch((e: Error) => pushToast(e.message, 'error'))}
              className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Confirm My Check-In
            </button>
          )}
          {canCancel && (
            <button
              type="button"
              onClick={() => setCancelOpen(true)}
              className="rounded-xl border border-rose-500/40 px-4 py-2 text-sm font-medium text-rose-300 hover:bg-rose-500/10"
            >
              Cancel Booking
            </button>
          )}
        </div>
      </div>

      {/* Extend / Transition */}
      {canModifyOrExtend && (
        <div className="glass-panel rounded-2xl p-6">
          <h2 className="text-base font-semibold text-white">Extend Stay or Transition to Long-Stay</h2>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="ext-date" className="block text-xs text-slate-400">New Check-out Time</label>
              <input id="ext-date" type="datetime-local" value={extendDate} onChange={(e) => setExtendDate(e.target.value)} className="mt-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
            </div>
            <button
              type="button"
              disabled={!extendDate || extendMutation.isPending}
              onClick={() => extendMutation.mutate()}
              className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              Extend Stay
            </button>
            {b.stayType === 'SHORT_STAY' && (
              <button
                type="button"
                disabled={!extendDate || transitionMutation.isPending}
                onClick={() => transitionMutation.mutate()}
                className="rounded-xl border border-indigo-400/40 px-4 py-2 text-sm font-medium text-indigo-300 disabled:opacity-40"
              >
                Convert to Long-Stay
              </button>
            )}
          </div>
        </div>
      )}

      {/* Long-stay Rent Schedule */}
      {b.stayType === 'LONG_STAY' && (
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Monthly Rent Schedule</h2>
            {(!rentQuery.data || rentQuery.data.length === 0) && (
              <button
                type="button"
                onClick={() => void customerOpsApi.generateRentSchedule(b.id).then(() => { pushToast('Rent schedule generated', 'success'); refreshAll(); })}
                className="rounded-xl bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white"
              >
                Generate Schedule
              </button>
            )}
          </div>
          {rentQuery.data && rentQuery.data.length > 0 && (
            <div className="mt-4 space-y-2">
              {rentQuery.data.map((rs) => (
                <div key={rs.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-sm">
                  <div>
                    <span className="font-medium text-white">Installment #{rs.installmentNumber}</span>
                    <span className="ml-2 text-xs text-slate-400">Due {rs.dueDate}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-300">Paid {formatINR(rs.amountPaid)} / {formatINR(rs.amountDue)}</span>
                    <StatusBadge status={rs.status} />
                    {rs.amountPaid < rs.amountDue && (
                      <button
                        type="button"
                        onClick={() => void customerOpsApi.payRent(rs.id, rs.amountDue - rs.amountPaid).then(() => { pushToast('Rent paid', 'success'); refreshAll(); })}
                        className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white"
                      >
                        Pay Due
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Security Deposit */}
      {b.depositAmount > 0 && depositQuery.data && (
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-white">Security Deposit</h2>
              <p className="text-xs text-slate-400">
                Held: {formatINR(depositQuery.data.depositAmount)} · Deducted: {formatINR(depositQuery.data.deductedAmount)} · Refunded: {formatINR(depositQuery.data.refundedAmount)}
              </p>
            </div>
            <StatusBadge status={depositQuery.data.status} />
          </div>
          <div className="mt-4 flex gap-3">
            {depositQuery.data.status === 'HELD' && (
              <button
                type="button"
                onClick={() => void customerOpsApi.requestDepositRefund(b.id).then(() => { pushToast('Deposit refund requested', 'success'); refreshAll(); })}
                className="rounded-xl bg-cyan-600 px-3.5 py-2 text-xs font-semibold text-white"
              >
                Request Deposit Refund
              </button>
            )}
            {depositQuery.data.deductedAmount > 0 && !depositQuery.data.disputed && (
              <button
                type="button"
                onClick={() => void customerOpsApi.disputeDeposit(b.id).then(() => { pushToast('Deduction disputed', 'info'); refreshAll(); })}
                className="rounded-xl border border-rose-500/40 px-3.5 py-2 text-xs font-medium text-rose-300"
              >
                Dispute Deduction
              </button>
            )}
          </div>
        </div>
      )}

      {/* Arrival Failure / Alternative Accommodation */}
      {b.bookingStatus === 'CONFIRMED' && (
        <div className="glass-panel rounded-2xl p-6">
          <h2 className="text-base font-semibold text-white">Bed Unavailable on Arrival?</h2>
          <p className="mt-1 text-xs text-slate-400">Report an arrival fulfillment failure to find verified alternatives or request a full refund.</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <select value={failureReason} onChange={(e) => setFailureReason(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white">
              <option value="BED_UNAVAILABLE">Bed Unavailable</option>
              <option value="CHECKIN_DENIED">Check-in Denied</option>
              <option value="PROPERTY_CLOSED">Property Closed</option>
              <option value="PROPERTY_ISSUE">Property Issue</option>
            </select>
            <input value={failureDesc} onChange={(e) => setFailureDesc(e.target.value)} placeholder="Brief details..." className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
            <button type="button" onClick={() => failureMutation.mutate()} className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white">
              Report &amp; Find Alternatives
            </button>
          </div>
          {failureResult && (
            <div className="mt-4 space-y-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs">
              <p className="font-semibold text-amber-200">Found {failureResult.alternatives.length} alternatives in {b.propertyName.split(' ')[0]} area:</p>
              <button
                type="button"
                onClick={() => void bookingApi.respondFailure(failureResult.failureId, { accepted: false }).then(() => { pushToast('Full refund initiated', 'success'); refreshAll(); })}
                className="rounded-lg bg-rose-600 px-3 py-1.5 font-semibold text-white"
              >
                Reject Alternatives &amp; Request Full Refund
              </button>
            </div>
          )}
        </div>
      )}

      {/* Review submission for COMPLETED bookings */}
      {b.bookingStatus === 'COMPLETED' && (
        <div className="glass-panel rounded-2xl p-6">
          <h2 className="text-base font-semibold text-white">Rate Your Stay</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white">
              {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} Stars</option>)}
            </select>
            <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your experience..." className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
            <button type="button" onClick={() => reviewMutation.mutate()} className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white">
              Submit Review
            </button>
          </div>
        </div>
      )}

      {/* History */}
      {historyQuery.data && historyQuery.data.length > 0 && (
        <div className="glass-panel rounded-2xl p-6">
          <h2 className="text-base font-semibold text-white">Status History</h2>
          <ul className="mt-3 space-y-2 text-xs text-slate-300">
            {historyQuery.data.map((h) => (
              <li key={h.id} className="flex justify-between border-b border-slate-800/60 pb-2">
                <span>{h.fromStatus ?? 'NEW'} → {h.toStatus} {h.reason ? `(${h.reason})` : ''}</span>
                <span className="text-slate-400">{formatIST(h.createdAt)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ConfirmDialog
        open={cancelOpen}
        title="Cancel this booking?"
        description="Cancellation fees depend on the property's free-cancellation window before check-in."
        confirmLabel="Confirm Cancellation"
        tone="danger"
        loading={cancelMutation.isPending}
        onConfirm={() => cancelMutation.mutate()}
        onCancel={() => setCancelOpen(false)}
      />
    </div>
  );
}
