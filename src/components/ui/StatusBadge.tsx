import { CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';

const STYLES: Record<string, string> = {
  CONFIRMED: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  APPROVED: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  SUCCESS: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  ACTIVE: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  COMPLETED: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  SETTLED: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  PAID: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  RESOLVED: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  PENDING: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  OPEN: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  REQUESTED: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  CANCELLED: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  EXPIRED: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  REJECTED: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  FAILED: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  SUSPENDED: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  DISPUTED: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
};

export function StatusBadge({ status }: { status: string }) {
  const normalized = status?.toUpperCase() ?? 'UNKNOWN';
  const cls = STYLES[normalized] ?? 'bg-slate-800 text-slate-300 border-slate-700';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {['CONFIRMED', 'APPROVED', 'SUCCESS', 'ACTIVE', 'COMPLETED', 'SETTLED', 'PAID', 'RESOLVED'].includes(normalized) && (
        <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
      )}
      {['PENDING', 'OPEN', 'REQUESTED'].includes(normalized) && (
        <Clock className="h-3 w-3" aria-hidden="true" />
      )}
      {['REJECTED', 'FAILED', 'SUSPENDED', 'DISPUTED'].includes(normalized) && (
        <XCircle className="h-3 w-3" aria-hidden="true" />
      )}
      {['CANCELLED', 'EXPIRED'].includes(normalized) && (
        <AlertCircle className="h-3 w-3" aria-hidden="true" />
      )}
      <span>{normalized.replaceAll('_', ' ')}</span>
    </span>
  );
}
