// js/ui/components/weightChart.js — grafica SVG: puntos + linea de tendencia EMA.
// Eje X proporcional a dias reales (no por indice). Alternativa en tabla fuera (vista).

import { h, svgEl } from '../dom.js';
import { daysBetween, formatDay } from '../../domain/dates.js';
import { fmtKg } from '../../domain/format.js';
import { STR } from '../../i18n/es.js';

const W = 640, H = 260, PAD = { l: 44, r: 12, t: 14, b: 30 };

export function weightChart({ trend, showTrend }) {
  if (!trend.length) return h('p', { class: 'chart-empty' }, STR.progress.insufficient);

  const x0 = trend[0].date, x1 = trend[trend.length - 1].date;
  const span = Math.max(1, daysBetween(x0, x1));
  const kgs = trend.flatMap(p => [p.kg, p.trend]);
  let yMin = Math.min(...kgs) - 0.5, yMax = Math.max(...kgs) + 0.5;
  if (yMax - yMin < 1) { yMin -= 0.5; yMax += 0.5; }

  const X = date => PAD.l + (daysBetween(x0, date) / span) * (W - PAD.l - PAD.r);
  const Y = kg => PAD.t + (1 - (kg - yMin) / (yMax - yMin)) * (H - PAD.t - PAD.b);

  const svg = svgEl('svg', {
    viewBox: `0 0 ${W} ${H}`, class: 'weight-chart',
    role: 'img', 'aria-label': `${STR.progress.chartLabel}. ${trend.length} registros entre ${x0} y ${x1}.`,
    preserveAspectRatio: 'xMidYMid meet',
  });

  // rejilla Y: 4 marcas
  for (let i = 0; i <= 3; i++) {
    const kg = yMin + (yMax - yMin) * i / 3;
    const y = Y(kg);
    svg.append(svgEl('line', { x1: PAD.l, x2: W - PAD.r, y1: y, y2: y, class: 'chart-grid' }));
    const t = svgEl('text', { x: PAD.l - 6, y: y + 4, class: 'chart-tick', 'text-anchor': 'end' });
    t.textContent = fmtKg(kg);
    svg.append(t);
  }
  // marcas X: primera, medio, ultima
  const xTicks = [x0, trend[Math.floor(trend.length / 2)].date, x1];
  const seen = new Set();
  for (const d of xTicks) {
    if (seen.has(d)) continue; seen.add(d);
    const t = svgEl('text', { x: X(d), y: H - 8, class: 'chart-tick', 'text-anchor': 'middle' });
    t.textContent = formatDay(d, '');
    svg.append(t);
  }

  // linea de tendencia EMA
  if (showTrend) {
    const pts = trend.map(p => `${X(p.date).toFixed(1)},${Y(p.trend).toFixed(1)}`).join(' ');
    svg.append(svgEl('polyline', { points: pts, class: 'chart-trend', fill: 'none' }));
  }
  // puntos (registros reales)
  for (const p of trend) {
    const c = svgEl('circle', { cx: X(p.date), cy: Y(p.kg), r: 3.5, class: 'chart-dot' });
    const t = svgEl('title');
    t.textContent = `${p.date}: ${fmtKg(p.kg)} kg`;
    c.append(t);
    svg.append(c);
  }
  // linea punteada del peso inicial
  svg.append(svgEl('line', {
    x1: PAD.l, x2: W - PAD.r, y1: Y(trend[0].kg), y2: Y(trend[0].kg),
    class: 'chart-baseline', 'stroke-dasharray': '4 4',
  }));

  return svg;
}

// Tabla accesible alternativa
export function weightTable(trend) {
  const rows = trend.map(p => h('tr', null,
    h('td', null, p.date),
    h('td', null, `${fmtKg(p.kg)} kg`),
    h('td', null, `${fmtKg(p.trend)} kg`)));
  return h('table', { class: 'table' },
    h('thead', null, h('tr', null,
      h('th', { scope: 'col' }, STR.progress.date),
      h('th', { scope: 'col' }, STR.progress.weight),
      h('th', { scope: 'col' }, STR.progress.trend))),
    h('tbody', null, rows));
}
