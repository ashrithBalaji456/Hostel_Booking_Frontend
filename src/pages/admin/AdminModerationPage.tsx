import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, customerOpsApi } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatIST } from '../../utils/format';

export function AdminModerationPage() {
  const { pushToast } = useToast();
  const qc = useQueryClient();

  const [ticketStatusFilter, setTicketStatusFilter] = useState<string>('');
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [resolutionMap, setResolutionMap] = useState<Record<string, string>>({});
  const [replyText, setReplyText] = useState('');

  const ticketsQuery = useQuery({
    queryKey: ['admin-tickets', ticketStatusFilter],
    queryFn: () =>
      adminApi.listSupportTickets({
        ...(ticketStatusFilter ? { status: ticketStatusFilter } : {}),
        page: 0,
        size: 30,
      }),
  });
  const ticketMessagesQuery = useQuery({
    queryKey: ['admin-ticket-messages', activeTicketId],
    queryFn: () => customerOpsApi.getTicketMessages(activeTicketId!),
    enabled: Boolean(activeTicketId),
  });
  const disputesQuery = useQuery({ queryKey: ['admin-disputes'], queryFn: () => adminApi.listDisputes({ page: 0, size: 15 }) });
  const safetyQuery = useQuery({ queryKey: ['admin-safety'], queryFn: () => adminApi.listSafetyComplaints({ page: 0, size: 15 }) });

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-white">Support Tickets (Guests &amp; Owners)</h1>
            <p className="text-xs text-slate-400">
              Every new ticket raised by a guest or property owner appears here with full contact and issue details.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 text-xs">
            {[
              { value: '', label: 'All' },
              { value: 'OPEN', label: 'Open' },
              { value: 'IN_PROGRESS', label: 'In Progress' },
              { value: 'RESOLVED', label: 'Resolved' },
            ].map((tab) => (
              <button
                key={tab.value || 'ALL'}
                type="button"
                onClick={() => setTicketStatusFilter(tab.value)}
                className={`rounded-lg border px-3 py-1.5 font-medium transition ${
                  ticketStatusFilter === tab.value
                    ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                    : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {ticketsQuery.data?.content.length === 0 && (
            <p className="text-xs text-slate-400">No support tickets found.</p>
          )}
          {ticketsQuery.data?.content.map((t) => {
            const isExpanded = activeTicketId === t.id;
            const resolutionValue = resolutionMap[t.id] ?? t.resolution ?? '';
            return (
              <div key={t.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-cyan-300">{t.ticketReference}</span>
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-200">
                        {t.category.replace(/_/g, ' ')}
                      </span>
                      {t.userRole && (
                        <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[11px] font-medium text-indigo-200">
                          {t.userRole.replace('_', ' ')}
                        </span>
                      )}
                      <StatusBadge status={t.status} />
                    </div>
                    <h3 className="text-sm font-semibold text-white">{t.subject}</h3>
                    <p className="text-slate-300">
                      From: <span className="font-medium text-white">{t.userName ?? 'User'}</span>
                      {t.userEmail ? ` · ${t.userEmail}` : ''}
                      {t.userPhone ? ` · ${t.userPhone}` : ''}
                    </p>
                    {(t.bookingReference || t.propertyName) && (
                      <p className="text-slate-400">
                        {t.propertyName ? `Property: ${t.propertyName}` : ''}
                        {t.propertyName && t.bookingReference ? ' · ' : ''}
                        {t.bookingReference ? `Booking: ${t.bookingReference}` : ''}
                      </p>
                    )}
                    {t.initialMessage && (
                      <p className="mt-1 rounded-lg border border-slate-800 bg-slate-950/70 p-2.5 text-slate-200">
                        {t.initialMessage}
                      </p>
                    )}
                    {t.resolution && (
                      <p className="text-emerald-300">Resolution: {t.resolution}</p>
                    )}
                    <p className="text-[11px] text-slate-500">Created: {formatIST(t.createdAt)}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTicketId(isExpanded ? null : t.id)}
                      className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-slate-200 hover:border-cyan-400/50"
                    >
                      {isExpanded ? 'Hide Thread' : 'Messages & Reply'}
                    </button>
                    {t.status === 'OPEN' && (
                      <button
                        type="button"
                        onClick={() =>
                          void adminApi
                            .updateSupportTicket(t.id, 'IN_PROGRESS', resolutionValue || undefined)
                            .then(() => {
                              pushToast('Ticket marked In Progress', 'info');
                              void qc.invalidateQueries({ queryKey: ['admin-tickets'] });
                            })
                        }
                        className="rounded-lg bg-amber-600 px-3 py-1.5 font-medium text-white hover:bg-amber-500"
                      >
                        In Progress
                      </button>
                    )}
                    {t.status !== 'RESOLVED' && (
                      <button
                        type="button"
                        onClick={() =>
                          void adminApi
                            .updateSupportTicket(t.id, 'RESOLVED', resolutionValue.trim() || 'Resolved by admin team')
                            .then(() => {
                              pushToast('Ticket marked Resolved', 'success');
                              void qc.invalidateQueries({ queryKey: ['admin-tickets'] });
                            })
                        }
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 font-semibold text-white hover:bg-emerald-500"
                      >
                        Mark Resolved
                      </button>
                    )}
                  </div>
                </div>

                {t.status !== 'RESOLVED' && (
                  <div className="mt-3">
                    <input
                      type="text"
                      value={resolutionValue}
                      onChange={(e) => setResolutionMap((prev) => ({ ...prev, [t.id]: e.target.value }))}
                      placeholder="Add resolution note for guest/owner before marking resolved..."
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder:text-slate-500"
                    />
                  </div>
                )}

                {isExpanded && (
                  <div className="mt-3 space-y-2 border-t border-slate-800 pt-3">
                    {ticketMessagesQuery.data?.map((m) => (
                      <div key={m.id} className="rounded-lg bg-slate-950 p-2.5 text-xs">
                        <p className="text-slate-200">{m.message}</p>
                        <p className="mt-1 text-[10px] text-slate-500">{formatIST(m.createdAt)}</p>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <input
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Reply to user..."
                        className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
                      />
                      <button
                        type="button"
                        disabled={!replyText.trim()}
                        onClick={() =>
                          void customerOpsApi.replyTicket(t.id, replyText).then(() => {
                            setReplyText('');
                            pushToast('Reply sent', 'success');
                            void qc.invalidateQueries({ queryKey: ['admin-ticket-messages', t.id] });
                          })
                        }
                        className="rounded-lg bg-cyan-600 px-3 py-1.5 font-semibold text-white hover:bg-cyan-500 disabled:opacity-50"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white">Safety Complaints</h2>
        <div className="mt-4 space-y-2">
          {safetyQuery.data?.content.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs">
              <div>
                <span className="font-mono text-rose-300">{s.complaintReference}</span> · {s.category}
                <p className="text-slate-200">{s.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={s.status} />
                {s.status !== 'RESOLVED' && (
                  <button
                    type="button"
                    onClick={() => void adminApi.resolveSafetyComplaint(s.id, 'RESOLVED', 'Investigated and actioned', 'Reviewed by admin', false).then(() => { pushToast('Complaint resolved', 'success'); void qc.invalidateQueries({ queryKey: ['admin-safety'] }); })}
                    className="rounded-lg bg-emerald-600 px-3 py-1 text-white"
                  >
                    Resolve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white">Booking Disputes</h2>
        <div className="mt-4 space-y-2">
          {disputesQuery.data?.content.map((d) => (
            <div key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs">
              <div>
                <span className="font-mono text-amber-300">{d.disputeReference}</span> · {d.category}
                <p className="text-slate-200">{d.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={d.status} />
                {d.status !== 'CLOSED' && (
                  <button
                    type="button"
                    onClick={() => void adminApi.resolveDispute(d.id, 'RESOLVED', 'Resolved by admin', 'Reviewed').then(() => { pushToast('Dispute resolved', 'success'); void qc.invalidateQueries({ queryKey: ['admin-disputes'] }); })}
                    className="rounded-lg bg-cyan-600 px-3 py-1 text-white"
                  >
                    Resolve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
