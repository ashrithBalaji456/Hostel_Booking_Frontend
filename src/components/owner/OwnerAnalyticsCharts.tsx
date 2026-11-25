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

  // --- 1. 3D Bar Chart Data ---
  const barData: ChartDatum[] =
    barMode === 'inventory'
      ? [
          { label: 'Rooms', value: totalRooms, displayValue: String(totalRooms), color: '#818cf8', glow: 'rgba(129,140,248,0.45)' },
          { label: 'Total Beds', value: totalBeds, displayValue: String(totalBeds), color: '#22d3ee', glow: 'rgba(34,211,238,0.45)' },
          { label: 'Vacant', value: vacantBeds, displayValue: String(vacantBeds), color: '#34d399', glow: 'rgba(52,211,153,0.45)' },
          { label: 'Booked', value: occupiedBeds, displayValue: String(occupiedBeds), color: '#fbbf24', glow: 'rgba(251,191,36,0.45)' },
          { label: 'Blocked', value: unavailableBeds, displayValue: String(unavailableBeds), color: '#f472b6', glow: 'rgba(244,114,182,0.45)' },
        ]
      : barMode === 'bookings'
      ? [
          { label: 'Total', value: analytics?.totalBookings ?? bookings.length, displayValue: String(analytics?.totalBookings ?? bookings.length), color: '#22d3ee', glow: 'rgba(34,211,238,0.45)' },
          { label: 'Pending', value: dashboard.pendingBookings, displayValue: String(dashboard.pendingBookings), color: '#fbbf24', glow: 'rgba(251,191,36,0.45)' },
          { label: 'Confirmed', value: dashboard.confirmedBookings, displayValue: String(dashboard.confirmedBookings), color: '#818cf8', glow: 'rgba(129,140,248,0.45)' },
          { label: 'Completed', value: analytics?.completedBookings ?? 0, displayValue: String(analytics?.completedBookings ?? 0), color: '#34d399', glow: 'rgba(52,211,153,0.45)' },
          { label: 'Cancelled', value: analytics?.cancelledBookings ?? 0, displayValue: String(analytics?.cancelledBookings ?? 0), color: '#fb7185', glow: 'rgba(251,113,133,0.45)' },
        ]
      : properties.slice(0, 5).map((p, idx) => {
          const bedCount = (p.rooms ?? []).reduce((acc, r) => acc + (r.beds?.length ?? 0), 0);
          const colors = ['#22d3ee', '#818cf8', '#34d399', '#fbbf24', '#c084fc'];
          return {
            label: p.name.length > 10 ? `${p.name.slice(0, 10)}…` : p.name,
            value: bedCount,
            displayValue: `${bedCount} beds`,
            color: colors[idx % colors.length],
            glow: 'rgba(34,211,238,0.4)',
            sub: `${p.rooms?.length ?? 0} rooms`,
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
          { label: 'Vacant', value: vacantBeds, displayValue: `${vacantBeds} beds`, color: '#34d399', glow: 'rgba(52,211,153,0.5)' },
          { label: 'Occupied', value: occupiedBeds, displayValue: `${occupiedBeds} beds`, color: '#fbbf24', glow: 'rgba(251,191,36,0.5)' },
          { label: 'Blocked', value: unavailableBeds, displayValue: `${unavailableBeds} beds`, color: '#818cf8', glow: 'rgba(129,140,248,0.5)' },
        ]
      : ringMode === 'outcomes'
      ? [
          { label: 'Confirmed', value: dashboard.confirmedBookings, displayValue: String(dashboard.confirmedBookings), color: '#22d3ee', glow: 'rgba(34,211,238,0.5)' },
          { label: 'Completed', value: analytics?.completedBookings ?? 0, displayValue: String(analytics?.completedBookings ?? 0), color: '#34d399', glow: 'rgba(52,211,153,0.5)' },
          { label: 'Pending', value: dashboard.pendingBookings, displayValue: String(dashboard.pendingBookings), color: '#fbbf24', glow: 'rgba(251,191,36,0.5)' },
          { label: 'Cancelled', value: analytics?.cancelledBookings ?? 0, displayValue: String(analytics?.cancelledBookings ?? 0), color: '#fb7185', glow: 'rgba(251,113,133,0.5)' },
        ]
      : [
          { label: 'Short Stay', value: shortStayCount, displayValue: String(shortStayCount), color: '#22d3ee', glow: 'rgba(34,211,238,0.5)' },
          { label: 'Long Stay', value: longStayCount, displayValue: String(longStayCount), color: '#a855f7', glow: 'rgba(168,85,247,0.5)' },
        ];

  const ringTotal = ringData.reduce((sum, d) => sum + d.value, 0);
  const ringCircumference = 2 * Math.PI * 52;

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
          { label: 'Gross', value: grossRev, displayValue: formatINR(grossRev), color: '#22d3ee', glow: 'rgba(34,211,238,0.6)' },
          { label: 'Collected', value: totalPaid, displayValue: formatINR(totalPaid), color: '#fbbf24', glow: 'rgba(251,191,36,0.6)' },
          { label: 'Net Rev', value: analytics?.netRevenue ?? 0, displayValue: formatINR(analytics?.netRevenue ?? 0), color: '#818cf8', glow: 'rgba(129,140,248,0.6)' },
          { label: 'Earnings', value: netEarn, displayValue: formatINR(netEarn), color: '#34d399', glow: 'rgba(52,211,153,0.6)' },
        ]
      : [
          { label: 'Hourly', value: avgHourly, displayValue: formatINR(avgHourly), color: '#22d3ee', glow: 'rgba(34,211,238,0.6)' },
          { label: 'Nightly', value: avgNightly, displayValue: formatINR(avgNightly), color: '#818cf8', glow: 'rgba(129,140,248,0.6)' },
          { label: 'Mo / Day', value: avgMonthlyDayEq, displayValue: formatINR(avgMonthlyDayEq), color: '#34d399', glow: 'rgba(52,211,153,0.6)' },
          { label: 'Deposit', value: avgDeposit, displayValue: formatINR(avgDeposit), color: '#c084fc', glow: 'rgba(192,132,252,0.6)' },
        ];

  const maxWave = Math.max(1, ...waveData.map((d) => d.value));
  const waveCoords = waveData.map((d, idx) => {
    const x = 36 + (idx * 248) / Math.max(1, waveData.length - 1);
    const y = 128 - (d.value / maxWave) * 92;
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
  const areaPath = `${linePath} L ${waveCoords[waveCoords.length - 1].x} 142 L ${waveCoords[0].x} 142 Z`;

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
          { label: 'Occupancy', value: occupancyPct, displayValue: `${occupancyPct}%`, color: '#22d3ee', glow: 'rgba(34,211,238,0.5)' },
          { label: 'Approved', value: approvedPct, displayValue: `${approvedPct}%`, color: '#34d399', glow: 'rgba(52,211,153,0.5)' },
          { label: 'Instant', value: instantPct, displayValue: `${instantPct}%`, color: '#818cf8', glow: 'rgba(129,140,248,0.5)' },
          { label: 'Rooms Set', value: roomReadinessPct, displayValue: `${roomReadinessPct}%`, color: '#c084fc', glow: 'rgba(192,132,252,0.5)' },
          { label: 'Completed', value: completionPct, displayValue: `${completionPct}%`, color: '#fbbf24', glow: 'rgba(251,191,36,0.5)' },
        ]
      : [
          { label: 'Vacant %', value: vacancyPct, displayValue: `${vacancyPct}%`, color: '#34d399', glow: 'rgba(52,211,153,0.5)' },
          { label: 'Booked %', value: occupancyPct, displayValue: `${occupancyPct}%`, color: '#fbbf24', glow: 'rgba(251,191,36,0.5)' },
          { label: 'Rooms', value: Math.min(100, totalRooms * 20), displayValue: `${totalRooms}`, color: '#22d3ee', glow: 'rgba(34,211,238,0.5)' },
          { label: 'Beds', value: Math.min(100, totalBeds * 10), displayValue: `${totalBeds}`, color: '#818cf8', glow: 'rgba(129,140,248,0.5)' },
          { label: 'Props', value: Math.min(100, properties.length * 25), displayValue: `${properties.length}`, color: '#c084fc', glow: 'rgba(192,132,252,0.5)' },
        ];

  const radarCx = 130;
  const radarCy = 84;
  const radarR = 54;
  const radarPoints = radarAxes.map((axis, idx) => {
    const angle = -Math.PI / 2 + (idx * 2 * Math.PI) / radarAxes.length;
    const ratio = Math.max(0.12, axis.value / 100);
    return {
      ...axis,
      x: radarCx + Math.cos(angle) * radarR * ratio,
      y: radarCy + Math.sin(angle) * radarR * ratio,
      lx: radarCx + Math.cos(angle) * (radarR + 18),
      ly: radarCy + Math.sin(angle) * (radarR + 18),
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
      {/* 1. 3D Isometric Glass Bar Chart */}
      <div className="group rounded-2xl border border-slate-700/60 bg-slate-900/45 p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-cyan-400/50 hover:shadow-2xl hover:shadow-cyan-500/15">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-cyan-400" />
            <h3 className="text-base font-semibold text-white">3D Bar Matrix</h3>
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-950/70 p-0.5">
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

        <div className="mt-4 h-48 w-full">
          <svg viewBox="0 0 320 175" className="h-full w-full overflow-visible" role="img" aria-label="3D interactive bar chart">
            <defs>
              <linearGradient id="barGlassFade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopOpacity="0.92" stopColor="#fff" />
                <stop offset="100%" stopOpacity="0.35" stopColor="#fff" />
              </linearGradient>
            </defs>
            {/* Subtle horizontal grid */}
            {[35, 70, 105, 140].map((y) => (
              <line key={y} x1="16" y1={y} x2="306" y2={y} stroke="rgba(148,163,184,0.12)" strokeDasharray="3 4" />
            ))}
            {safeBarData.map((d, idx) => {
              const step = 280 / safeBarData.length;
              const barW = Math.min(34, step * 0.56);
              const x = 22 + idx * step + (step - barW) / 2;
              const h = Math.max(8, (d.value / maxBar) * 102);
              const y = 140 - h;
              const isHovered = hoveredBar === idx;
              const lift = isHovered ? -9 : 0;

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
                  {/* 3D Side Face */}
                  <polygon
                    points={`${x + barW},${y} ${x + barW + 8},${y - 6} ${x + barW + 8},${140 - 6} ${x + barW},140`}
                    fill={d.color}
                    fillOpacity={isHovered ? 0.55 : 0.32}
                  />
                  {/* 3D Top Face */}
                  <polygon
                    points={`${x},${y} ${x + 8},${y - 6} ${x + barW + 8},${y - 6} ${x + barW},${y}`}
                    fill={d.color}
                    fillOpacity={isHovered ? 0.98 : 0.78}
                  />
                  {/* Front Translucent Face */}
                  <rect
                    x={x}
                    y={y}
                    width={barW}
                    height={h}
                    rx={3}
                    fill={d.color}
                    fillOpacity={isHovered ? 0.88 : 0.58}
                    stroke={isHovered ? '#ffffff' : d.color}
                    strokeOpacity={isHovered ? 0.7 : 0.4}
                    strokeWidth={1}
                    style={isHovered ? { filter: `drop-shadow(0 8px 14px ${d.glow})` } : undefined}
                  />
                  <text
                    x={x + barW / 2}
                    y={y - 11}
                    textAnchor="middle"
                    className="fill-white text-[10px] font-semibold"
                  >
                    {d.displayValue}
                  </text>
                  <text
                    x={x + barW / 2}
                    y={158}
                    textAnchor="middle"
                    className="fill-slate-300 text-[10px]"
                  >
                    {d.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* 2. 3D Depth Translucent Donut Ring */}
      <div className="group rounded-2xl border border-slate-700/60 bg-slate-900/45 p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-indigo-400/50 hover:shadow-2xl hover:shadow-indigo-500/15">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <PieChart className="h-4 w-4 text-indigo-400" />
            <h3 className="text-base font-semibold text-white">3D Utilization Ring</h3>
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-950/70 p-0.5">
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

        <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row">
          <svg viewBox="0 0 150 150" className="h-44 w-44 shrink-0 overflow-visible" role="img" aria-label="3D utilization donut chart">
            {/* 3D lower shadow ring */}
            <circle cx="75" cy="81" r="52" fill="none" stroke="rgba(15,23,42,0.85)" strokeWidth="18" />
            <circle cx="75" cy="75" r="52" fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth="16" />
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
                    cx="75"
                    cy={isHovered ? '71' : '75'}
                    r="52"
                    fill="none"
                    stroke={d.color}
                    strokeOpacity={isHovered ? 0.96 : 0.72}
                    strokeWidth={isHovered ? 20 : 16}
                    strokeDasharray={`${len} ${ringCircumference}`}
                    strokeDashoffset={-curOffset}
                    transform="rotate(-90 75 75)"
                    onMouseEnter={() => setHoveredRing(idx)}
                    onMouseLeave={() => setHoveredRing(null)}
                    style={{
                      transition: 'all 220ms ease',
                      cursor: 'pointer',
                      filter: isHovered ? `drop-shadow(0 0 10px ${d.glow})` : undefined,
                    }}
                  />
                );
              });
            })()}
            <text x="75" y="72" textAnchor="middle" className="fill-white text-lg font-bold">
              {hoveredRing !== null && ringData[hoveredRing] ? ringData[hoveredRing].displayValue : ringTotal}
            </text>
            <text x="75" y="89" textAnchor="middle" className="fill-slate-400 text-[10px]">
              {hoveredRing !== null && ringData[hoveredRing] ? ringData[hoveredRing].label : 'Total'}
            </text>
          </svg>

          <div className="flex-1 space-y-2 w-full">
            {ringData.map((d, idx) => {
              const pct = ringTotal > 0 ? Math.round((d.value / ringTotal) * 100) : 0;
              const isHovered = hoveredRing === idx;
              return (
                <div
                  key={d.label}
                  onMouseEnter={() => setHoveredRing(idx)}
                  onMouseLeave={() => setHoveredRing(null)}
                  className={`flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2 text-xs transition-all duration-200 ${
                    isHovered
                      ? '-translate-y-0.5 border-cyan-400/50 bg-slate-800/80 shadow-lg'
                      : 'border-slate-800/80 bg-slate-950/50'
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

      {/* 3. 3D Floating Area & Wave Curve */}
      <div className="group rounded-2xl border border-slate-700/60 bg-slate-900/45 p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-400/50 hover:shadow-2xl hover:shadow-emerald-500/15">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-400" />
            <h3 className="text-base font-semibold text-white">3D Translucent Wave</h3>
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-950/70 p-0.5">
            <button type="button" onClick={() => setWaveMode('financials')} className={tabClass(waveMode === 'financials')}>
              Revenue Mix
            </button>
            <button type="button" onClick={() => setWaveMode('pricing')} className={tabClass(waveMode === 'pricing')}>
              Rate Tiers
            </button>
          </div>
        </div>

        <div className="mt-4 h-48 w-full">
          <svg viewBox="0 0 320 170" className="h-full w-full overflow-visible" role="img" aria-label="3D translucent wave chart">
            <defs>
              <linearGradient id="waveAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.42" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id="waveStrokeGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="50%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
            </defs>
            {[36, 72, 108, 142].map((y) => (
              <line key={y} x1="20" y1={y} x2="300" y2={y} stroke="rgba(148,163,184,0.12)" strokeDasharray="3 4" />
            ))}
            <path d={areaPath} fill="url(#waveAreaGrad)" />
            <path
              d={linePath}
              fill="none"
              stroke="url(#waveStrokeGrad)"
              strokeWidth="3"
              strokeLinecap="round"
              style={{ filter: 'drop-shadow(0 4px 10px rgba(34,211,238,0.35))' }}
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
                    <line x1={pt.x} y1={pt.y} x2={pt.x} y2={142} stroke={pt.color} strokeDasharray="3 3" strokeOpacity={0.6} />
                  )}
                  <circle
                    cx={pt.x}
                    cy={isHovered ? pt.y - 6 : pt.y}
                    r={isHovered ? 8 : 5}
                    fill={pt.color}
                    fillOpacity={0.95}
                    stroke="#0f172a"
                    strokeWidth={2}
                    style={{
                      transition: 'all 200ms ease',
                      filter: isHovered ? `drop-shadow(0 0 12px ${pt.glow})` : undefined,
                    }}
                  />
                  <text
                    x={pt.x}
                    y={(isHovered ? pt.y - 18 : pt.y - 12)}
                    textAnchor="middle"
                    className="fill-white text-[10px] font-semibold"
                  >
                    {pt.displayValue}
                  </text>
                  <text x={pt.x} y={160} textAnchor="middle" className="fill-slate-300 text-[10px]">
                    {pt.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* 4. 3D Radar / Spider Matrix */}
      <div className="group rounded-2xl border border-slate-700/60 bg-slate-900/45 p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-purple-400/50 hover:shadow-2xl hover:shadow-purple-500/15">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Radar className="h-4 w-4 text-purple-400" />
            <h3 className="text-base font-semibold text-white">3D Performance Radar</h3>
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-950/70 p-0.5">
            <button type="button" onClick={() => setRadarMode('health')} className={tabClass(radarMode === 'health')}>
              Health %
            </button>
            <button type="button" onClick={() => setRadarMode('distribution')} className={tabClass(radarMode === 'distribution')}>
              Capacity Mix
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-col items-center gap-3 sm:flex-row">
          <svg viewBox="0 0 260 168" className="h-44 w-56 shrink-0 overflow-visible" role="img" aria-label="3D performance radar chart">
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
                stroke="rgba(148,163,184,0.18)"
                strokeWidth="1"
              />
            ))}
            {radarPoints.map((pt) => (
              <line key={pt.label} x1={radarCx} y1={radarCy} x2={pt.gx} y2={pt.gy} stroke="rgba(148,163,184,0.15)" />
            ))}
            <polygon
              points={radarPoints.map((pt) => `${pt.x},${pt.y}`).join(' ')}
              fill="rgba(168, 85, 247, 0.25)"
              stroke="#22d3ee"
              strokeWidth="2"
              style={{ filter: 'drop-shadow(0 0 12px rgba(34,211,238,0.35))' }}
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
                    cy={isHovered ? pt.y - 4 : pt.y}
                    r={isHovered ? 6 : 4}
                    fill={pt.color}
                    stroke="#0f172a"
                    strokeWidth={1.5}
                    style={{
                      transition: 'all 200ms ease',
                      filter: isHovered ? `drop-shadow(0 0 10px ${pt.glow})` : undefined,
                    }}
                  />
                  <text
                    x={pt.lx}
                    y={pt.ly}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className={`text-[9.5px] ${isHovered ? 'fill-white font-semibold' : 'fill-slate-300'}`}
                  >
                    {pt.label}
                  </text>
                </g>
              );
            })}
          </svg>

          <div className="flex-1 space-y-1.5 w-full">
            {radarPoints.map((pt, idx) => {
              const isHovered = hoveredVertex === idx;
              return (
                <div
                  key={pt.label}
                  onMouseEnter={() => setHoveredVertex(idx)}
                  onMouseLeave={() => setHoveredVertex(null)}
                  className={`flex cursor-pointer items-center justify-between rounded-xl border px-3 py-1.5 text-xs transition-all duration-200 ${
                    isHovered
                      ? '-translate-y-0.5 border-purple-400/50 bg-slate-800/80 shadow-lg'
                      : 'border-slate-800/80 bg-slate-950/50'
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
 * Interactive 3D filled Pie Chart card where hovering any wedge (or legend item)
 * lifts and pops the segment outward with a glowing shadow.
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
          { label: 'Vacant', value: vacant, displayValue: `${vacant} beds`, color: '#34d399', glow: 'rgba(52,211,153,0.55)' },
          { label: 'Booked', value: occupied, displayValue: `${occupied} beds`, color: '#fbbf24', glow: 'rgba(251,191,36,0.55)' },
          { label: 'Blocked', value: blocked, displayValue: `${blocked} beds`, color: '#818cf8', glow: 'rgba(129,140,248,0.55)' },
        ]
      : pieMode === 'bookings'
      ? [
          { label: 'Confirmed', value: dashboard?.confirmedBookings ?? 0, displayValue: String(dashboard?.confirmedBookings ?? 0), color: '#22d3ee', glow: 'rgba(34,211,238,0.55)' },
          { label: 'Pending', value: dashboard?.pendingBookings ?? 0, displayValue: String(dashboard?.pendingBookings ?? 0), color: '#fbbf24', glow: 'rgba(251,191,36,0.55)' },
          { label: 'Completed', value: analytics?.completedBookings ?? 0, displayValue: String(analytics?.completedBookings ?? 0), color: '#34d399', glow: 'rgba(52,211,153,0.55)' },
          { label: 'Cancelled', value: analytics?.cancelledBookings ?? 0, displayValue: String(analytics?.cancelledBookings ?? 0), color: '#fb7185', glow: 'rgba(251,113,133,0.55)' },
        ]
      : [
          { label: 'Hourly', value: avgHourly, displayValue: formatINR(avgHourly), color: '#22d3ee', glow: 'rgba(34,211,238,0.55)' },
          { label: 'Nightly', value: avgNightly, displayValue: formatINR(avgNightly), color: '#818cf8', glow: 'rgba(129,140,248,0.55)' },
          { label: 'Deposit', value: avgDeposit, displayValue: formatINR(avgDeposit), color: '#c084fc', glow: 'rgba(192,132,252,0.55)' },
        ];

  const total = slices.reduce((s, d) => s + d.value, 0);
  const cx = 80;
  const cy = 76;
  const r = 56;

  const nonZero = slices.map((s, idx) => ({ ...s, idx })).filter((s) => s.value > 0);
  let startAngle = -Math.PI / 2;

  const tabClass = (active: boolean) =>
    `rounded-lg px-2 py-1 text-[11px] font-medium transition ${
      active ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40' : 'text-slate-400 hover:text-white'
    }`;

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-900/45 p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/50 hover:shadow-2xl hover:shadow-cyan-500/15">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <PieChart className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">3D Pie Breakdown</h3>
        </div>
        <div className="flex items-center gap-0.5 rounded-xl border border-slate-800 bg-slate-950/70 p-0.5">
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

      <div className="mt-3 flex flex-col items-center">
        <svg viewBox="0 0 160 160" className="h-40 w-40 overflow-visible" role="img" aria-label="3D interactive pie chart">
          {/* 3D base shadow */}
          <ellipse cx={cx} cy={cy + 10} rx={r} ry={r * 0.96} fill="rgba(2,6,23,0.75)" />
          {nonZero.length === 0 ? (
            <circle cx={cx} cy={cy} r={r} fill="rgba(51,65,85,0.45)" stroke="rgba(148,163,184,0.25)" />
          ) : nonZero.length === 1 ? (
            (() => {
              const only = nonZero[0];
              const isHovered = hoveredSlice === only.idx;
              return (
                <g
                  onMouseEnter={() => setHoveredSlice(only.idx)}
                  onMouseLeave={() => setHoveredSlice(null)}
                  style={{
                    transform: isHovered ? 'translateY(-7px) scale(1.04)' : 'translateY(0px) scale(1)',
                    transformOrigin: `${cx}px ${cy}px`,
                    transition: 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
                    cursor: 'pointer',
                    filter: isHovered ? `drop-shadow(0 10px 14px ${only.glow})` : undefined,
                  }}
                >
                  <circle cx={cx} cy={cy} r={r} fill={only.color} fillOpacity={isHovered ? 0.95 : 0.78} stroke="#0f172a" strokeWidth={2} />
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
              const liftX = isHovered ? Math.cos(midAngle) * 8 : 0;
              const liftY = isHovered ? Math.sin(midAngle) * 8 - 5 : 0;

              return (
                <path
                  key={slice.label}
                  d={d}
                  fill={slice.color}
                  fillOpacity={isHovered ? 0.96 : 0.78}
                  stroke="#0f172a"
                  strokeWidth={2}
                  onMouseEnter={() => setHoveredSlice(slice.idx)}
                  onMouseLeave={() => setHoveredSlice(null)}
                  style={{
                    transform: `translate(${liftX}px, ${liftY}px) scale(${isHovered ? 1.04 : 1})`,
                    transformOrigin: `${cx}px ${cy}px`,
                    transition: 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1), fill-opacity 180ms ease',
                    cursor: 'pointer',
                    filter: isHovered ? `drop-shadow(0 10px 14px ${slice.glow})` : undefined,
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
                className={`flex cursor-pointer items-center justify-between rounded-xl border px-3 py-1.5 text-xs transition-all duration-200 ${
                  isHovered
                    ? '-translate-y-0.5 border-cyan-400/50 bg-slate-800/85 shadow-lg'
                    : 'border-slate-800/80 bg-slate-950/50'
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
