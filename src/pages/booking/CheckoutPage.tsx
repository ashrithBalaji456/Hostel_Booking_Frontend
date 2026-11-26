import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { bookingApi, paymentApi } from '../../api/endpoints';
import { ApiClientError } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SelectDropdown } from '../../components/ui/SelectDropdown';
import { formatINR, formatIST } from '../../utils/format';
import type { BookingResponse, PaymentMethod, PaymentResponse, StayType } from '../../types/api';

const guestSchema = z.object({
  guestName: z.string().min(2, 'Guest name is required'),
  guestPhone: z.string().regex(/^(\+91)?[6-9]\d{9}$/, 'Enter a valid Indian phone number'),
  requestOwnerApproval: z.boolean().default(false),
  acceptedTerms: z.literal(true, { errorMap: () => ({ message: 'You must accept the booking terms' }) }),
});

type GuestForm = z.infer<typeof guestSchema>;

export function CheckoutPage() {
  const [params] = useSearchParams();
  const { user } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();

  const propertyId = params.get('propertyId') ?? '';
  const bedId = params.get('bedId') ?? '';
  const bedIds = (params.get('bedIds') ?? bedId).split(',').map((s) => s.trim()).filter(Boolean);
  const bedLabels = (params.get('bedLabels') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const propertyName = params.get('propertyName') ?? 'Selected Property';
  const roomNumber = params.get('roomNumber') ?? '';
  const bedNumber = params.get('bedNumber') ?? '';
  const checkIn = params.get('checkIn') ?? '';
  const checkOut = params.get('checkOut') ?? '';
  const stayType = (params.get('stayType') ?? 'SHORT_STAY') as StayType;
  const initialCouponCode = params.get('couponCode') ?? '';

  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const booking = bookings[0] ?? null;
  const [payments, setPayments] = useState<PaymentResponse[]>([]);
  const payment = payments[0] ?? null;
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [idempotencyKey] = useState(() => `web-${crypto.randomUUID()}`);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GuestForm>({
    resolver: zodResolver(guestSchema),
    defaultValues: {
      guestName: user?.fullName ?? '',
      guestPhone: user?.phoneNumber ?? '',
      requestOwnerApproval: false,
    },
  });

  const handleCreateBooking = async (values: GuestForm) => {
    setErrorMsg(null);
    try {
      const createdList: BookingResponse[] = [];
      for (const targetBedId of bedIds) {
        const created = await bookingApi.create({
          propertyId,
          bedId: targetBedId,
          checkIn,
          checkOut,
          stayType,
          guestName: values.guestName,
          guestPhone: values.guestPhone,
          requestOwnerApproval: values.requestOwnerApproval,
          ...(initialCouponCode ? { couponCode: initialCouponCode } : {}),
        });
        createdList.push(created);
      }
      setBookings(createdList);
      pushToast(
        createdList.length > 1
          ? `${createdList.length} bed reservations created!`
          : `Reservation created (${createdList[0].bookingReference})`,
        'success',
      );
    } catch (err) {
      setErrorMsg(err instanceof ApiClientError ? err.message : 'Unable to create booking');
    }
  };

  const handlePay = async (simulateFailure: boolean) => {
    if (bookings.length === 0) return;
    setProcessingPayment(true);
    setErrorMsg(null);
    try {
      const verifiedList: PaymentResponse[] = [];
      const updatedList: BookingResponse[] = [];
      for (const b of bookings) {
        const initiated = await paymentApi.initiate(b.id, paymentMethod, `${idempotencyKey}-${b.id}`);
        const verified = await paymentApi.verify(initiated.id, {
          providerTransactionId: simulateFailure ? 'FAIL_MOCK_TXN' : `txn_${Date.now()}`,
          simulateFailure,
          failureReason: simulateFailure ? 'Simulated payment failure' : undefined,
        });
        verifiedList.push(verified);
        updatedList.push(await bookingApi.getById(b.id));
      }
      setPayments(verifiedList);
      setBookings(updatedList);

      if (verifiedList.every((v) => v.paymentStatus === 'SUCCESS')) {
        pushToast('Payment verified and booking(s) confirmed!', 'success');
      } else {
        pushToast('Payment failed. You can retry before hold expiry.', 'error');
      }
    } catch (err) {
      setErrorMsg(err instanceof ApiClientError ? err.message : 'Payment processing error');
    } finally {
      setProcessingPayment(false);
    }
  };

  if (!propertyId || bedIds.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 text-center">
        <div className="glass-panel rounded-2xl p-8">
          <p className="text-sm text-slate-300">No bed selected. Please select a property and bed first.</p>
          <button type="button" onClick={() => navigate('/search')} className="mt-4 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white">
            Browse Properties
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-white">Booking &amp; Checkout</h1>
      <p className="mt-1 text-sm text-slate-400">
        {propertyName} · {bedLabels.length > 0 ? bedLabels.join(', ') : `Room ${roomNumber} · Bed ${bedNumber}`}
      </p>

      {errorMsg && (
        <div role="alert" className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
          {errorMsg}
        </div>
      )}

      {!booking ? (
        <form onSubmit={handleSubmit(handleCreateBooking)} className="glass-panel mt-6 space-y-5 rounded-2xl p-6">
          <div className="grid gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm sm:grid-cols-3">
            <div>
              <p className="text-xs text-slate-400">Check-in (IST)</p>
              <p className="font-medium text-white">{formatIST(checkIn)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Check-out (IST)</p>
              <p className="font-medium text-white">{formatIST(checkOut)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Stay Type</p>
              <p className="font-medium text-cyan-300">{stayType.replace('_', ' ')}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="g-name" className="block text-sm font-medium text-slate-200">Guest Full Name</label>
              <input id="g-name" {...register('guestName')} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white" />
              {errors.guestName && <p className="mt-1 text-xs text-rose-400">{errors.guestName.message}</p>}
            </div>
            <div>
              <label htmlFor="g-phone" className="block text-sm font-medium text-slate-200">Guest Phone (+91)</label>
              <input id="g-phone" {...register('guestPhone')} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white" />
              {errors.guestPhone && <p className="mt-1 text-xs text-rose-400">{errors.guestPhone.message}</p>}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" {...register('requestOwnerApproval')} />
            Request owner approval before payment
          </label>

          <label className="flex items-start gap-2 text-xs text-slate-300">
            <input type="checkbox" {...register('acceptedTerms')} className="mt-0.5" />
            <span>
              I agree to the property check-in/out rules, cancellation fee policy, and understand that unpaid holds expire automatically.
            </span>
          </label>
          {errors.acceptedTerms && <p className="text-xs text-rose-400">{errors.acceptedTerms.message}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isSubmitting ? 'Creating Reservation Hold...' : 'Lock Bed & Calculate Final Price'}
          </button>
        </form>
      ) : (
        <div className="glass-panel mt-6 space-y-6 rounded-2xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs text-slate-400">Booking Reference</p>
              <h2 className="text-xl font-bold text-white">{booking.bookingReference}</h2>
            </div>
            <StatusBadge status={booking.bookingStatus} />
          </div>

          <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm">
            <div className="flex justify-between"><span className="text-slate-400">Base Amount</span><span>{formatINR(booking.baseAmount)}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Security Deposit</span><span>{formatINR(booking.depositAmount)}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Extra Charges</span><span>{formatINR(booking.extraCharges)}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Discount</span><span className="text-emerald-300">-{formatINR(booking.discountAmount)}</span></div>
            <div className="flex justify-between border-t border-slate-800 pt-2 text-base font-bold text-white">
              <span>Total Payable ({bookings.length} Bed{bookings.length > 1 ? 's' : ''})</span>
              <span>{formatINR(bookings.reduce((sum, b) => sum + b.totalAmount, 0))}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>Amount Paid</span>
              <span>{formatINR(bookings.reduce((sum, b) => sum + b.amountPaid, 0))}</span>
            </div>
          </div>
          {bookings.length > 1 && (
            <div className="space-y-1 rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-300">
              {bookings.map((b) => (
                <div key={b.id} className="flex justify-between">
                  <span className="font-mono text-cyan-300">{b.bookingReference} · Bed {b.bedNumber}</span>
                  <span>{formatINR(b.totalAmount)} · {b.bookingStatus}</span>
                </div>
              ))}
            </div>
          )}

          {booking.approvalRequired && booking.bookingStatus === 'PENDING' && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
              Awaiting property owner approval. Once approved, you can complete payment from your Bookings page.
            </div>
          )}

          {!booking.approvalRequired && booking.bookingStatus === 'PENDING' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="pay-method" className="block text-sm font-medium text-slate-200">Payment Method</label>
                <SelectDropdown
                  id="pay-method"
                  ariaLabel="Payment Method"
                  value={paymentMethod}
                  onChange={(val) => setPaymentMethod(val)}
                  className="mt-1"
                  buttonClassName="py-2.5"
                  options={[
                    { value: 'UPI', label: 'UPI' },
                    { value: 'CARD', label: 'Card' },
                    { value: 'NETBANKING', label: 'NetBanking' },
                    { value: 'WALLET', label: 'Wallet' },
                  ]}
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={processingPayment}
                  onClick={() => void handlePay(false)}
                  className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  {processingPayment
                    ? 'Verifying Payment...'
                    : `Pay ${formatINR(bookings.reduce((sum, b) => sum + b.totalAmount, 0))}`}
                </button>
                <button
                  type="button"
                  disabled={processingPayment}
                  onClick={() => void handlePay(true)}
                  className="rounded-xl border border-rose-500/40 px-4 py-3 text-xs font-medium text-rose-300 hover:bg-rose-500/10"
                >
                  Simulate Failure
                </button>
              </div>
            </div>
          )}

          {payment && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-300">
              Payment Ref: <span className="font-mono text-white">{payment.paymentReference}</span> · Status:{' '}
              <StatusBadge status={payment.paymentStatus} />
            </div>
          )}

          <button
            type="button"
            onClick={() => navigate(bookings.length > 1 ? '/account/bookings' : `/account/bookings/${booking.id}`)}
            className="w-full rounded-xl border border-slate-700 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-800"
          >
            {bookings.length > 1 ? 'View All Bookings' : 'View Booking Details'}
          </button>
        </div>
      )}
    </div>
  );
}
