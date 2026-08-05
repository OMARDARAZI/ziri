export function dateTime(value: unknown) {
  if (!value || typeof value !== 'string' && typeof value !== 'number') return '—';
  const str = String(value).trim().replace(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})/, '$1T$2');
  const d = new Date(str);
  if (Number.isNaN(d.getTime())) return String(value);
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(d);
  } catch {
    return String(value);
  }
}

export function money(value: unknown, currency: string | undefined) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'USD', maximumFractionDigits: currency === 'LBP' ? 0 : 2 }).format(amount);
}

export function imageUrl(value: unknown) {
  if (typeof value !== 'string' || !value) return '';
  return /^https?:\/\//.test(value) ? value : `${import.meta.env.VITE_BACKEND_ORIGIN || ''}${value}`;
}

