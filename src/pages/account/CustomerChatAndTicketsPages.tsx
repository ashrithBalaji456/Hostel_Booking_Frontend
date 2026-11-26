import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Shield, Wrench } from 'lucide-react';
import { chatApi, hostelTicketApi, propertyApi } from '../../api/endpoints';
import { WhatsAppChatPanel } from '../../components/chat/WhatsAppChatPanel';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useToast } from '../../context/ToastContext';
import { formatIST } from '../../utils/format';

export function CustomerChatPage() {
  const [params] = useSearchParams();
  const propertyId = params.get('propertyId');
  const [initialConvId, setInitialConvId] = useState<string | null>(null);

  useEffect(() => {
    if (!propertyId) return;
    void chatApi.startConversation(propertyId).then((conv) => setInitialConvId(conv.id));
  }, [propertyId]);

  return (
    <div className="space-y-4">
      <WhatsAppChatPanel mode="customer" initialConversationId={initialConvId} />
    </div>
  );
}

export function CustomerHostelTicketsPage() {
  const [params] = useSearchParams();
  const { pushToast } = useToast();
  const qc = useQueryClient();

  const [propertyId, setPropertyId] = useState(params.get('propertyId') ?? '');
  const [category, setCategory] = useState('MAINTENANCE');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [anonymous, setAnonymous] = useState(false);

  const propsQuery = useQuery({
    queryKey: ['customer-ticket-properties'],
    queryFn: () => propertyApi.search({ size: 50, verifiedOnly: true }),
  });
  const myTicketsQuery = useQuery({
    queryKey: ['my-hostel-tickets'],
    queryFn: hostelTicketApi.listMine,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      hostelTicketApi.create({
        propertyId,
        category,
        subject,
        description,
        anonymous,
      }),
    onSuccess: (res) => {
      pushToast(`Hostel ticket ${res.ticketReference} sent to owner`, 'success');
      setSubject('');
      setDescription('');
      void qc.invalidateQueries({ queryKey: ['my-hostel-tickets'] });
    },
    onError: (e: Error) => pushToast(e.message, 'error'),
  });

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-2xl p-6">
        <h1 className="flex items-center gap-2 text-xl font-bold text-white">
          <Wrench className="h-5 w-5 text-cyan-400" />
          Raise Hostel / Hotel Issue Ticket to Owner
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Report room maintenance, Wi-Fi, water, food, or housekeeping issues directly to the property owner. You can also submit anonymously.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="mt-4 space-y-3"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              required
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
            >
              <option value="">Select Hostel / Hotel…</option>
              {propsQuery.data?.content.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.city})
                </option>
              ))}
            </select>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
            >
              <option value="MAINTENANCE">Room / Maintenance</option>
              <option value="WIFI">Wi-Fi / Internet</option>
              <option value="WATER">Water / Plumbing</option>
              <option value="ELECTRICITY">Electricity / AC</option>
              <option value="HOUSEKEEPING">Housekeeping / Cleanliness</option>
              <option value="FOOD">Food / Mess</option>
              <option value="NOISE">Noise / Discipline</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <input
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Issue Subject (e.g. AC not cooling in Room 101)"
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
          />
          <textarea
            required
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the problem..."
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
          />

          <label className="flex items-center gap-2 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              className="accent-cyan-400"
            />
            <Shield className="h-3.5 w-3.5 text-emerald-400" />
            <span>Submit Anonymously (your name &amp; room number will be hidden from the owner)</span>
          </label>

          <button
            type="submit"
            disabled={createMutation.isPending || !propertyId}
            className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-50"
          >
            {createMutation.isPending ? 'Submitting…' : 'Submit Hostel Ticket'}
          </button>
        </form>
      </div>

      <div className="space-y-3">
        {myTicketsQuery.data?.map((t) => (
          <div key={t.id} className="glass-panel rounded-2xl p-4 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-cyan-300">{t.ticketReference}</span>
                <span className="rounded bg-slate-800 px-2 py-0.5 text-slate-200">{t.propertyName}</span>
                <span className="rounded bg-slate-800 px-2 py-0.5 text-slate-300">{t.category}</span>
                {t.anonymous && (
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-emerald-300">Anonymous</span>
                )}
              </div>
              <StatusBadge status={t.status} />
            </div>
            <h2 className="mt-2 text-sm font-semibold text-white">{t.subject}</h2>
            <p className="mt-1 text-slate-300">{t.description}</p>
            {t.ownerResolution && (
              <p className="mt-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2 text-emerald-200">
                Owner Resolution: {t.ownerResolution}
              </p>
            )}
            <p className="mt-1.5 text-[11px] text-slate-500">Raised: {formatIST(t.createdAt)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
