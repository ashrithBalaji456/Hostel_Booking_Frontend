import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react';

interface DateTimePickerProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_HEADERS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function parseLocalValue(val: string): Date | null {
  if (!val) return null;
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDisplay(val: string): string {
  const d = parseLocalValue(val);
  if (!d) return '';
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function toLocalInputString(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/**
 * Custom curved-edge frosted-glass Date & Time picker rendered in a
 * viewport-aware portal so it matches the dark-navy Spatial Stay UI.
 */
export function DateTimePicker({
  id,
  value,
  onChange,
  ariaLabel,
  placeholder = 'Select date & time',
  required = false,
  className = '',
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const parsed = parseLocalValue(value);
  const now = new Date();
  const [viewYear, setViewYear] = useState((parsed ?? now).getFullYear());
  const [viewMonth, setViewMonth] = useState((parsed ?? now).getMonth());
  const [pos, setPos] = useState<{ top?: number; bottom?: number; left: number } | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const dialogId = useId();

  useEffect(() => {
    const p = parseLocalValue(value);
    if (p) {
      setViewYear(p.getFullYear());
      setViewMonth(p.getMonth());
    }
  }, [value]);

  const updatePosition = () => {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const popW = 310;
    const popH = 365;
    const left = Math.min(Math.max(12, rect.left), window.innerWidth - popW - 12);
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < popH && rect.top > spaceBelow;
    setPos({
      left,
      top: openUpward ? undefined : rect.bottom + 8,
      bottom: openUpward ? window.innerHeight - rect.top + 8 : undefined,
    });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    const onScrollOrResize = () => updatePosition();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        (!popoverRef.current || !popoverRef.current.contains(target))
      ) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const selectedHour = parsed ? parsed.getHours() : now.getHours();
  const selectedMinute = parsed ? parsed.getMinutes() : 0;

  const selectDay = (day: number) => {
    const next = new Date(viewYear, viewMonth, day, selectedHour, selectedMinute);
    onChange(toLocalInputString(next));
  };

  const updateTime = (hour: number, minute: number) => {
    const base = parsed ?? new Date(viewYear, viewMonth, now.getDate(), hour, minute);
    const next = new Date(base.getFullYear(), base.getMonth(), base.getDate(), hour, minute);
    onChange(toLocalInputString(next));
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const displayText = formatDisplay(value);

  const popover =
    open && pos ? (
      <div
        ref={popoverRef}
        id={dialogId}
        role="dialog"
        aria-label={ariaLabel ?? 'Choose date and time'}
        style={{
          position: 'fixed',
          left: `${pos.left}px`,
          top: pos.top !== undefined ? `${pos.top}px` : undefined,
          bottom: pos.bottom !== undefined ? `${pos.bottom}px` : undefined,
          width: '310px',
        }}
        className="z-[9999] rounded-3xl border border-slate-700/80 bg-slate-900/95 p-4 shadow-2xl shadow-black/80 backdrop-blur-2xl"
      >
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={prevMonth}
            aria-label="Previous month"
            className="rounded-xl border border-slate-700/80 bg-slate-800/80 p-1.5 text-slate-200 hover:border-cyan-400/50 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold text-white">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
          <button
            type="button"
            onClick={nextMonth}
            aria-label="Next month"
            className="rounded-xl border border-slate-700/80 bg-slate-800/80 p-1.5 text-slate-200 hover:border-cyan-400/50 hover:text-white"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-slate-400">
          {DAY_HEADERS.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>

        <div className="mt-1.5 grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
            <span key={`empty-${idx}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, idx) => idx + 1).map((day) => {
            const isSelected =
              parsed &&
              parsed.getFullYear() === viewYear &&
              parsed.getMonth() === viewMonth &&
              parsed.getDate() === day;
            const isToday =
              now.getFullYear() === viewYear &&
              now.getMonth() === viewMonth &&
              now.getDate() === day;

            return (
              <button
                key={day}
                type="button"
                onClick={() => selectDay(day)}
                className={`flex h-8 w-full items-center justify-center rounded-xl text-xs font-medium transition ${
                  isSelected
                    ? 'bg-gradient-to-br from-cyan-500 to-indigo-600 font-semibold text-white shadow-md shadow-cyan-500/25'
                    : isToday
                      ? 'border border-cyan-400/50 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20'
                      : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-800 pt-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <Clock className="h-3.5 w-3.5 text-cyan-400" />
            <select
              aria-label="Hour"
              value={selectedHour}
              onChange={(e) => updateTime(Number(e.target.value), selectedMinute)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white focus:border-cyan-400 focus:outline-none"
            >
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>
                  {pad2(h)}
                </option>
              ))}
            </select>
            <span>:</span>
            <select
              aria-label="Minute"
              value={selectedMinute - (selectedMinute % 15)}
              onChange={(e) => updateTime(selectedHour, Number(e.target.value))}
              className="rounded-xl border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white focus:border-cyan-400 focus:outline-none"
            >
              {[0, 15, 30, 45].map((m) => (
                <option key={m} value={m}>
                  {pad2(m)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                const n = new Date();
                n.setMinutes(0, 0, 0);
                onChange(toLocalInputString(n));
              }}
              className="rounded-xl border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-200 hover:bg-slate-700"
            >
              Now
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl bg-cyan-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-cyan-500"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    ) : null;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {required && (
        <input
          tabIndex={-1}
          aria-hidden="true"
          required
          value={value}
          onChange={() => {}}
          className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
        />
      )}
      <button
        ref={buttonRef}
        id={id}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? dialogId : undefined}
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-2 rounded-2xl border border-slate-700/90 bg-slate-900/90 px-3.5 py-2 text-left text-sm text-white transition hover:border-slate-600 focus:border-cyan-400 focus:outline-none"
      >
        <span className={`truncate ${displayText ? 'text-white' : 'text-slate-400'}`}>
          {displayText || placeholder}
        </span>
        <Calendar className="h-4 w-4 shrink-0 text-cyan-400" aria-hidden="true" />
      </button>

      {popover && typeof document !== 'undefined' ? createPortal(popover, document.body) : null}
    </div>
  );
}
