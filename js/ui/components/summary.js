// js/ui/components/summary.js — anillo de calorias, barras de macros, tiles, DaySwitcher.

import { h, svgEl, icon } from '../dom.js';
import { fmtKcal, fmtPct, fmtGram } from '../../domain/format.js';
import { dayStatus, pctOf } from '../../domain/progress.js';
import { STR } from '../../i18n/es.js';
import { formatDay, addDays, todayKey, isFutureKey } from '../../domain/dates.js';
import { iconButton, button } from './forms.js';

// Anillo SVG. role="img" + aria-label; equivalente textual debajo.
export function calorieRing({ consumed, target }) {
  const remaining = Math.round(target - consumed);
  const pct = pctOf(consumed, target);
  const status = dayStatus(consumed, target);
  const size = 200, stroke = 14, r = (size - stroke) / 2, cx = size / 2;
  const circ = 2 * Math.PI * r;
  const fill = Math.min(pct, 100) / 100 * circ;

  const svg = svgEl('svg', {
    viewBox: `0 0 ${size} ${size}`, class: `ring ring-${status}`,
    role: 'img', 'aria-label': STR.today.ringLabel(Math.round(consumed), Math.round(target), Math.max(0, remaining)),
  });
  svg.append(
    svgEl('circle', { cx, cy: cx, r, fill: 'none', 'stroke-width': stroke, class: 'ring-track' }),
    svgEl('circle', {
      cx, cy: cx, r, fill: 'none', 'stroke-width': stroke, class: 'ring-fill',
      'stroke-dasharray': `${fill} ${circ}`, 'stroke-linecap': 'round',
      transform: `rotate(-90 ${cx} ${cx})`,
    }),
  );
  const center = h('div', { class: 'ring-center' },
    status === 'over'
      ? [icon('alert', 22), h('span', { class: 'ring-num' }, fmtKcal(Math.abs(remaining))), h('span', { class: 'ring-sub' }, 'kcal de mas')]
      : [h('span', { class: 'ring-num' }, fmtKcal(Math.max(0, remaining))), h('span', { class: 'ring-sub' }, STR.today.remaining)],
  );
  return h('div', { class: 'ring-wrap' },
    h('div', { class: 'ring-figure' }, svg, center),
    h('div', { class: 'ring-stats' },
      h('span', null, `${STR.today.target} ${fmtKcal(target)}`),
      h('span', { class: 'dot-sep', 'aria-hidden': 'true' }, '·'),
      h('span', null, `${STR.today.consumed} ≈${fmtKcal(consumed)}`),
      h('span', { class: 'dot-sep', 'aria-hidden': 'true' }, '·'),
      h('span', null, fmtPct(pct))),
    status === 'over' ? h('p', { class: 'ring-over' }, STR.today.exceeded(fmtKcal(Math.abs(remaining)))) : null,
  );
}

export function macroBar({ label, current, target, colorVar = '--c-protein' }) {
  const pct = target > 0 ? Math.min(current / target * 100, 100) : 0;
  return h('div', { class: 'macro' },
    h('div', { class: 'macro-head' },
      h('span', { class: 'macro-label' }, label),
      h('span', { class: 'macro-vals' }, `≈${fmtGram(current)} / ${fmtGram(target)} ${STR.common.g}`)),
    h('div', {
      class: 'macro-bar', role: 'progressbar',
      'aria-label': label, 'aria-valuemin': 0, 'aria-valuemax': Math.round(target),
      'aria-valuenow': Math.round(current),
    }, h('div', { class: 'macro-fill', style: { width: `${pct}%`, 'background-color': `var(${colorVar})` } })));
}

export function statTile({ label, value, delta, deltaTone }) {
  return h('div', { class: 'stat-tile' },
    h('span', { class: 'stat-value' }, value),
    h('span', { class: 'stat-label' }, label),
    delta ? h('span', { class: `stat-delta ${deltaTone ?? ''}` }, delta) : null);
}

// ‹ fecha › con "Volver a hoy". No permite futuro.
export function daySwitcher({ date, onNavigate }) {
  const today = todayKey();
  const isToday = date === today;
  const prev = iconButton({ iconName: 'chevron-left', ariaLabel: 'Dia anterior', onClick: () => onNavigate(addDays(date, -1)) });
  const next = iconButton({
    iconName: 'chevron-right', ariaLabel: 'Dia siguiente',
    onClick: () => onNavigate(addDays(date, 1)),
  });
  if (isFutureKey(addDays(date, 1))) next.disabled = true;
  return h('div', { class: 'day-switch' },
    prev,
    h('div', { class: 'day-label' },
      h('span', { class: 'day-name' }, formatDay(date)),
      !isToday ? h('button', { class: 'link-btn', type: 'button', on: { click: () => onNavigate(today) } }, STR.today.backToday) : null),
    next);
}
