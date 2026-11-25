import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { customerOpsApi } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatIST } from '../../utils/format';

export function SupportPage() {
  const { pushToast } = useToast();
  const qc = useQueryClient();
  const [category, setCategory] = useState('BOOKING_ISSUE');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const ticketsQuery = useQuery({ queryKey: ['my-tickets'], queryFn: () => customerOpsApi.getTickets(0, 20) });
  const messagesQuery = useQuery({
    queryKey: ['ticket-messages', activeTicketId],
    queryFn: () => customerOpsApi.getTicketMessages(activeTicketId!),
    enabled: Boolean(activeTicketId),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      customerOpsApi.createTicket({
        bookingId: bookingId || undefined,
        category,
        subject,
        message,
      }),
    onSuccess: () => {
      pushToast('Support ticket created', 'success');
      setSubject('');
      setMessage('');
      void qc.invalidateQueries({ queryKey: ['my-tickets'] });
    },
    onError: (e: Error) => pushToast(e.message, 'error'),
  });

  const replyMutation = useMutation({
    mutationFn: () => customerOpsApi.replyTicket(activeTicketId!, replyText),
    onSuccess: () => {
      setReplyText('');
      void qc.invalidateQueries({ queryKey: ['ticket-messages', activeTicketId] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-2xl p-6">
        <h1 className="text-xl font-bold text-white">Customer Support</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="mt-4 space-y-3"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white">
              <option value="BOOKING_ISSUE">Booking Issue</option>
              <option value="PAYMENT_ISSUE">Payment Issue</option>
              <option value="REFUND_ISSUE">Refund Issue</option>
              <option value="PROPERTY_ISSUE">Property Issue</option>
              <option value="SAFETY_ISSUE">Safety Issue</option>
              <option value="OTHER">Other</option>
            </select>
            <input value={bookingId} onChange={(e) => setBookingId(e.target.value)} placeholder="Booking ID (optional)" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
          </div>
          <input required value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
          <textarea required rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Describe your issue..." className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
          <button type="submit" disabled={createMutation.isPending} className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white">
            Submit Ticket
          </button>
        </form>
      </div>

      <div className="space-y-3">
        {ticketsQuery.data?.content.map((t) => (
          <div key={t.id} className="glass-panel rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono text-xs text-cyan-300">{t.ticketReference}</span>
                <h2 className="text-sm font-semibold text-white">{t.subject}</h2>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={t.status} />
                <button type="button" onClick={() => setActiveTicketId(activeTicketId === t.id ? null : t.id)} className="rounded-lg bg-slate-800 px-3 py-1 text-xs text-slate-200">
                  {activeTicketId === t.id ? 'Hide Thread' : 'Messages'}
                </button>
              </div>
            </div>
            {activeTicketId === t.id && (
              <div className="mt-3 space-y-2 border-t border-slate-800 pt-3">
                {messagesQuery.data?.map((m) => (
                  <div key={m.id} className="rounded-lg bg-slate-900/80 p-2.5 text-xs text-slate-200">
                    <p>{m.message}</p>
                    <p className="mt-1 text-[10px] text-slate-500">{formatIST(m.createdAt)}</p>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Reply..." className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white" />
                  <button type="button" onClick={() => replyMutation.mutate()} className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white">Send</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DisputesPage() {
  const { pushToast } = useToast();
  const qc = useQueryClient();
  const [bookingId, setBookingId] = useState('');
  const [category, setCategory] = useState('INCORRECT_CHARGES');
  const [description, setDescription] = useState('');
  const [evidenceReferences, setEvidenceReferences] = useState('');

  const disputesQuery = useQuery({ queryKey: ['my-disputes'], queryFn: () => customerOpsApi.getDisputes(0, 20) });

  const createMutation = useMutation({
    mutationFn: () => customerOpsApi.createDispute({ bookingId, category, description, evidenceReferences: evidenceReferences || undefined }),
    onSuccess: () => {
      pushToast('Dispute raised', 'success');
      setDescription('');
      void qc.invalidateQueries({ queryKey: ['my-disputes'] });
    },
    onError: (e: Error) => pushToast(e.message, 'error'),
  });

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-2xl p-6">
        <h1 className="text-xl font-bold text-white">Booking Disputes</h1>
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input required value={bookingId} onChange={(e) => setBookingId(e.target.value)} placeholder="Booking UUID" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white">
              <option value="INCORRECT_CHARGES">Incorrect Charges</option>
              <option value="BED_NOT_AVAILABLE">Bed Not Available</option>
              <option value="CHECKIN_DENIED">Check-in Denied</option>
              <option value="REFUND_DELAY">Refund Delay</option>
              <option value="LISTING_MISMATCH">Listing Mismatch</option>
            </select>
          </div>
          <textarea required rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the dispute..." className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
          <input value={evidenceReferences} onChange={(e) => setEvidenceReferences(e.target.value)} placeholder="Evidence URLs / references (optional)" className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
          <button type="submit" disabled={createMutation.isPending} className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white">Raise Dispute</button>
        </form>
      </div>

      <div className="space-y-3">
        {disputesQuery.data?.content.map((d) => (
          <div key={d.id} className="glass-panel rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-cyan-300">{d.disputeReference} · {d.category}</span>
              <StatusBadge status={d.status} />
            </div>
            <p className="mt-2 text-sm text-slate-200">{d.description}</p>
            {d.resolution && <p className="mt-1 text-xs text-emerald-300">Resolution: {d.resolution}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SafetyPage() {
  const [params] = useSearchParams();
  const { pushToast } = useToast();
  const [propertyId, setPropertyId] = useState(params.get('propertyId') ?? '');
  const [bookingId, setBookingId] = useState('');
  const [category, setCategory] = useState('SAFETY_ISSUE');
  const [description, setDescription] = useState('');

  const submitMutation = useMutation({
    mutationFn: () =>
      customerOpsApi.submitSafetyComplaint({
        propertyId,
        bookingId: bookingId || undefined,
        category,
        description,
      }),
    onSuccess: (res) => {
      pushToast(`Private safety complaint filed (${res.complaintReference})`, 'success');
      setDescription('');
    },
    onError: (e: Error) => pushToast(e.message, 'error'),
  });

  return (
    <div className="glass-panel rounded-2xl p-6">
      <h1 className="text-xl font-bold text-white">Private Safety Complaint</h1>
      <p className="mt-1 text-xs text-slate-400">
        Safety complaints are strictly private and visible only to platform administrators—never exposed on public property pages.
      </p>
      <form onSubmit={(e) => { e.preventDefault(); submitMutation.mutate(); }} className="mt-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <input required value={propertyId} onChange={(e) => setPropertyId(e.target.value)} placeholder="Property UUID" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
          <input value={bookingId} onChange={(e) => setBookingId(e.target.value)} placeholder="Booking UUID (optional)" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white">
          <option value="SAFETY_ISSUE">Safety / Security Issue</option>
          <option value="HARASSMENT">Harassment / Misconduct</option>
          <option value="HYGIENE_HAZARD">Hygiene / Fire Hazard</option>
        </select>
        <textarea required rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the safety concern..." className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
        <button type="submit" disabled={submitMutation.isPending} className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white">
          Submit Private Report
        </button>
      </form>
    </div>
  );
}
