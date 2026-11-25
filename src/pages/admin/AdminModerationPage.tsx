import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from '../../components/ui/StatusBadge';

export function AdminModerationPage() {
  const { pushToast } = useToast();
  const qc = useQueryClient();

  const ticketsQuery = useQuery({ queryKey: ['admin-tickets'], queryFn: () => adminApi.listSupportTickets({ page: 0, size: 15 }) });
  const disputesQuery = useQuery({ queryKey: ['admin-disputes'], queryFn: () => adminApi.listDisputes({ page: 0, size: 15 }) });
  const safetyQuery = useQuery({ queryKey: ['admin-safety'], queryFn: () => adminApi.listSafetyComplaints({ page: 0, size: 15 }) });

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-2xl p-6">
        <h1 className="text-xl font-bold text-white">Safety Complaints</h1>
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

      <div className="glass-panel rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white">Support Tickets</h2>
        <div className="mt-4 space-y-2">
          {ticketsQuery.data?.content.map((t) => (
            <div key={t.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs">
              <div>
                <span className="font-mono text-cyan-300">{t.ticketReference}</span> · {t.subject}
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={t.status} />
                {t.status !== 'RESOLVED' && (
                  <button
                    type="button"
                    onClick={() => void adminApi.updateSupportTicket(t.id, 'RESOLVED', 'Resolved via admin console').then(() => { pushToast('Ticket resolved', 'success'); void qc.invalidateQueries({ queryKey: ['admin-tickets'] }); })}
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
    </div>
  );
}
