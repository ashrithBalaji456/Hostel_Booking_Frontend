import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, paymentApi } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SelectDropdown } from '../../components/ui/SelectDropdown';
import { formatINR } from '../../utils/format';

export function AdminFinancePage() {
  const { pushToast } = useToast();
  const qc = useQueryClient();
  const [ownerId, setOwnerId] = useState('');
  const [commissionPct, setCommissionPct] = useState('10');
  const [payoutId, setPayoutId] = useState('');
  const [settlementRef, setSettlementRef] = useState('');

  const bookingsQuery = useQuery({ queryKey: ['admin-bookings'], queryFn: () => adminApi.listBookings({ page: 0, size: 15 }) });
  const paymentsQuery = useQuery({ queryKey: ['admin-payments'], queryFn: () => adminApi.listPayments({ page: 0, size: 15 }) });

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="glass-panel rounded-2xl p-5">
          <h2 className="text-base font-semibold text-white">Configure Owner Commission %</h2>
          <div className="mt-3 space-y-2">
            <input value={ownerId} onChange={(e) => setOwnerId(e.target.value)} placeholder="Owner UUID" className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
            <input type="number" value={commissionPct} onChange={(e) => setCommissionPct(e.target.value)} placeholder="Commission %" className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
            <button type="button" onClick={() => void adminApi.setCommission(ownerId, Number(commissionPct)).then(() => pushToast('Commission updated', 'success')).catch((e: Error) => pushToast(e.message, 'error'))} className="rounded-xl bg-cyan-600 px-4 py-2 text-xs font-semibold text-white">
              Save Commission
            </button>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5">
          <h2 className="text-base font-semibold text-white">Settle Owner Payout</h2>
          <div className="mt-3 space-y-2">
            <input value={payoutId} onChange={(e) => setPayoutId(e.target.value)} placeholder="Payout UUID" className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
            <input value={settlementRef} onChange={(e) => setSettlementRef(e.target.value)} placeholder="UTR / Bank Settlement Reference" className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
            <button type="button" onClick={() => void adminApi.settlePayout(payoutId, settlementRef).then(() => pushToast('Payout settled', 'success')).catch((e: Error) => pushToast(e.message, 'error'))} className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white">
              Mark Settled
            </button>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white">Platform Payments &amp; Refunds</h2>
        <div className="mt-4 space-y-2">
          {paymentsQuery.data?.content.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs">
              <div>
                <span className="font-mono text-cyan-300">{p.paymentReference}</span> · Booking {p.bookingReference}
                <p className="text-slate-300">Amount: {formatINR(p.amount)} · Refunded: {formatINR(p.refundAmount)}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={p.paymentStatus} />
                {p.paymentStatus === 'SUCCESS' && (
                  <button
                    type="button"
                    onClick={() => void paymentApi.refund(p.id).then(() => { pushToast('Refund processed', 'success'); void qc.invalidateQueries({ queryKey: ['admin-payments'] }); }).catch((e: Error) => pushToast(e.message, 'error'))}
                    className="rounded-lg bg-rose-600 px-2.5 py-1 text-white"
                  >
                    Full Refund
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white">All Platform Bookings</h2>
        <div className="mt-4 space-y-2">
          {bookingsQuery.data?.content.map((b) => (
            <div key={b.id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs">
              <span>{b.bookingReference} · {b.propertyName} · {b.guestName} · {formatINR(b.totalAmount)}</span>
              <StatusBadge status={b.bookingStatus} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AdminCouponsPage() {
  const { pushToast } = useToast();
  const qc = useQueryClient();
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('10');

  const couponsQuery = useQuery({ queryKey: ['admin-coupons'], queryFn: () => adminApi.listCoupons(0, 20) });

  const createMutation = useMutation({
    mutationFn: () =>
      adminApi.createCoupon({
        code,
        discountType,
        discountValue: Number(discountValue),
        minBookingAmount: 100,
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 30 * 86400 * 1000).toISOString(),
        perCustomerLimit: 1,
      }),
    onSuccess: () => {
      pushToast('Coupon created', 'success');
      setCode('');
      void qc.invalidateQueries({ queryKey: ['admin-coupons'] });
    },
    onError: (e: Error) => pushToast(e.message, 'error'),
  });

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-2xl p-6">
        <h1 className="text-xl font-bold text-white">Create Coupon</h1>
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="mt-4 grid gap-3 sm:grid-cols-4">
          <input required value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code (e.g. STUDENT10)" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
          <SelectDropdown
            ariaLabel="Discount Type"
            value={discountType}
            onChange={(val) => setDiscountType(val)}
            options={[
              { value: 'PERCENTAGE', label: 'Percentage' },
              { value: 'FIXED', label: 'Fixed ₹' },
            ]}
          />
          <input required type="number" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
          <button type="submit" className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white">Create</button>
        </form>
      </div>

      <div className="glass-panel rounded-2xl p-6">
        <h2 className="text-base font-semibold text-white">Coupons</h2>
        <div className="mt-3 space-y-2">
          {couponsQuery.data?.content.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs">
              <span><strong>{c.code}</strong> · {c.discountType} {c.discountValue} · Used {c.usedCount}</span>
              <button
                type="button"
                onClick={() => void adminApi.toggleCoupon(c.id, !c.active).then(() => void qc.invalidateQueries({ queryKey: ['admin-coupons'] }))}
                className={`rounded-lg px-3 py-1 font-semibold ${c.active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}
              >
                {c.active ? 'Active' : 'Inactive'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
