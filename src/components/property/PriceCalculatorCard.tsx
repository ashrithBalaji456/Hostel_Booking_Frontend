import { Calculator } from 'lucide-react';
import type { PricingResponse, StayType } from '../../types/api';
import { formatINR } from '../../utils/format';

interface PriceCalculatorCardProps {
  pricing?: PricingResponse | null;
  hourlyRateOverride?: number | null;
  nightlyRateOverride?: number | null;
  checkIn: string;
  checkOut: string;
  stayType: StayType;
  minShortStayHours: number;
  maxShortStayDays: number;
  minLongStayDays: number;
  maxLongStayMonths: number;
  onChangeDuration: (nextCheckOutLocal: string, nextStayType: StayType) => void;
}

function toLocalDateTimeInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function PriceCalculatorCard({
  pricing,
  hourlyRateOverride,
  nightlyRateOverride,
  checkIn,
  checkOut,
  stayType,
  minShortStayHours,
  maxShortStayDays,
  minLongStayDays,
  maxLongStayMonths,
  onChangeDuration,
}: PriceCalculatorCardProps) {
  const startMs = new Date(checkIn).getTime();
  const endMs = new Date(checkOut).getTime();
  const totalMinutes = Number.isFinite(startMs) && Number.isFinite(endMs) ? Math.max(0, Math.round((endMs - startMs) / 60000)) : 0;

  const totalHours = Math.max(0, Math.ceil(totalMinutes / 60));
  const wholeDays = Math.floor(totalHours / 24);
  const remHours = totalHours % 24;
  const billedDays = Math.max(0, Math.ceil(totalMinutes / (60 * 24)));

  const hourlyRate = hourlyRateOverride ?? pricing?.hourlyRate ?? null;
  const nightlyRate = nightlyRateOverride ?? pricing?.nightlyRate ?? 0;
  const weeklyRate = pricing?.weeklyRate ?? null;
  const monthlyRate = pricing?.monthlyRate ?? null;

  let baseAmount = 0;
  let rateLabel = '';
  let depositAmount = 0;
  let validationNote: string | null = null;

  if (totalMinutes <= 0) {
    validationNote = 'Check-out must be after check-in.';
  } else if (stayType === 'SHORT_STAY') {
    if (totalHours < minShortStayHours) {
      validationNote = `Short stay requires at least ${minShortStayHours} hours.`;
    } else if (billedDays > maxShortStayDays) {
      validationNote = `Short stay max is ${maxShortStayDays} days. Switch to Long Stay for longer durations.`;
    }
    if (totalHours < 24 && hourlyRate != null && hourlyRate > 0) {
      baseAmount = hourlyRate * totalHours;
      rateLabel = `${totalHours} hr${totalHours === 1 ? '' : 's'} × ${formatINR(hourlyRate)}/hr`;
    } else {
      const nights = Math.max(1, billedDays);
      baseAmount = nightlyRate * nights;
      rateLabel = `${nights} night${nights === 1 ? '' : 's'} × ${formatINR(nightlyRate)}/night`;
    }
  } else {
    if (billedDays < minLongStayDays) {
      validationNote = `Long stay requires at least ${minLongStayDays} days.`;
    } else if (billedDays > maxLongStayMonths * 31) {
      validationNote = `Long stay max is ${maxLongStayMonths} months.`;
    }
    if (billedDays >= 28 && monthlyRate != null && monthlyRate > 0) {
      baseAmount = monthlyRate * (billedDays / 30);
      rateLabel = `${billedDays} days @ ${formatINR(monthlyRate)}/mo`;
    } else if (billedDays >= 7 && weeklyRate != null && weeklyRate > 0) {
      baseAmount = weeklyRate * (billedDays / 7);
      rateLabel = `${billedDays} days @ ${formatINR(weeklyRate)}/wk`;
    } else {
      baseAmount = nightlyRate * Math.max(1, billedDays);
      rateLabel = `${Math.max(1, billedDays)} day${billedDays === 1 ? '' : 's'} × ${formatINR(nightlyRate)}/night`;
    }
    depositAmount = pricing?.securityDeposit ?? 0;
  }

  const discountPct = pricing?.discountPercentage ?? 0;
  const discountAmount = Math.round(baseAmount * (discountPct / 100) * 100) / 100;
  const extraCharges = pricing?.extraCharges ?? 0;
  const totalAmount = Math.max(0, Math.round((baseAmount - discountAmount + depositAmount + extraCharges) * 100) / 100);

  const applyDaysAndHours = (daysVal: number, hoursVal: number) => {
    if (!Number.isFinite(startMs)) return;
    const safeDays = Math.max(0, Math.min(365, Math.floor(daysVal)));
    const safeHours = Math.max(0, Math.min(23, Math.floor(hoursVal)));
    const totalH = Math.max(minShortStayHours, safeDays * 24 + safeHours);
    const nextEnd = new Date(startMs + totalH * 3600 * 1000);
    const nextType: StayType = totalH > maxShortStayDays * 24 ? 'LONG_STAY' : totalH >= minLongStayDays * 24 && stayType === 'LONG_STAY' ? 'LONG_STAY' : 'SHORT_STAY';
    onChangeDuration(toLocalDateTimeInput(nextEnd), nextType);
  };

  return (
    <div className="mt-4 rounded-xl border border-cyan-500/25 bg-slate-900/80 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-white">
          <Calculator className="h-4 w-4 text-cyan-400" />
          Stay Price Calculator
        </h3>
        <span className="text-[11px] font-medium text-cyan-300">
          {wholeDays > 0 ? `${wholeDays}d ` : ''}
          {remHours}h total
        </span>
      </div>

      {/* Days & Hours interactive inputs */}
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        <div>
          <label htmlFor="calc-days" className="mb-1 block text-[11px] text-slate-400">
            Days
          </label>
          <input
            id="calc-days"
            type="number"
            min={0}
            max={365}
            value={wholeDays}
            onChange={(e) => applyDaysAndHours(Number(e.target.value), remHours)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white"
          />
        </div>
        <div>
          <label htmlFor="calc-hours" className="mb-1 block text-[11px] text-slate-400">
            Hours
          </label>
          <input
            id="calc-hours"
            type="number"
            min={0}
            max={23}
            value={remHours}
            onChange={(e) => applyDaysAndHours(wholeDays, Number(e.target.value))}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white"
          />
        </div>
      </div>

      {/* Quick duration presets */}
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {[
          { label: '3h', d: 0, h: 3 },
          { label: '6h', d: 0, h: 6 },
          { label: '12h', d: 0, h: 12 },
          { label: '1d', d: 1, h: 0 },
          { label: '3d', d: 3, h: 0 },
          { label: '7d', d: 7, h: 0 },
          { label: '30d', d: 30, h: 0 },
        ].map((preset) => {
          const active = wholeDays === preset.d && remHours === preset.h;
          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                if (!Number.isFinite(startMs)) return;
                const totalH = preset.d * 24 + preset.h;
                const nextEnd = new Date(startMs + totalH * 3600 * 1000);
                const nextType: StayType = preset.d > maxShortStayDays ? 'LONG_STAY' : 'SHORT_STAY';
                onChangeDuration(toLocalDateTimeInput(nextEnd), nextType);
              }}
              className={`rounded-lg border px-2 py-1 text-[11px] font-medium transition ${
                active
                  ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                  : 'border-slate-700 bg-slate-950/70 text-slate-300 hover:border-slate-600'
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* Breakdown */}
      <div className="mt-3 space-y-1.5 border-t border-slate-800 pt-3 text-xs">
        {rateLabel && (
          <div className="flex justify-between text-slate-300">
            <span>{rateLabel}</span>
            <span className="font-medium text-white">{formatINR(baseAmount)}</span>
          </div>
        )}
        {discountAmount > 0 && (
          <div className="flex justify-between text-emerald-300">
            <span>Discount ({discountPct}%)</span>
            <span>-{formatINR(discountAmount)}</span>
          </div>
        )}
        {extraCharges > 0 && (
          <div className="flex justify-between text-slate-300">
            <span>Extra Charges</span>
            <span>{formatINR(extraCharges)}</span>
          </div>
        )}
        {depositAmount > 0 && (
          <div className="flex justify-between text-slate-300">
            <span>Security Deposit (Long Stay)</span>
            <span>{formatINR(depositAmount)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-slate-800 pt-2 text-sm font-bold text-white">
          <span>Estimated Total</span>
          <span className="text-cyan-300">{formatINR(totalAmount)}</span>
        </div>
      </div>

      {validationNote && (
        <p className="mt-2 text-[11px] text-amber-300">{validationNote}</p>
      )}
    </div>
  );
}
