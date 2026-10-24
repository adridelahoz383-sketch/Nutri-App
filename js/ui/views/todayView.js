// js/ui/views/todayView.js — dashboard "Hoy".

import { h, clear, icon } from '../dom.js';
import { STR } from '../../i18n/es.js';
import { MEALS, WEIGHT_REMINDER_DAYS } from '../../config.js';
import { todayKey, daysBetween, formatDayLong } from '../../domain/dates.js';
import { fmtKcal, fmtGram, fmtKg, fmtSigned } from '../../domain/format.js';
import { calorieRing, macroBar, daySwitcher } from '../components/summary.js';
import { mealCard } from '../components/meals.js';
import { openFoodSearch, openPortionEditor, defaultMealForHour } from '../components/foodFlow.js';
import { banner } from '../components/feedback.js';
import { toast } from '../components/feedback.js';
import { button } from '../components/forms.js';
import { openWeightDialog } from './progressView.js';

function weightMiniCard(ctx, stats) {
  const goalLabel = STR.goals[ctx.store.getState().profile?.goal] ?? '';
  if (!stats) {
    return h('section', { class: 'card weight-card', 'aria-labelledby': 'w-card-t' },
      h('h2', { class: 'card-title', id: 'w-card-t' }, STR.today.weightCardTitle),
      h('p', { class: 'empty-body' }, STR.today.noWeightCta),
      button({ label: STR.nav.logWeight, variant: 'secondary', iconName: 'scale', onClick: () => openWeightDialog(ctx) }));
  }
  const tone = stats.diffAbs < 0 ? 'good-down' : stats.diffAbs > 0 ? 'good-up' : '';
  return h('section', { class: 'card weight-card', 'aria-labelledby': 'w-card-t' },
    h('h2', { class: 'card-title', id: 'w-card-t' }, STR.today.weightCardTitle),
    h('div', { class: 'weight-row' },
      h('div', null,
        h('span', { class: 'weight-num' }, `${fmtKg(stats.trendCurrent)} kg`),
        h('span', { class: 'weight-sub' }, STR.today.trendWeight)),
      h('div', { class: 'weight-delta' },
        h('span', { class: `stat-delta ${tone}` },
          icon(stats.diffAbs <= 0 ? 'trending-down' : 'trending-up', 16),
          ` ${fmtSigned(stats.diffAbs)} kg (${fmtSigned(stats.diffPct)} %)`),
        stats.ratePerWeek !== null
          ? h('span', { class: 'weight-rate' }, `${fmtSigned(stats.ratePerWeek)} kg/sem`)
          : h('span', { class: 'weight-rate' }, STR.progress.insufficient))),
    h('div', { class: 'weight-actions' },
      button({ label: STR.nav.logWeight, variant: 'secondary', iconName: 'scale', onClick: () => openWeightDialog(ctx) }),
      h('a', { class: 'link-btn', href: '#/progreso' }, `${STR.nav.progress} →`)));
}

export function mountToday(container, ctx, { date }) {
  const { store, actions, selectors } = ctx;
  actions.ensureMonthLoaded(date);

  const render = () => {
    const state = store.getState();
    const today = todayKey();
    const targets = selectors.selectTargets(state);
    const targetForDate = selectors.selectTargetForDate(state, date);
    const totals = selectors.selectDayTotals(state, date);
    const mealTotals = selectors.selectMealTotals(state, date);
    const day = selectors.selectDay(state, date);
    const stats = selectors.selectWeightStats(state);

    const banners = [];
    if (!state.storageAvailable) banners.push(banner({ type: 'warning', children: [STR.today.noStorageBanner] }));
    if (targets?.floorApplied) banners.push(banner({ type: 'info', children: [STR.today.floorBanner] }));
    if (stats && daysBetween(stats.entries[stats.entries.length - 1].date, today) > WEIGHT_REMINDER_DAYS)
      banners.push(banner({ type: 'info', iconName: 'scale', children: [STR.today.reminder] }));
    if (!targets) banners.push(banner({ type: 'info', children: [STR.today.noWeightCta] }));

    const goalChip = state.profile
      ? h('span', { class: 'chip chip-goal' }, STR.today.goalChip(STR.goals[state.profile.goal], STR.paces[state.profile.pace]))
      : null;

    const hero = targetForDate
      ? calorieRing({ consumed: totals.kcal, target: targetForDate.kcal })
      : h('p', { class: 'empty-body' }, STR.today.noWeight);

    const proteinBar = targetForDate
      ? macroBar({ label: STR.today.protein, current: totals.protein, target: targetForDate.protein || 1 })
      : null;
    const secondary = h('p', { class: 'macro-secondary' },
      `${STR.today.carbs} ≈${fmtGram(totals.carbs)} g · ${STR.today.fat} ≈${fmtGram(totals.fat)} g`);

    const onAdd = meal => openFoodSearch(ctx, { date, meal });
    const onEdit = entry => {
      const food = selectors.foodById(state, entry.foodId)
        ?? { id: entry.foodId, name: entry.foodName, unit: entry.unit, per100: entry.per100, defaultPortion: null, portions: [], source: { name: entry.sourceName }, isCustom: true };
      openPortionEditor(ctx, { date, meal: entry.meal, food, entry });
    };
    const onDelete = entry => {
      actions.removeEntry(date, entry.id);
      toast(STR.today.removedToast, { actionLabel: STR.today.undo, onAction: () => actions.restoreEntry(date, entry) });
    };

    const mealsEl = h('div', { class: 'meals-grid' },
      MEALS.map((m, i) => mealCard({
        meal: m,
        entries: (day?.entries ?? []).filter(e => e.meal === m),
        totalKcal: mealTotals[m].kcal,
        expanded: i === 0 || (day?.entries ?? []).some(e => e.meal === m),
        onAdd, onEdit, onDelete,
      })));

    const fab = button({
      label: STR.nav.add, variant: 'primary', iconName: 'plus',
      className: 'fab', ariaLabel: STR.today.addFood,
      onClick: () => openFoodSearch(ctx, { date, meal: defaultMealForHour() }),
    });

    clear(container);
    container.append(
      h('header', { class: 'view-head' },
        h('div', null,
          h('h1', { class: 'view-title' },
            state.profile?.alias ? `${formatDayLong(date)} — ${state.profile.alias}` : formatDayLong(date)),
          goalChip),
        daySwitcher({ date, onNavigate: d => ctx.navigate({ name: 'today', date: d }) })),
      h('div', { class: 'banners' }, banners),
      h('div', { class: 'today-grid' },
        h('section', { class: 'card hero-card', 'aria-label': 'Resumen diario' }, hero),
        h('section', { class: 'card macros-card', 'aria-label': 'Macronutrientes' },
          proteinBar, secondary,
          h('p', { class: 'estimate-note' }, STR.today.estimateNote)),
        weightMiniCard(ctx, stats),
        h('div', { class: 'meals-col' }, mealsEl)),
      fab);
  };

  const unsub = store.subscribe(render);
  render();
  return { unmount: () => unsub() };
}
