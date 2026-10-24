// js/domain/dates.js — fechas de dia en hora LOCAL ("YYYY-MM-DD").
// Nunca usar toISOString().slice(0,10) para claves de dia (usa UTC).

const pad = n => String(n).padStart(2, '0');

export function dateKey(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayKey(now = new Date()) {
  return dateKey(now);
}

// "YYYY-MM-DD" -> Date local a medianoche, o null si invalida.
export function parseKey(key) {
  if (typeof key !== 'string') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key.trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (d.getFullYear() !== Number(m[1]) || d.getMonth() !== Number(m[2]) - 1 || d.getDate() !== Number(m[3])) return null;
  return d;
}

export function isValidKey(key) {
  return parseKey(key) !== null;
}

export function addDays(key, n) {
  const d = parseKey(key);
  if (!d) return null;
  d.setDate(d.getDate() + n);
  return dateKey(d);
}

// dias enteros entre dos claves (b - a)
export function daysBetween(a, b) {
  const da = parseKey(a), db = parseKey(b);
  if (!da || !db) return null;
  return Math.round((db - da) / 86400000);
}

export function isFutureKey(key, today = todayKey()) {
  return daysBetween(today, key) > 0;
}

export function monthKey(key) {
  return key.slice(0, 7); // "YYYY-MM"
}

// Semana ISO "YYYY-Www" (lunes-domingo)
export function isoWeekKey(key) {
  const d = parseKey(key);
  if (!d) return null;
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() + 6) % 7; // 0 = lunes
  date.setUTCDate(date.getUTCDate() - dayNum + 3); // jueves de la semana ISO
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((date - firstThursday) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return `${date.getUTCFullYear()}-W${pad(week)}`;
}

export function nowIso(now = new Date()) {
  return now.toISOString();
}

// "2026-09-24" -> "jue, 24 sep" | "Hoy" | "Ayer"
export function formatDay(key, today = todayKey()) {
  const d = parseKey(key);
  if (!d) return key;
  if (key === today) return 'Hoy';
  if (key === addDays(today, -1)) return 'Ayer';
  return new Intl.DateTimeFormat('es', { weekday: 'short', day: 'numeric', month: 'short' }).format(d);
}

export function formatDayLong(key) {
  const d = parseKey(key);
  if (!d) return key;
  return new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d);
}
