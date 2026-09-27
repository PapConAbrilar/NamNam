/** Utilidades de fechas en horario local. Las fechas de día se manejan como 'YYYY-MM-DD'. */

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/** Lunes de la semana que contiene `date`. */
export function startOfWeek(date: Date): Date {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const offset = (copy.getDay() + 6) % 7;
  return addDays(copy, -offset);
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const LOCALE = 'es-CL';

/** "Septiembre 2026" */
export function formatMonthYear(date: Date): string {
  return capitalize(date.toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' }));
}

/** "Dom 6 Sep" */
export function formatShortDay(date: Date): string {
  const weekday = date.toLocaleDateString(LOCALE, { weekday: 'short' }).replace('.', '');
  const month = date.toLocaleDateString(LOCALE, { month: 'short' }).replace('.', '');
  return `${capitalize(weekday)} ${date.getDate()} ${capitalize(month)}`;
}

/** "1–7 Septiembre 2026" o "29 Septiembre – 5 Octubre 2026" */
export function formatWeekRange(start: Date, end: Date): string {
  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()}–${end.getDate()} ${formatMonthYear(end)}`;
  }
  const startMonth = capitalize(start.toLocaleDateString(LOCALE, { month: 'long' }));
  return `${start.getDate()} ${startMonth} – ${end.getDate()} ${formatMonthYear(end)}`;
}

/** "7:30 AM" */
export function formatTime(isoDateTime: string): string {
  return new Date(isoDateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export const WEEKDAY_LETTERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
