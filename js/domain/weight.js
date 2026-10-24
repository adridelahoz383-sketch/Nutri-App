// js/domain/weight.js — estadisticas de peso: tendencia EMA, ritmo semanal, valoracion.
// ESPECIFICACION.md §8.11. Funciones puras; `today` se inyecta como clave "YYYY-MM-DD".

import { daysBetween, isoWeekKey, todayKey, addDays } from './dates.js';
import {
  EMA_ALPHA, TREND_MIN_ENTRIES, TREND_MIN_SPAN_DAYS,
  RATE_MIN_ENTRIES, RATE_MIN_SPAN_DAYS, RATE_WINDOW_DAYS, EXPECTED_RATE_PCT,
} from '../config.js';

export function sortEntries(entries) {
  return [...entries].sort((a, b) => a.date.localeCompare(b.date));
}

// EMA con huecos: aeff = 1 - (1 - alpha)^deltaDias. [DISENIO]
export function computeTrend(entries) {
  const w = sortEntries(entries);
  if (!w.length) return [];
  const out = [{ date: w[0].date, kg: w[0].kg, trend: w[0].kg }];
  for (let i = 1; i < w.length; i++) {
    const dd = Math.max(1, daysBetween(w[i - 1].date, w[i].date));
    const aeff = 1 - Math.pow(1 - EMA_ALPHA, dd);
    const prev = out[i - 1].trend;
    out.push({ date: w[i].date, kg: w[i].kg, trend: prev + aeff * (w[i].kg - prev) });
  }
  return out;
}

export function linearSlope(points) {
  const n = points.length;
  if (n < 2) return 0;
  const xm = points.reduce((s, p) => s + p.x, 0) / n;
  const ym = points.reduce((s, p) => s + p.y, 0) / n;
  let num = 0, den = 0;
  for (const p of points) { num += (p.x - xm) * (p.y - ym); den += (p.x - xm) ** 2; }
  return den === 0 ? 0 : num / den;
}

// Medias por semana ISO -> [{ week, avg }]
export function weeklyAverages(entries) {
  const byWeek = new Map();
  for (const e of sortEntries(entries)) {
    const k = isoWeekKey(e.date);
    if (!byWeek.has(k)) byWeek.set(k, []);
    byWeek.get(k).push(e.kg);
  }
  return [...byWeek.entries()].map(([week, arr]) => ({
    week, avg: arr.reduce((a, b) => a + b, 0) / arr.length, count: arr.length,
  }));
}

// Valoracion del ritmo frente al objetivo. Devuelve codigo para i18n.
function assessRate(ratePctWeek, goal) {
  const r = EXPECTED_RATE_PCT[goal] ?? EXPECTED_RATE_PCT.maintain;
  if (ratePctWeek >= r.min && ratePctWeek <= r.max) return 'on_track';
  if (goal === 'lose') return ratePctWeek > r.max ? 'lose_too_slow' : 'lose_too_fast';
  if (goal === 'gain') return ratePctWeek < r.min ? 'gain_too_slow' : 'gain_too_fast';
  return ratePctWeek < r.min ? 'stable_below' : 'stable_above';
}

export function weightStats(entries, goal, today = todayKey()) {
  const w = sortEntries(entries);
  if (!w.length) return null;

  const trend = computeTrend(w);
  const initial = w[0].kg;
  const current = w[w.length - 1].kg;
  const trendCurrent = trend[trend.length - 1].trend;
  const diffAbs = current - initial;
  const diffPct = initial ? diffAbs / initial * 100 : 0;
  const prevDiff = w.length >= 2 ? current - w[w.length - 2].kg : 0;

  const spanDays = daysBetween(w[0].date, w[w.length - 1].date) ?? 0;
  const hasTrend = w.length >= TREND_MIN_ENTRIES && spanDays >= TREND_MIN_SPAN_DAYS;

  // Ritmo: pendiente min. cuadrados sobre ultimos RATE_WINDOW_DAYS dias.
  let ratePerWeek = null, ratePctWeek = null;
  const hasRate = w.length >= RATE_MIN_ENTRIES && spanDays >= RATE_MIN_SPAN_DAYS;
  if (hasRate) {
    const last = w[w.length - 1].date;
    const windowStart = addDays(last, -RATE_WINDOW_DAYS);
    const inWindow = w.filter(e => e.date >= windowStart);
    const pts = inWindow.map(e => ({ x: daysBetween(windowStart, e.date), y: e.kg }));
    ratePerWeek = linearSlope(pts) * 7;
    ratePctWeek = trendCurrent ? ratePerWeek / trendCurrent * 100 : null;
  }

  // Media semanal actual vs anterior
  const weeks = weeklyAverages(w);
  let weekChange = null;
  if (weeks.length >= 2) {
    const cur = weeks[weeks.length - 1], prev = weeks[weeks.length - 2];
    weekChange = { current: cur.avg, previous: prev.avg, change: cur.avg - prev.avg };
  }

  const assessment = ratePctWeek !== null ? assessRate(ratePctWeek, goal) : 'insufficient';

  return {
    entries: w, trend, weeks,
    initial, current, trendCurrent, diffAbs, diffPct, prevDiff,
    hasTrend, hasRate, ratePerWeek, ratePctWeek, weekChange, assessment,
    weightForCalc: w.length >= TREND_MIN_ENTRIES ? trendCurrent : current,
  };
}
