import { BarChart3 } from 'lucide-react';
import type { TicketStats } from '../../types/api';

interface TicketStatsChartCardProps {
  title: string;
  subtitle?: string;
  stats?: TicketStats;
}

export function TicketStatsChartCard({ title, subtitle, stats }: TicketStatsChartCardProps) {
  const total = stats?.total ?? 0;
  const open = stats?.open ?? 0;
  const inProgress = stats?.inProgress ?? 0;
  const resolved = stats?.resolvedOrClosed ?? 0;

  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
  const rectifiedRate = pct(resolved);

  const bars = [
    { label: 'Total Raised', value: total, pct: total > 0 ? 100 : 0, barClass: 'bg-cyan-500', textClass: 'text-cyan-300' },
    { label: 'Open', value: open, pct: pct(open), barClass: 'bg-amber-500', textClass: 'text-amber-300' },
    { label: 'In Progress', value: inProgress, pct: pct(inProgress), barClass: 'bg-indigo-500', textClass: 'text-indigo-300' },
    { label: 'Closed / Rectified', value: resolved, pct: pct(resolved), barClass: 'bg-emerald-500', textClass: 'text-emerald-300' },
  ];

  return (
    <div className="glass-panel rounded-2xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-white">
            <BarChart3 className="h-4 w-4 text-cyan-400" />
            {title}
          </h2>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>
        <span className="rounded-full border border-emerald-500/35 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
          {rectifiedRate}% Rectified
        </span>
      </div>

      {/* Stacked overview bar */}
      <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-slate-800">
        {total > 0 && (
          <>
            <div style={{ width: `${(resolved / total) * 100}%` }} className="bg-emerald-500 transition-all" />
            <div style={{ width: `${(inProgress / total) * 100}%` }} className="bg-indigo-500 transition-all" />
            <div style={{ width: `${(open / total) * 100}%` }} className="bg-amber-500 transition-all" />
          </>
        )}
      </div>

      {/* Individual bar breakdown */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {bars.map((b) => (
          <div key={b.label} className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">{b.label}</span>
              <span className={`font-bold ${b.textClass}`}>{b.value}</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div style={{ width: `${b.pct}%` }} className={`h-full rounded-full ${b.barClass} transition-all`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
