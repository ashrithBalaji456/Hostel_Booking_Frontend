export function formatINR(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatIST(isoString: string | undefined | null): string {
  if (!isoString) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(isoString));
}

export function toIsoUtc(localDateTimeValue: string): string {
  if (!localDateTimeValue) return '';
  return new Date(localDateTimeValue).toISOString();
}

export function defaultCheckInLocal(): string {
  const d = new Date(Date.now() + 2 * 60 * 60 * 1000);
  d.setMinutes(0, 0, 0);
  return toLocalInput(d);
}

export function defaultCheckOutLocal(hoursAhead = 24): string {
  const d = new Date(Date.now() + (2 + hoursAhead) * 60 * 60 * 1000);
  d.setMinutes(0, 0, 0);
  return toLocalInput(d);
}

function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
