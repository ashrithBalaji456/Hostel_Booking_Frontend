import { useState } from 'react';
import { BarChart3, PieChart, Activity, Radar } from 'lucide-react';
import type {
  BookingResponse,
  OwnerAnalyticsResponse,
  OwnerDashboardResponse,
  PropertyDetailResponse,
} from '../../types/api';
import { formatINR } from '../../utils/format';

interface OwnerAnalyticsChartsProps {
  dashboard: OwnerDashboardResponse;
  analytics?: OwnerAnalyticsResponse;
  properties: PropertyDetailResponse[];
  bookings: BookingResponse[];
  totalRooms: number;
  totalBeds: number;
  vacantBeds: number;
  occupiedBeds: number;
  unavailableBeds: number;
}

interface ChartDatum {
  label: string;
  value: number;
  displayValue: string;
  color: string;
  glow: string;
  sub?: string;
}

const GLASS_CARD =
  'group rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_20px_50px_-15px_rgba(0,0,0,0.6)] transition-all duration-300 hover:-translate-y-1.5 hover:border-cyan-400/45 hover:bg-white/[0.05] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_24px_60px_-12px_rgba(34,211,238,0.18)]';

export function OwnerAnalyticsCharts({
  dashboard,
  analytics,
  properties,
  bookings,
  totalRooms,
  totalBeds,
  vacantBeds,
  occupiedBeds,
  unavailableBeds,
}: OwnerAnalyticsChartsProps) {
  const [barMode, setBarMode] = useState<'inventory' | 'bookings' | 'properties'>('inventory');
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  const [ringMode, setRingMode] = useState<'occupancy' | 'outcomes' | 'stayType'>('occupancy');
  const [hoveredRing, setHoveredRing] = useState<number | null>(null);

  const [waveMode, setWaveMode] = useState<'financials' | 'pricing'>('financials');
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);

  const [radarMode, setRadarMode] = useState<'health' | 'distribution'>('health');
  const [hoveredVertex, setHoveredVertex] = useState<number | null>(null);

  // --- 1. 3D Glass Bar Chart Data ---
  const barData: ChartDatum[] =
    barMode === 'inventory'
      ? [
          { label: 'Rooms', value: totalRooms, displayValue: String(totalRooms), color: '#818cf8', glow: 'rgba(129,140,248,0.5)' },
          { label: 'Total Beds', value: totalBeds, displayValue: String(totalBeds), color: '#22d3ee', glow: 'rgba(34,211,238,0.5)' },
          { label: 'Vacant', value: vacantBeds, displayValue: String(vacantBeds), color: '#34d399', glow: 'rgba(52,211,153,0.5)' },
          { label: 'Booked', value: occupiedBeds, displayValue: String(occupiedBeds), color: '#fbbf24', glow: 'rgba(251,191,36,0.5)' },
          { label: 'Blocked', value: unavailableBeds, displayValue: String(unavailableBeds), color: '#f472b6', glow: 'rgba(244,114,182,0.5)' },
        ]
      : barMode === 'bookings'
      ? [
          { label: 'Total', value: analytics?.totalBookings ?? bookings.length, displayValue: String(analytics?.totalBookings ?? bookings.length), color: '#22d3ee', glow: 'rgba(34,211,238,0.5)' },
          { label: 'Pending', value: dashboard.pendingBookings, displayValue: String(dashboard.pendingBookings), color: '#fbbf24', glow: 'rgba(251,191,36,0.5)' },
          { label: 'Confirmed', value: dashboard.confirmedBookings, displayValue: String(dashboard.confirmedBookings), color: '#818cf8', glow: 'rgba(129,140,248,0.5)' },
          { label: 'Completed', value: analytics?.completedBookings ?? 0, displayValue: String(analytics?.completedBookings ?? 0), color: '#34d399', glow: 'rgba(52,211,153,0.5)' },
          { label: 'Cancelled', value: analytics?.cancelledBookings ?? 0, displayValue: String(analytics?.cancelledBookings ?? 0), color: '#fb7185', glow: 'rgba(251,113,133,0.5)' },
        ]
      : properties.slice(0, 5).map((p, idx) => {
          const bedCount = (p.rooms ?? []).reduce((acc, r) => acc + (r.beds?.length ?? 0), 0);
          const colors = ['#22d3ee', '#818cf8', '#34d399', '#fbbf24', '#c084fc'];
          return {
            label: p.name.length > 10 ? `${p.name.slice(0, 10)}…` : p.name,
            value: bedCount,
            displayValue: `${bedCount} beds`,
            color: colors[idx % colors.length],
            glow: 'rgba(34,211,238,0.45)',
          };
        });

  const safeBarData =
    barData.length > 0
      ? barData
      : [{ label: 'No Data', value: 0, displayValue: '0', color: '#475569', glow: 'rgba(71,85,105,0.3)' }];
  const maxBar = Math.max(1, ...safeBarData.map((d) => d.value));

  // --- 2. 3D Translucent Ring Gauge Data ---
  const shortStayCount = bookings.filter((b) => b.stayType === 'SHORT_STAY').length;
  const longStayCount = bookings.filter((b) => b.stayType === 'LONG_STAY').length;

  const ringData: ChartDatum[] =
    ringMode === 'occupancy'
      ? [
          { label: 'Vacant', value: vacantBeds, displayValue: `${vacantBeds} beds`, color: '#34d399', glow: 'rgba(52,211,153,0.55)' },
          { label: 'Occupied', value: occupiedBeds, displayValue: `${occupiedBeds} beds`, color: '#fbbf24', glow: 'rgba(251,191,36,0.55)' },
          { label: 'Blocked', value: unavailableBeds, displayValue: `${unavailableBeds} beds`, color: '#818cf8', glow: 'rgba(129,140,248,0.55)' },
        ]
      : ringMode === 'outcomes'
      ? [
          { label: 'Confirmed', value: dashboard.confirmedBookings, displayValue: String(dashboard.confirmedBookings), color: '#22d3ee', glow: 'rgba(34,211,238,0.55)' },
          { label: 'Completed', value: analytics?.completedBookings ?? 0, displayValue: String(analytics?.completedBookings ?? 0), color: '#34d399', glow: 'rgba(52,211,153,0.55)' },
          { label: 'Pending', value: dashboard.pendingBookings, displayValue: String(dashboard.pendingBookings), color: '#fbbf24', glow: 'rgba(251,191,36,0.55)' },
          { label: 'Cancelled', value: analytics?.cancelledBookings ?? 0, displayValue: String(analytics?.cancelledBookings ?? 0), color: '#fb7185', glow: 'rgba(251,113,133,0.55)' },
        ]
      : [
          { label: 'Short Stay', value: shortStayCount, displayValue: String(shortStayCount), color: '#22d3ee', glow: 'rgba(34,211,238,0.55)' },
          { label: 'Long Stay', value: longStayCount, displayValue: String(longStayCount), color: '#a855f7', glow: 'rgba(168,85,247,0.55)' },
        ];

  const ringTotal = ringData.reduce((sum, d) => sum + d.value, 0);
  const ringRadius = 64;
  const ringCircumference = 2 * Math.PI * ringRadius;

  // --- 3. 3D Floating Wave / Area Data ---
  const grossRev = bookings.reduce((s, b) => s + (b.totalAmount ?? 0), 0);
  const totalPaid = bookings.reduce((s, b) => s + (b.amountPaid ?? 0), 0);
  const netEarn = analytics?.netRevenue ?? dashboard.netEarnings;
  const avgHourly = properties.length
    ? Math.round(properties.reduce((s, p) => s + (p.pricing?.hourlyRate ?? 0), 0) / properties.length)
    : 0;
  const avgNightly = properties.length
    ? Math.round(properties.reduce((s, p) => s + (p.pricing?.nightlyRate ?? 0), 0) / properties.length)
    : 0;
  const avgMonthlyDayEq = properties.length
    ? Math.round(properties.reduce((s, p) => s + ((p.pricing?.monthlyRate ?? 0) / 30), 0) / properties.length)
    : 0;
  const avgDeposit = properties.length
    ? Math.round(properties.reduce((s, p) => s + (p.pricing?.securityDeposit ?? 0), 0) / properties.length)
    : 0;

  const waveData: ChartDatum[] =
    waveMode === 'financials'
      ? [
          { label: 'Gross', value: grossRev, displayValue: formatINR(grossRev), color: '#22d3ee', glow: 'rgba(34,211,238,0.65)' },
          { label: 'Collected', value: totalPaid, displayValue: formatINR(totalPaid), color: '#fbbf24', glow: 'rgba(251,191,36,0.65)' },
          { label: 'Net Rev', value: analytics?.netRevenue ?? 0, displayValue: formatINR(analytics?.netRevenue ?? 0), color: '#818cf8', glow: 'rgba(129,140,248,0.65)' },
          { label: 'Earnings', value: netEarn, displayValue: formatINR(netEarn), color: '#34d399', glow: 'rgba(52,211,153,0.65)' },
        ]
      : [
          { label: 'Hourly', value: avgHourly, displayValue: formatINR(avgHourly), color: '#22d3ee', glow: 'rgba(34,211,238,0.65)' },
          { label: 'Nightly', value: avgNightly, displayValue: formatINR(avgNightly), color: '#818cf8', glow: 'rgba(129,140,248,0.65)' },
          { label: 'Mo / Day', value: avgMonthlyDayEq, displayValue: formatINR(avgMonthlyDayEq), color: '#34d399', glow: 'rgba(52,211,153,0.65)' },
          { label: 'Deposit', value: avgDeposit, displayValue: formatINR(avgDeposit), color: '#c084fc', glow: 'rgba(192,132,252,0.65)' },
        ];

  const maxWave = Math.max(1, ...waveData.map((d) => d.value));
  const waveCoords = waveData.map((d, idx) => {
    const x = 42 + (idx * 276) / Math.max(1, waveData.length - 1);
    const y = 156 - (d.value / maxWave) * 114;
    return { x, y, ...d };
  });

  const buildSmoothPath = (pts: typeof waveCoords) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cx = (p0.x + p1.x) / 2;
      d += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return d;
  };

  const linePath = buildSmoothPath(waveCoords);
  const areaPath = `${linePath} L ${waveCoords[waveCoords.length - 1].x} 170 L ${waveCoords[0].x} 170 Z`;

  // --- 4. 3D Radar / Spider Web Matrix Data ---
  const occupancyPct = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
  const vacancyPct = totalBeds > 0 ? Math.round((vacantBeds / totalBeds) * 100) : 0;
  const approvedPct = properties.length
    ? Math.round((properties.filter((p) => p.verificationStatus === 'APPROVED').length / properties.length) * 100)
    : 0;
  const instantPct = properties.length
    ? Math.round((properties.filter((p) => p.instantBookingEnabled).length / properties.length) * 100)
    : 0;
  const roomReadinessPct = properties.length
    ? Math.round((properties.filter((p) => (p.rooms?.length ?? 0) > 0).length / properties.length) * 100)
    : 0;
  const completionPct =
    (analytics?.totalBookings ?? 0) > 0
      ? Math.round(((analytics?.completedBookings ?? 0) / (analytics?.totalBookings ?? 1)) * 100)
      : 0;

  const radarAxes: ChartDatum[] =
    radarMode === 'health'
      ? [
          { label: 'Occupancy', value: occupancyPct, displayValue: `${occupancyPct}%`, color: '#22d3ee', glow: 'rgba(34,211,238,0.55)' },
          { label: 'Approved', value: approvedPct, displayValue: `${approvedPct}%`, color: '#34d399', glow: 'rgba(52,211,153,0.55)' },
          { label: 'Instant', value: instantPct, displayValue: `${instantPct}%`, color: '#818cf8', glow: 'rgba(129,140,248,0.55)' },
          { label: 'Rooms Set', value: roomReadinessPct, displayValue: `${roomReadinessPct}%`, color: '#c084fc', glow: 'rgba(192,132,252,0.55)' },
          { label: 'Completed', value: completionPct, displayValue: `${completionPct}%`, color: '#fbbf24', glow: 'rgba(251,191,36,0.55)' },
        ]
      : [
          { label: 'Vacant %', value: vacancyPct, displayValue: `${vacancyPct}%`, color: '#34d399', glow: 'rgba(52,211,153,0.55)' },
          { label: 'Booked %', value: occupancyPct, displayValue: `${occupancyPct}%`, color: '#fbbf24', glow: 'rgba(251,191,36,0.55)' },
          { label: 'Rooms', value: Math.min(100, totalRooms * 20), displayValue: `${totalRooms}`, color: '#22d3ee', glow: 'rgba(34,211,238,0.55)' },
          { label: 'Beds', value: Math.min(100, totalBeds * 10), displayValue: `${totalBeds}`, color: '#818cf8', glow: 'rgba(129,140,248,0.55)' },
          { label: 'Props', value: Math.min(100, properties.length * 25), displayValue: `${properties.length}`, color: '#c084fc', glow: 'rgba(192,132,252,0.55)' },
        ];

  const radarCx = 135;
  const radarCy = 104;
  const radarR = 72;
  const radarPoints = radarAxes.map((axis, idx) => {
    const angle = -Math.PI / 2 + (idx * 2 * Math.PI) / radarAxes.length;
    const ratio = Math.max(0.14, axis.value / 100);
    return {
      ...axis,
      x: radarCx + Math.cos(angle) * radarR * ratio,
      y: radarCy + Math.sin(angle) * radarR * ratio,
      lx: radarCx + Math.cos(angle) * (radarR + 22),
      ly: radarCy + Math.sin(angle) * (radarR + 22),
      gx: radarCx + Math.cos(angle) * radarR,
      gy: radarCy + Math.sin(angle) * radarR,
    };
  });

  const tabClass = (active: boolean) =>
    `rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${
      active ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40' : 'text-slate-400 hover:text-white'
    }`;

  return (
    <div className="grid gap-5 lg:grid-cols-2" style={{ perspective: '1200px' }}>
      {/* 1. Enlarged Frosted-Glass 3D Bar Chart */}
      <div className={GLASS_CARD}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-cyan-400" />
            <h3 className="text-base font-semibold text-white">3D Glass Bar Matrix</h3>
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-slate-950/60 p-0.5">
            <button type="button" onClick={() => setBarMode('inventory')} className={tabClass(barMode === 'inventory')}>
              Inventory
            </button>
            <button type="button" onClick={() => setBarMode('bookings')} className={tabClass(barMode === 'bookings')}>
              Bookings
            </button>
            <button type="button" onClick={() => setBarMode('properties')} className={tabClass(barMode === 'properties')}>
              Properties
            </button>
          </div>
        </div>

        <div className="mt-4 h-60 w-full">
          <svg viewBox="0 0 360 205" className="h-full w-full overflow-visible" role="img" aria-label="3D interactive bar chart">
            <defs>
              {safeBarData.map((d, idx) => (
                <linearGradient key={idx} id={`glassBar-${idx}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={d.color} stopOpacity="0.48" />
                  <stop offset="100%" stopColor={d.color} stopOpacity="0.08" />
                </linearGradient>
              ))}
            </defs>
            {[36, 76, 116, 156].map((y) => (
              <line key={y} x1="16" y1={y} x2="344" y2={y} stroke="rgba(255,255,255,0.07)" strokeDasharray="3 5" />
            ))}
            {safeBarData.map((d, idx) => {
              const step = 320 / safeBarData.length;
              const barW = Math.min(44, step * 0.62);
              const x = 20 + idx * step + (step - barW) / 2;
              const h = Math.max(12, (d.value / maxBar) * 124);
              const y = 166 - h;
              const isHovered = hoveredBar === idx;
              const lift = isHovered ? -10 : 0;

              return (
                <g
                  key={d.label}
                  onMouseEnter={() => setHoveredBar(idx)}
                  onMouseLeave={() => setHoveredBar(null)}
                  style={{
                    transform: `translateY(${lift}px)`,
                    transition: 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
                    cursor: 'pointer',
                  }}
                >
                  {/* 3D Side Glass Face */}
                  <polygon
                    points={`${x + barW},${y} ${x + barW + 10},${y - 7} ${x + barW + 10},${166 - 7} ${x + barW},166`}
                    fill={d.color}
                    fillOpacity={isHovered ? 0.28 : 0.14}
                    stroke={d.color}
                    strokeOpacity={0.45}
                    strokeWidth={0.8}
                  />
                  {/* 3D Top Glass Cap */}
                  <polygon
                    points={`${x},${y} ${x + 10},${y - 7} ${x + barW + 10},${y - 7} ${x + barW},${y}`}
                    fill={d.color}
                    fillOpacity={isHovered ? 0.55 : 0.32}
                    stroke={d.color}
                    strokeOpacity={0.75}
                    strokeWidth={0.9}
                  />
                  {/* Front Frosted Glass Prism */}
                  <rect
                    x={x}
                    y={y}
                    width={barW}
                    height={h}
                    rx={4}
                    fill={`url(#glassBar-${idx})`}
                    stroke={isHovered ? '#ffffff' : d.color}
                    strokeOpacity={isHovered ? 0.85 : 0.65}
                    strokeWidth={1.25}
                    style={isHovered ? { filter: `drop-shadow(0 10px 18px ${d.glow})` } : undefined}
                  />
                  {/* Specular glass reflection line */}
                  <line x1={x + 4} y1={y + 4} x2={x + 4} y2={Math.max(y + 6, 162)} stroke="rgba(255,255,255,0.28)" strokeWidth={1.2} strokeLinecap="round" />
                  <text x={x + barW / 2} y={y - 13} textAnchor="middle" className="fill-white text-[11px] font-semibold">
                    {d.displayValue}
                  </text>
                  <text x={x + barW / 2} y={186} textAnchor="middle" className="fill-slate-300 text-[11px]">
                    {d.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* 2. Enlarged Frosted-Glass 3D Ring */}
      <div className={GLASS_CARD}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <PieChart className="h-4 w-4 text-indigo-400" />
            <h3 className="text-base font-semibold text-white">3D Glass Utilization Ring</h3>
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-slate-950/60 p-0.5">
            <button type="button" onClick={() => setRingMode('occupancy')} className={tabClass(ringMode === 'occupancy')}>
              Beds
            </button>
            <button type="button" onClick={() => setRingMode('outcomes')} className={tabClass(ringMode === 'outcomes')}>
              Status
            </button>
            <button type="button" onClick={() => setRingMode('stayType')} className={tabClass(ringMode === 'stayType')}>
              Stay Type
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-col items-center gap-5 sm:flex-row">
          <svg viewBox="0 0 180 180" className="h-56 w-56 shrink-0 overflow-visible" role="img" aria-label="3D utilization ring chart">
            {/* Translucent glass depth track */}
            <circle cx="90" cy="97" r={ringRadius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="22" />
            <circle cx="90" cy="90" r={ringRadius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="18" />
            {(() => {
              let offset = 0;
              return ringData.map((d, idx) => {
                const frac = ringTotal > 0 ? d.value / ringTotal : 0;
                const len = frac * ringCircumference;
                const curOffset = offset;
                offset += len;
                const isHovered = hoveredRing === idx;
                return (
                  <circle
                    key={d.label}
                    cx="90"
                    cy={isHovered ? '84' : '90'}
                    r={ringRadius}
                    fill="none"
                    stroke={d.color}
                    strokeOpacity={isHovered ? 0.72 : 0.42}
                    strokeWidth={isHovered ? 24 : 18}
                    strokeDasharray={`${len} ${ringCircumference}`}
                    strokeDashoffset={-curOffset}
                    transform="rotate(-90 90 90)"
                    onMouseEnter={() => setHoveredRing(idx)}
                    onMouseLeave={() => setHoveredRing(null)}
                    style={{
                      transition: 'all 220ms ease',
                      cursor: 'pointer',
                      filter: isHovered ? `drop-shadow(0 0 14px ${d.glow})` : `drop-shadow(0 0 6px ${d.glow})`,
                    }}
                  />
                );
              });
            })()}
            <text x="90" y="86" textAnchor="middle" className="fill-white text-2xl font-bold">
              {hoveredRing !== null && ringData[hoveredRing] ? ringData[hoveredRing].displayValue : ringTotal}
            </text>
            <text x="90" y="106" textAnchor="middle" className="fill-slate-300 text-xs">
              {hoveredRing !== null && ringData[hoveredRing] ? ringData[hoveredRing].label : 'Total'}
            </text>
          </svg>

          <div className="w-full flex-1 space-y-2.5">
            {ringData.map((d, idx) => {
              const pct = ringTotal > 0 ? Math.round((d.value / ringTotal) * 100) : 0;
              const isHovered = hoveredRing === idx;
              return (
                <div
                  key={d.label}
                  onMouseEnter={() => setHoveredRing(idx)}
                  onMouseLeave={() => setHoveredRing(null)}
                  className={`flex cursor-pointer items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs transition-all duration-200 ${
                    isHovered
                      ? '-translate-y-0.5 border-cyan-400/50 bg-white/10 shadow-lg'
                      : 'border-white/10 bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="font-medium text-slate-200">{d.label}</span>
                  </div>
                  <span className="font-semibold text-white">
                    {d.displayValue} <span className="text-slate-400">({pct}%)</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Enlarged Translucent Wave Curve */}
      <div className={GLASS_CARD}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-400" />
            <h3 className="text-base font-semibold text-white">3D Glass Wave Curve</h3>
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-slate-950/60 p-0.5">
            <button type="button" onClick={() => setWaveMode('financials')} className={tabClass(waveMode === 'financials')}>
              Revenue Mix
            </button>
            <button type="button" onClick={() => setWaveMode('pricing')} className={tabClass(waveMode === 'pricing')}>
              Rate Tiers
            </button>
          </div>
        </div>

        <div className="mt-4 h-60 w-full">
          <svg viewBox="0 0 360 205" className="h-full w-full overflow-visible" role="img" aria-label="3D translucent wave chart">
            <defs>
              <linearGradient id="waveAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id="waveStrokeGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="50%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
            </defs>
            {[40, 82, 126, 170].map((y) => (
              <line key={y} x1="20" y1={y} x2="340" y2={y} stroke="rgba(255,255,255,0.07)" strokeDasharray="3 5" />
            ))}
            <path d={areaPath} fill="url(#waveAreaGrad)" />
            <path
              d={linePath}
              fill="none"
              stroke="url(#waveStrokeGrad)"
              strokeWidth="3"
              strokeLinecap="round"
              style={{ filter: 'drop-shadow(0 6px 12px rgba(34,211,238,0.4))' }}
            />
            {waveCoords.map((pt, idx) => {
              const isHovered = hoveredNode === idx;
              return (
                <g
                  key={pt.label}
                  onMouseEnter={() => setHoveredNode(idx)}
                  onMouseLeave={() => setHoveredNode(null)}
                  style={{ cursor: 'pointer' }}
                >
                  {isHovered && (
                    <line x1={pt.x} y1={pt.y} x2={pt.x} y2={170} stroke={pt.color} strokeDasharray="3 3" strokeOpacity={0.65} />
                  )}
                  <circle
                    cx={pt.x}
                    cy={isHovered ? pt.y - 7 : pt.y}
                    r={isHovered ? 9 : 6}
                    fill={pt.color}
                    fillOpacity={0.55}
                    stroke="#ffffff"
                    strokeOpacity={0.85}
                    strokeWidth={1.5}
                    style={{
                      transition: 'all 200ms ease',
                      filter: isHovered ? `drop-shadow(0 0 14px ${pt.glow})` : undefined,
                    }}
                  />
                  <text
                    x={pt.x}
                    y={isHovered ? pt.y - 20 : pt.y - 14}
                    textAnchor="middle"
                    className="fill-white text-[11px] font-semibold"
                  >
                    {pt.displayValue}
                  </text>
                  <text x={pt.x} y={190} textAnchor="middle" className="fill-slate-300 text-[11px]">
                    {pt.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* 4. Enlarged Translucent Radar Matrix */}
      <div className={GLASS_CARD}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Radar className="h-4 w-4 text-purple-400" />
            <h3 className="text-base font-semibold text-white">3D Glass Radar Matrix</h3>
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-slate-950/60 p-0.5">
            <button type="button" onClick={() => setRadarMode('health')} className={tabClass(radarMode === 'health')}>
              Health %
            </button>
            <button type="button" onClick={() => setRadarMode('distribution')} className={tabClass(radarMode === 'distribution')}>
              Capacity Mix
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-col items-center gap-4 sm:flex-row">
          <svg viewBox="0 0 270 208" className="h-56 w-64 shrink-0 overflow-visible" role="img" aria-label="3D performance radar chart">
            {[0.33, 0.66, 1].map((scale) => (
              <polygon
                key={scale}
                points={radarAxes
                  .map((_, idx) => {
                    const angle = -Math.PI / 2 + (idx * 2 * Math.PI) / radarAxes.length;
                    return `${radarCx + Math.cos(angle) * radarR * scale},${radarCy + Math.sin(angle) * radarR * scale}`;
                  })
                  .join(' ')}
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="1"
              />
            ))}
            {radarPoints.map((pt) => (
              <line key={pt.label} x1={radarCx} y1={radarCy} x2={pt.gx} y2={pt.gy} stroke="rgba(255,255,255,0.08)" />
            ))}
            <polygon
              points={radarPoints.map((pt) => `${pt.x},${pt.y}`).join(' ')}
              fill="rgba(34, 211, 238, 0.14)"
              stroke="#22d3ee"
              strokeOpacity="0.85"
              strokeWidth="1.8"
              style={{ filter: 'drop-shadow(0 0 14px rgba(34,211,238,0.35))' }}
            />
            {radarPoints.map((pt, idx) => {
              const isHovered = hoveredVertex === idx;
              return (
                <g
                  key={pt.label}
                  onMouseEnter={() => setHoveredVertex(idx)}
                  onMouseLeave={() => setHoveredVertex(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <circle
                    cx={pt.x}
                    cy={isHovered ? pt.y - 5 : pt.y}
                    r={isHovered ? 7 : 4.5}
                    fill={pt.color}
                    fillOpacity={0.75}
                    stroke="#ffffff"
                    strokeWidth={1.5}
                    style={{
                      transition: 'all 200ms ease',
                      filter: isHovered ? `drop-shadow(0 0 12px ${pt.glow})` : undefined,
                    }}
                  />
                  <text
                    x={pt.lx}
                    y={pt.ly}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className={`text-[10.5px] ${isHovered ? 'fill-white font-semibold' : 'fill-slate-300'}`}
                  >
                    {pt.label}
                  </text>
                </g>
              );
            })}
          </svg>

          <div className="w-full flex-1 space-y-2">
            {radarPoints.map((pt, idx) => {
              const isHovered = hoveredVertex === idx;
              return (
                <div
                  key={pt.label}
                  onMouseEnter={() => setHoveredVertex(idx)}
                  onMouseLeave={() => setHoveredVertex(null)}
                  className={`flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2 text-xs transition-all duration-200 ${
                    isHovered
                      ? '-translate-y-0.5 border-purple-400/50 bg-white/10 shadow-lg'
                      : 'border-white/10 bg-white/[0.03]'
                  }`}
                >
                  <span className="text-slate-300">{pt.label}</span>
                  <span className="font-semibold text-white">{pt.displayValue}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

interface PieChart3DCardProps {
  properties: PropertyDetailResponse[];
  bookings: BookingResponse[];
  dashboard?: OwnerDashboardResponse;
  analytics?: OwnerAnalyticsResponse;
}

/**
 * Interactive enlarged frosted-glass 3D Pie Chart card where hovering any
 * segment lifts and pops the slice outward with translucent glow.
 */
export function PieChart3DCard({
  properties,
  bookings,
  dashboard,
  analytics,
}: PieChart3DCardProps) {
  const [pieMode, setPieMode] = useState<'beds' | 'bookings' | 'rates'>('beds');
  const [hoveredSlice, setHoveredSlice] = useState<number | null>(null);

  const nowMs = Date.now();
  const bookedBedIds = new Set(
    bookings
      .filter((b) => new Date(b.checkOut).getTime() > nowMs && (b.bookingStatus === 'CONFIRMED' || b.bookingStatus === 'PENDING'))
      .map((b) => b.bedId),
  );
  const allBeds = properties.flatMap((p) => (p.rooms ?? []).flatMap((r) => r.beds ?? []));
  const occupied = allBeds.filter((b) => bookedBedIds.has(b.id)).length;
  const blocked = allBeds.filter((b) => !bookedBedIds.has(b.id) && b.status !== 'AVAILABLE').length;
  const vacant = allBeds.filter((b) => !bookedBedIds.has(b.id) && b.status === 'AVAILABLE').length;

  const avgHourly = properties.length
    ? Math.round(properties.reduce((s, p) => s + (p.pricing?.hourlyRate ?? 0), 0) / properties.length)
    : 0;
  const avgNightly = properties.length
    ? Math.round(properties.reduce((s, p) => s + (p.pricing?.nightlyRate ?? 0), 0) / properties.length)
    : 0;
  const avgDeposit = properties.length
    ? Math.round(properties.reduce((s, p) => s + (p.pricing?.securityDeposit ?? 0), 0) / properties.length)
    : 0;

  const slices: ChartDatum[] =
    pieMode === 'beds'
      ? [
          { label: 'Vacant', value: vacant, displayValue: `${vacant} beds`, color: '#34d399', glow: 'rgba(52,211,153,0.6)' },
          { label: 'Booked', value: occupied, displayValue: `${occupied} beds`, color: '#fbbf24', glow: 'rgba(251,191,36,0.6)' },
          { label: 'Blocked', value: blocked, displayValue: `${blocked} beds`, color: '#818cf8', glow: 'rgba(129,140,248,0.6)' },
        ]
      : pieMode === 'bookings'
      ? [
          { label: 'Confirmed', value: dashboard?.confirmedBookings ?? 0, displayValue: String(dashboard?.confirmedBookings ?? 0), color: '#22d3ee', glow: 'rgba(34,211,238,0.6)' },
          { label: 'Pending', value: dashboard?.pendingBookings ?? 0, displayValue: String(dashboard?.pendingBookings ?? 0), color: '#fbbf24', glow: 'rgba(251,191,36,0.6)' },
          { label: 'Completed', value: analytics?.completedBookings ?? 0, displayValue: String(analytics?.completedBookings ?? 0), color: '#34d399', glow: 'rgba(52,211,153,0.6)' },
          { label: 'Cancelled', value: analytics?.cancelledBookings ?? 0, displayValue: String(analytics?.cancelledBookings ?? 0), color: '#fb7185', glow: 'rgba(251,113,133,0.6)' },
        ]
      : [
          { label: 'Hourly', value: avgHourly, displayValue: formatINR(avgHourly), color: '#22d3ee', glow: 'rgba(34,211,238,0.6)' },
          { label: 'Nightly', value: avgNightly, displayValue: formatINR(avgNightly), color: '#818cf8', glow: 'rgba(129,140,248,0.6)' },
          { label: 'Deposit', value: avgDeposit, displayValue: formatINR(avgDeposit), color: '#c084fc', glow: 'rgba(192,132,252,0.6)' },
        ];

  const total = slices.reduce((s, d) => s + d.value, 0);
  const cx = 100;
  const cy = 92;
  const r = 74;

  const nonZero = slices.map((s, idx) => ({ ...s, idx })).filter((s) => s.value > 0);
  let startAngle = -Math.PI / 2;

  const tabClass = (active: boolean) =>
    `rounded-lg px-2 py-1 text-[11px] font-medium transition ${
      active ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40' : 'text-slate-400 hover:text-white'
    }`;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/45 hover:shadow-2xl hover:shadow-cyan-500/15">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <PieChart className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">3D Glass Pie Chart</h3>
        </div>
        <div className="flex items-center gap-0.5 rounded-xl border border-white/10 bg-slate-950/60 p-0.5">
          <button type="button" onClick={() => setPieMode('beds')} className={tabClass(pieMode === 'beds')}>
            Beds
          </button>
          <button type="button" onClick={() => setPieMode('bookings')} className={tabClass(pieMode === 'bookings')}>
            Bookings
          </button>
          <button type="button" onClick={() => setPieMode('rates')} className={tabClass(pieMode === 'rates')}>
            Rates
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-col items-center">
        <svg viewBox="0 0 200 192" className="h-52 w-52 overflow-visible" role="img" aria-label="3D interactive pie chart">
          {/* Translucent 3D shadow rim */}
          <ellipse cx={cx} cy={cy + 12} rx={r} ry={r * 0.96} fill="rgba(2,6,23,0.45)" stroke="rgba(255,255,255,0.06)" />
          {nonZero.length === 0 ? (
            <circle cx={cx} cy={cy} r={r} fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.14)" />
          ) : nonZero.length === 1 ? (
            (() => {
              const only = nonZero[0];
              const isHovered = hoveredSlice === only.idx;
              return (
                <g
                  onMouseEnter={() => setHoveredSlice(only.idx)}
                  onMouseLeave={() => setHoveredSlice(null)}
                  style={{
                    transform: isHovered ? 'translateY(-8px) scale(1.04)' : 'translateY(0px) scale(1)',
                    transformOrigin: `${cx}px ${cy}px`,
                    transition: 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
                    cursor: 'pointer',
                    filter: isHovered ? `drop-shadow(0 12px 18px ${only.glow})` : undefined,
                  }}
                >
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill={only.color}
                    fillOpacity={isHovered ? 0.52 : 0.3}
                    stroke={only.color}
                    strokeOpacity={0.85}
                    strokeWidth={2}
                  />
                </g>
              );
            })()
          ) : (
            nonZero.map((slice) => {
              const angleSpan = (slice.value / total) * Math.PI * 2;
              const endAngle = startAngle + angleSpan;
              const midAngle = startAngle + angleSpan / 2;
              const x1 = cx + Math.cos(startAngle) * r;
              const y1 = cy + Math.sin(startAngle) * r;
              const x2 = cx + Math.cos(endAngle) * r;
              const y2 = cy + Math.sin(endAngle) * r;
              const largeArc = angleSpan > Math.PI ? 1 : 0;
              const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
              startAngle = endAngle;

              const isHovered = hoveredSlice === slice.idx;
              const liftX = isHovered ? Math.cos(midAngle) * 10 : 0;
              const liftY = isHovered ? Math.sin(midAngle) * 10 - 6 : 0;

              return (
                <path
                  key={slice.label}
                  d={d}
                  fill={slice.color}
                  fillOpacity={isHovered ? 0.56 : 0.32}
                  stroke={isHovered ? '#ffffff' : slice.color}
                  strokeOpacity={isHovered ? 0.9 : 0.75}
                  strokeWidth={1.6}
                  onMouseEnter={() => setHoveredSlice(slice.idx)}
                  onMouseLeave={() => setHoveredSlice(null)}
                  style={{
                    transform: `translate(${liftX}px, ${liftY}px) scale(${isHovered ? 1.04 : 1})`,
                    transformOrigin: `${cx}px ${cy}px`,
                    transition: 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1), fill-opacity 180ms ease',
                    cursor: 'pointer',
                    filter: isHovered ? `drop-shadow(0 12px 18px ${slice.glow})` : undefined,
                  }}
                />
              );
            })
          )}
        </svg>

        <div className="mt-2 w-full space-y-1.5">
          {slices.map((s, idx) => {
            const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
            const isHovered = hoveredSlice === idx;
            return (
              <div
                key={s.label}
                onMouseEnter={() => setHoveredSlice(idx)}
                onMouseLeave={() => setHoveredSlice(null)}
                className={`flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2 text-xs transition-all duration-200 ${
                  isHovered
                    ? '-translate-y-0.5 border-cyan-400/50 bg-white/10 shadow-lg'
                    : 'border-white/10 bg-white/[0.03]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-slate-200">{s.label}</span>
                </div>
                <span className="font-semibold text-white">
                  {s.displayValue} <span className="text-slate-400">({pct}%)</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
