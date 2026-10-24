// js/ui/views/progressView.js — peso: stats, grafica, lista, medias semanales.

import { h, clear, icon, openDialog } from '../dom.js';
import { STR, errMsg } from '../../i18n/es.js';
import { todayKey, isFutureKey, isValidKey, formatDay, daysBetween } from '../../domain/dates.js';
import { fmtKg, fmtSigned, fmtPct } from '../../domain/format.js';
import { validateWeightKg, isSuspiciousWeightJump } from '../../domain/validation.js';
import { lbToKg, kgToLb, round1 } from '../../domain/units.js';
import { statTile } from '../components/summary.js';
import { weightChart, weightTable } from '../components/weightChart.js';
import { button, iconButton, segmented, formField } from '../components/forms.js';
import { toast, confirmDialog, banner, emptyState } from '../components/feedback.js';
import { WEIGHT_JUMP_DAYS } from '../../config.js';

let chartRange = 90; // 30 | 90 | Infinity
let showTable = false;

// Dialogo registrar peso. Reutilizable desde Hoy.
export function openWeightDialog(ctx, { date = todayKey() } = {}) {
  const state = ctx.store.getState();
  const unit = state.settings?.weightUnit ?? 'kg';
  const existing = state.weights.find(w => w.date === date);
  const input = h('input', { class: 'input', type: 'text', inputmode: 'decimal', value: existing ? String(round1(unit === 'lb' ? kgToLb(existing.kg) : existing.kg)) : '' });
  const errEl = h('p', { class: 'field-error', role: 'alert', hidden: true });

  const content = h('div', { class: 'sheet sheet-sm' },
    h('div', { class: 'sheet-head' },
      h('h2', { class: 'dlg-title' }, STR.progress.logWeight),
      iconButton({ iconName: 'x', ariaLabel: STR.common.close, onClick: () => dlg.close() })),
    h('p', { class: 'field-help' }, `${formatDay(date)} · ${STR.progress.tip}`),
    formField({ label: `${STR.progress.weight} (${unit})`, input }).el,
    errEl,
    h('div', { class: 'dlg-actions' },
      button({ label: STR.common.cancel, variant: 'secondary', onClick: () => dlg.close() }),
      button({
        label: STR.common.confirm, variant: 'primary',
        onClick: async () => {
          const raw = input.value.trim().replace(',', '.');
          const kg = unit === 'lb' ? lbToKg(Number(raw) || NaN) : Number(raw);
          const v = validateWeightKg(Number.isFinite(kg) ? kg : raw);
          if (!v.ok) { errEl.textContent = errMsg(v.error); errEl.hidden = false; input.focus(); return; }
          const kgVal = round1(v.value);
          if (existing) {
            const ok = await confirmDialog({
              title: STR.progress.replaceTitle,
              body: STR.progress.replaceBody(`${fmtKg(existing.kg)} kg`, `${fmtKg(kgVal)} kg`),
            });
            if (!ok) return;
          } else {
            const sorted = [...state.weights].sort((a, b) => b.date.localeCompare(a.date));
            const prev = sorted[0];
            if (prev && isSuspiciousWeightJump(kgVal, prev.kg, daysBetween(prev.date, date))) {
              const ok = await confirmDialog({
                title: STR.progress.jumpTitle,
                body: STR.progress.jumpBody(`${fmtKg(prev.kg)} kg`, `${fmtKg(kgVal)} kg`),
              });
              if (!ok) return;
            }
          }
          try {
            const { targetChanged, newKcal } = ctx.actions.upsertWeight(date, kgVal);
            toast(STR.progress.weightAdded);
            if (targetChanged) toast(STR.progress.updatedTarget(newKcal));
            dlg.close();
          } catch (e) { errEl.textContent = errMsg(e.message); errEl.hidden = false; }
        },
      })));
  const dlg = openDialog(content, { className: 'dlg-sheet' });
  setTimeout(() => input.focus(), 50);
  return dlg;
}

function assessmentMessage(code, goal) {
  const A = STR.progress.assess;
  if (code === 'insufficient') return A.insufficient;
  if (goal === 'lose') return code === 'on_track' ? A.on_track_lose : A[code];
  if (goal === 'gain') return code === 'on_track' ? A.on_track_gain : A[code];
  if (code === 'on_track') return A.stable;
  return A[code] ?? A.stable;
}

