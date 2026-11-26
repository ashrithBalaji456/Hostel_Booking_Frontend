import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Shield, Wrench } from 'lucide-react';
import { hostelTicketApi } from '../../api/endpoints';
import { WhatsAppChatPanel } from '../../components/chat/WhatsAppChatPanel';
import { TicketStatsChartCard } from '../../components/charts/TicketStatsChartCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useToast } from '../../context/ToastContext';
import { formatIST } from '../../utils/format';

export function OwnerChatsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Customer Chats</h1>
        <p className="text-sm text-slate-400">
          Private WhatsApp-style inbox for inquiries and active residents (showing room number beside resident names).
        </p>
      </div>
      <WhatsAppChatPanel mode="owner" />
    </div>
  );
}

export function OwnerHostelTicketsPage() {
  const { pushToast } = useToast();
  const qc = useQueryClient();
  const [resolutionMap, setResolutionMap] = useState<Record<string, string>>({});

  const ticketsQuery = useQuery({
    queryKey: ['owner-hostel-tickets'],
    queryFn: hostelTicketApi.listOwner,
  });
  const statsQuery = useQuery({
    queryKey: ['owner-hostel-ticket-stats'],
    queryFn: hostelTicketApi.getOwnerStats,
  });

  const handleUpdate = async (ticketId: string, status: string, resolution?: string) => {
    try {
      await hostelTicketApi.updateOwnerStatus(ticketId, status, resolution);
      pushToast(`Ticket updated to ${status}`, 'success');
      void qc.invalidateQueries({ queryKey: ['owner-hostel-tickets'] });
      void qc.invalidateQueries({ queryKey: ['owner-hostel-ticket-stats'] });
    } catch (e) {
      pushToast((e as Error).message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
          <Wrench className="h-6 w-6 text-cyan-400" />
          Resident Hostel Tickets
        </h1>
        <p className="text-sm text-slate-400">
          Manage maintenance &amp; resident issue tickets for your properties. Anonymous tickets hide student identity.
        </p>
      </div>

      <TicketStatsChartCard
        title="Hostel Ticket Analytics"
        subtitle="Tickets raised vs. closed/rectified across your properties"
        stats={statsQuery.data}
      />

      <div className="space-y-3">
        {ticketsQuery.data?.length === 0 && (
          <div className="glass-panel rounded-2xl p-6 text-sm text-slate-400">
            No resident tickets raised yet.
          </div>
        )}
        {ticketsQuery.data?.map((t) => {
          const resVal = resolutionMap[t.id] ?? t.ownerResolution ?? '';
          return (
            <div key={t.id} className="glass-panel rounded-2xl p-5 text-xs">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-cyan-300">{t.ticketReference}</span>
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-slate-200">{t.propertyName}</span>
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-slate-300">{t.category}</span>
                    {t.anonymous && (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-500/20 px-2 py-0.5 text-emerald-300">
                        <Shield className="h-3 w-3" /> Anonymous
                      </span>
                    )}
                    <StatusBadge status={t.status} />
                  </div>
                  <h2 className="text-sm font-semibold text-white">{t.subject}</h2>
                  <p className="text-slate-300">
                    From: <span className="font-medium text-white">{t.customerName}</span>
                    {t.roomNumber ? ` · Room ${t.roomNumber}${t.bedNumber ? ` (${t.bedNumber})` : ''}` : ''}
                    {t.customerPhone ? ` · ${t.customerPhone}` : ''}
                  </p>
                  <p className="mt-1 rounded-lg border border-slate-800 bg-slate-950/70 p-2.5 text-slate-200">
                    {t.description}
                  </p>
                  {t.ownerResolution && (
                    <p className="text-emerald-300">Resolution: {t.ownerResolution}</p>
                  )}
                  <p className="text-[11px] text-slate-500">Raised: {formatIST(t.createdAt)}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {t.status === 'OPEN' && (
                    <button
                      type="button"
                      onClick={() => void handleUpdate(t.id, 'IN_PROGRESS', resVal || undefined)}
                      className="rounded-lg bg-amber-600 px-3 py-1.5 font-medium text-white hover:bg-amber-500"
                    >
                      In Progress
                    </button>
                  )}
                  {t.status !== 'RESOLVED' && t.status !== 'CLOSED' && (
                    <button
                      type="button"
                      onClick={() => void handleUpdate(t.id, 'RESOLVED', resVal.trim() || 'Issue rectified by owner')}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 font-semibold text-white hover:bg-emerald-500"
                    >
                      Mark Rectified
                    </button>
                  )}
                </div>
              </div>

              {t.status !== 'RESOLVED' && t.status !== 'CLOSED' && (
                <div className="mt-3">
                  <input
                    type="text"
                    value={resVal}
                    onChange={(e) => setResolutionMap((prev) => ({ ...prev, [t.id]: e.target.value }))}
                    placeholder="Add rectification note for resident..."
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder:text-slate-500"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
