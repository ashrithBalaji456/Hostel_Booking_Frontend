import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { customerOpsApi } from '../../api/endpoints';
import { ErrorState } from '../../components/ui/ErrorState';
import { formatIST } from '../../utils/format';

export function NotificationsPage() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: () => customerOpsApi.getNotifications(0, 30),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => customerOpsApi.markNotificationRead(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  if (query.isLoading) return <div className="glass-panel h-48 animate-pulse rounded-2xl" />;
  if (query.isError) return <ErrorState message={(query.error as Error).message} onRetry={() => void query.refetch()} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-white">Notifications</h1>
        <span className="text-xs text-slate-400">
          Channel preferences API is not yet exposed by the backend (see API Matrix).
        </span>
      </div>
      {query.data?.content.length ? (
        <div className="space-y-3">
          {query.data.content.map((n) => (
            <div
              key={n.id}
              className={`glass-panel flex items-start justify-between gap-4 rounded-2xl p-4 ${
                n.readStatus ? 'opacity-70' : 'border-cyan-500/30'
              }`}
            >
              <div>
                <h2 className="text-sm font-semibold text-white">{n.title}</h2>
                <p className="mt-1 text-xs text-slate-300">{n.message}</p>
                <p className="mt-1.5 text-[11px] text-slate-500">{formatIST(n.createdAt)}</p>
              </div>
              {!n.readStatus && (
                <button
                  type="button"
                  onClick={() => markRead.mutate(n.id)}
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1 text-xs text-cyan-300 hover:bg-slate-700"
                >
                  <Check className="h-3.5 w-3.5" /> Read
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel rounded-2xl p-8 text-center text-sm text-slate-400">You have no notifications.</div>
      )}
    </div>
  );
}