export function mountProgress(container, ctx) {
  const { store, actions, selectors } = ctx;

  const render = () => {
    const state = store.getState();
    const stats = selectors.selectWeightStats(state);
    const goal = state.profile?.goal ?? 'maintain';

    if (!stats) {
      clear(container).append(
        h('h1', { class: 'view-title' }, STR.progress.title),
        emptyState({
          iconName: 'scale', title: STR.progress.emptyTitle, body: STR.progress.emptyBody,
          ctaLabel: STR.progress.logWeight, onCta: () => openWeightDialog(ctx),
        }));
      return;
    }

    // Filtrar por rango
    const lastDate = stats.entries[stats.entries.length - 1].date;
    const trend = chartRange === Infinity
      ? stats.trend
      : stats.trend.filter(p => daysBetween(p.date, lastDate) <= chartRange);

    const tiles = h('div', { class: 'stat-tiles' },
      statTile({ label: STR.progress.current, value: `${fmtKg(stats.current)} kg` }),
      statTile({ label: STR.progress.trend, value: `${fmtKg(stats.trendCurrent)} kg` }),
      statTile({
        label: STR.progress.sinceStart,
        value: `${fmtSigned(stats.diffAbs)} kg`,
        delta: fmtSigned(stats.diffPct) + ' %',
      }),
      statTile({
        label: STR.progress.weeklyRate,
        value: stats.ratePerWeek !== null ? `${fmtSigned(stats.ratePerWeek)} kg` : STR.progress.insufficient,
        delta: stats.ratePctWeek !== null ? `${fmtSigned(stats.ratePctWeek)} %/sem` : null,
      }));

    const chart = showTable ? weightTable(trend) : weightChart({ trend, showTrend: stats.hasTrend });

    const entriesList = h('ul', { class: 'weight-list' },
      [...stats.entries].reverse().map((e, i, arr) => {
        const prev = arr[i + 1];
        const diff = prev ? e.kg - prev.kg : null;
        return h('li', { class: 'weight-row' },
          h('span', { class: 'weight-date' }, formatDay(e.date, '')),
          h('span', { class: 'weight-kg' }, `${fmtKg(e.kg)} kg`),
          h('span', { class: 'weight-diff' }, diff !== null ? `${fmtSigned(diff)} kg` : '—'),
          h('span', { class: 'weight-acts' },
            iconButton({ iconName: 'edit', ariaLabel: STR.common.edit, onClick: () => openWeightDialog(ctx, { date: e.date }) }),
            iconButton({
              iconName: 'trash', ariaLabel: STR.common.delete,
              onClick: async () => {
                const ok = await confirmDialog({ title: STR.progress.deleteTitle, body: STR.progress.deleteBody, danger: true, confirmLabel: STR.common.delete });
                if (ok) { actions.removeWeight(e.id); toast(STR.progress.weightRemoved); }
              },
            })));
      }));

    clear(container).append(
      h('div', { class: 'view-head' },
        h('h1', { class: 'view-title' }, STR.progress.title),
        button({ label: STR.progress.logWeight, variant: 'primary', iconName: 'plus', onClick: () => openWeightDialog(ctx) })),
      tiles,
      h('section', { class: 'card', 'aria-labelledby': 'chart-t' },
        h('div', { class: 'card-head' },
          h('h2', { class: 'card-title', id: 'chart-t' }, STR.progress.chartLabel),
          h('div', { class: 'card-actions' },
            segmented({
              name: 'chart-range', ariaLabel: 'Rango', value: String(chartRange),
              options: [
                { value: '30', label: STR.progress.range30 },
                { value: '90', label: STR.progress.range90 },
                { value: 'Infinity', label: STR.progress.rangeAll },
              ],
              onChange: v => { chartRange = v === 'Infinity' ? Infinity : Number(v); render(); },
            }),
            button({ label: showTable ? STR.progress.chartToggle : STR.progress.tableToggle, variant: 'ghost', onClick: () => { showTable = !showTable; render(); } }))),
        !stats.hasTrend ? h('p', { class: 'field-help' }, STR.progress.needTrend) : null,
        chart),
      banner({ type: 'info', children: [assessmentMessage(stats.assessment, goal)] }),
      h('details', { class: 'how' },
        h('summary', null, STR.progress.fluctuationTitle),
        h('p', null, STR.progress.fluctuationBody)),
      h('section', { class: 'card', 'aria-labelledby': 'wl-t' },
        h('h2', { class: 'card-title', id: 'wl-t' }, STR.progress.title),
        entriesList),
      stats.weeks.length >= 2 ? h('section', { class: 'card', 'aria-labelledby': 'wt-t' },
        h('h2', { class: 'card-title', id: 'wt-t' }, STR.progress.weeklyTable),
        h('table', { class: 'table' },
          h('thead', null, h('tr', null,
            h('th', { scope: 'col' }, STR.progress.week),
            h('th', { scope: 'col' }, STR.progress.avg),
            h('th', { scope: 'col' }, STR.progress.change))),
          h('tbody', null,
            stats.weeks.map((w, i) => h('tr', null,
              h('td', null, w.week),
              h('td', null, `${fmtKg(w.avg)} kg`),
              h('td', null, i > 0 ? `${fmtSigned(w.avg - stats.weeks[i - 1].avg)} kg` : '—')))))) : null);
  };

  const unsub = store.subscribe(render);
  render();
  return { unmount: () => unsub() };
}
