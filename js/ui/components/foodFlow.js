// js/ui/components/foodFlow.js — hoja de busqueda + editor de porcion + formulario personalizado.

import { h, icon, openDialog, clear } from '../dom.js';
import { STR, errMsg } from '../../i18n/es.js';
import { MEALS } from '../../config.js';
import { buildIndex, searchFoods } from '../../domain/foodSearch.js';
import { parseQuickInput } from '../../domain/quickParse.js';
import { validateGrams, validateName, validateKcalPer100, validateMacroPer100, validatePortionGrams } from '../../domain/validation.js';
import { scaleNutrients, atwaterCheck } from '../../domain/portions.js';
import { fmtKcal, fmtGram } from '../../domain/format.js';
import { button, segmented, formField, iconButton } from './forms.js';
import { emptyState } from './feedback.js';
import { FOOD_CATEGORIES } from '../../../data/foods.js';

// --- Comida por defecto segun la hora local. [DISENIO §12.2]
export function defaultMealForHour(hour = new Date().getHours()) {
  if (hour < 11) return 'breakfast';
  if (hour < 16) return 'lunch';
  if (hour < 18 || (hour === 18 && new Date().getMinutes() < 30)) return 'snack';
  return 'dinner';
}

let foodIndex = null;
export function getFoodIndex(allFoods) {
  // El indice se reconstruye si cambia el numero de personalizados
  foodIndex = buildIndex(allFoods);
  return foodIndex;
}

// openFoodSearch(ctx, { date, meal }) -> dialogo
export function openFoodSearch(ctx, { date, meal }) {
  let currentMeal = meal;
  const input = h('input', {
    class: 'input search-input', type: 'search',
    placeholder: STR.today.searchPlaceholder, 'aria-label': STR.today.searchPlaceholder,
    autocomplete: 'off', role: 'combobox', 'aria-expanded': 'true', 'aria-controls': 'food-results',
  });
  const resultsEl = h('ul', { class: 'food-results', id: 'food-results', role: 'listbox', 'aria-label': 'Resultados' });
  const liveEl = h('p', { class: 'visually-hidden', 'aria-live': 'polite' });
  const mealSel = segmented({
    name: 'meal', ariaLabel: 'Comida', value: currentMeal,
    options: MEALS.map(m => ({ value: m, label: STR.meals[m] })),
    onChange: v => { currentMeal = v; },
  });

  const content = h('div', { class: 'sheet' },
    h('div', { class: 'sheet-head' },
      h('h2', { class: 'dlg-title' }, STR.today.addFood),
      iconButton({ iconName: 'x', ariaLabel: STR.common.close, onClick: () => dlg.close() })),
    mealSel,
    h('div', { class: 'search-wrap' }, icon('search', 18), input),
    h('p', { class: 'field-help' }, STR.today.searchHint),
    liveEl, resultsEl);

  const dlg = openDialog(content, { className: 'dlg-sheet' });
  setTimeout(() => input.focus(), 50);

  let timer = null;
  const doSearch = () => {
    const raw = input.value;
    const parsed = parseQuickInput(raw);
    clear(resultsEl);
    const all = ctx.selectors.selectAllFoods(ctx.store.getState());
    const idx = getFoodIndex(all);
    const query = parsed.error === 'two_amounts' || parsed.error === 'empty' ? raw : parsed.query;
    const results = parsed.error === 'two_amounts' ? [] : searchFoods(query, idx);

    if (parsed.error === 'two_amounts') {
      resultsEl.append(h('li', { class: 'result-msg', role: 'alert' }, errMsg('two_amounts')));
      return;
    }
    if (!query.trim()) {
      resultsEl.append(h('li', { class: 'result-msg' }, STR.today.searchHint));
      return;
    }
    if (results.length === 0) {
      resultsEl.append(h('li', { class: 'result-empty' },
        emptyState({
          iconName: 'search', title: STR.today.noResults,
          ctaLabel: STR.today.createCustom(query.trim()),
          onCta: () => { dlg.close(); openCustomFoodForm(ctx, { name: query.trim() }); },
        })));
      liveEl.textContent = STR.today.noResults;
      return;
    }
    liveEl.textContent = `${results.length} resultados`;
    for (const food of results) {
      const grams = parsed.grams ?? null;
      const g = grams ?? food.defaultPortion?.grams ?? 100;
      const n = scaleNutrients(food.per100, g);
      const label = grams ? `${fmtGram(grams)} ${food.unit}` : `${food.defaultPortion?.label ?? 'porcion'} · ${fmtGram(g)} ${food.unit}`;
      resultsEl.append(h('li', { role: 'option' },
        h('button', {
          class: 'food-result', type: 'button',
          on: { click: () => { dlg.close(); openPortionEditor(ctx, { date, meal: currentMeal, food, initialGrams: grams }); } },
        },
          h('span', { class: 'food-result-name' }, food.name,
            food.isCustom ? h('span', { class: 'badge badge-soft' }, STR.today.custom) : null,
            food.variable ? h('span', { class: 'badge badge-warn' }, STR.today.variable) : null),
          h('span', { class: 'food-result-meta' }, `${label} — ≈${fmtKcal(n.kcal)} kcal`))));
    }
  };
  input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(doSearch, 120); });
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { const first = resultsEl.querySelector('.food-result'); first?.click(); }
  });
  doSearch();
  return dlg;
}

// Editor de porcion (añadir o editar entrada).
export function openPortionEditor(ctx, { date, meal, food, initialGrams, entry }) {
  let currentMeal = entry?.meal ?? meal;
  let quantitySource = entry ? 'user' : (initialGrams == null ? 'default' : 'user');
  let portionLabel = entry?.portionLabel ?? (quantitySource === 'default' ? food.defaultPortion?.label : null) ?? null;

  const gramsInput = h('input', {
    class: 'input', type: 'text', inputmode: 'decimal',
    value: entry ? String(entry.grams) : (initialGrams != null ? String(initialGrams) : String(food.defaultPortion?.grams ?? 100)),
    'aria-label': STR.today.grams,
  });
  const errEl = h('p', { class: 'field-error', role: 'alert', hidden: true });
  const previewEl = h('p', { class: 'portion-preview', 'aria-live': 'polite' });
  const mealSel = segmented({
    name: 'meal-edit', ariaLabel: 'Comida', value: currentMeal,
    options: MEALS.map(m => ({ value: m, label: STR.meals[m] })),
    onChange: v => { currentMeal = v; },
  });

  const portionChips = h('div', { class: 'chips' });
  const allPortions = food.defaultPortion
    ? [{ label: food.defaultPortion.label, grams: food.defaultPortion.grams }, ...food.portions]
    : food.portions;
  for (const p of allPortions) {
    const chip = h('button', {
      class: 'chip', type: 'button',
      on: { click: () => { gramsInput.value = String(p.grams); portionLabel = p.label; quantitySource = 'user'; updatePreview(); markChips(); } },
    }, `${p.label} · ${fmtGram(p.grams)} ${food.unit}`);
    chip.dataset.grams = String(p.grams);
    portionChips.append(chip);
  }
  function markChips() {
    for (const c of portionChips.children) c.classList.toggle('chip-active', c.dataset.grams === gramsInput.value.trim());
  }

  function updatePreview() {
    const v = validateGrams(gramsInput.value);
    if (!v.ok) { previewEl.textContent = ''; errEl.textContent = errMsg(v.error); errEl.hidden = false; gramsInput.setAttribute('aria-invalid', 'true'); return; }
    errEl.hidden = true; gramsInput.removeAttribute('aria-invalid');
    const n = scaleNutrients(food.per100, v.value);
    previewEl.textContent = `≈ ${fmtKcal(n.kcal)} kcal · P ${fmtGram(n.protein)} g · C ${fmtGram(n.carbs)} g · G ${fmtGram(n.fat)} g`;
  }
  gramsInput.addEventListener('input', () => { quantitySource = 'user'; portionLabel = null; updatePreview(); markChips(); });

  const content = h('div', { class: 'sheet sheet-sm' },
    h('div', { class: 'sheet-head' },
      h('h2', { class: 'dlg-title' }, entry ? STR.today.edit : food.name),
      iconButton({ iconName: 'x', ariaLabel: STR.common.close, onClick: () => dlg.close() })),
    h('p', { class: 'food-source' }, `${STR.today.source}: ${food.isCustom ? STR.today.custom : food.source.name} · ≈${fmtKcal(food.per100.kcal)} kcal/100 ${food.unit}`),
    food.variable ? h('p', { class: 'food-source' }, STR.today.variable) : null,
    mealSel,
    allPortions.length ? h('div', null, h('p', { class: 'field-label' }, STR.today.portionStd), portionChips) : null,
    formField({ label: `${STR.today.grams} (${food.unit})`, input: gramsInput }).el,
    errEl, previewEl,
    h('div', { class: 'dlg-actions' },
      button({ label: STR.common.cancel, variant: 'secondary', onClick: () => dlg.close() }),
      button({
        label: entry ? STR.today.save : STR.today.add, variant: 'primary',
        onClick: () => {
          const v = validateGrams(gramsInput.value);
          if (!v.ok) { errEl.textContent = errMsg(v.error); errEl.hidden = false; gramsInput.focus(); return; }
          try {
            if (entry) {
              ctx.actions.updateEntry(date, entry.id, { grams: v.value, meal: currentMeal, portionLabel });
            } else {
              ctx.actions.addEntry(date, currentMeal, { foodId: food.id, grams: quantitySource === 'default' ? null : v.value, portionLabel });
            }
            dlg.close();
          } catch (e) { errEl.textContent = errMsg(e.message); errEl.hidden = false; }
        },
      })));

  const dlg = openDialog(content, { className: 'dlg-sheet' });
  updatePreview(); markChips();
  return dlg;
}

// Formulario de alimento personalizado (crear/editar).
export function openCustomFoodForm(ctx, { name = '', food = null } = {}) {
  const fields = {};
  const mk = (key, label, suffix) => {
    const input = h('input', { class: 'input', type: 'text', inputmode: key === 'name' ? 'text' : 'decimal', value: food?.[key === 'kcal' ? 'per100' : key]?.[key] ?? (key === 'name' ? name : '') ?? '' });
    const f = formField({ label: suffix ? `${label} (${suffix})` : label, input });
    fields[key] = { input, field: f };
    return f.el;
  };
  const nameIn = h('input', { class: 'input', type: 'text', value: food?.name ?? name, maxlength: '60' });
  fields.name = { input: nameIn, field: formField({ label: STR.custom.nameLabel, input: nameIn }) };

  const unitSel = segmented({
    name: 'cf-unit', ariaLabel: STR.custom.unitLabel, value: food?.unit ?? 'g',
    options: [{ value: 'g', label: 'g' }, { value: 'ml', label: 'ml' }],
  });
  let unit = food?.unit ?? 'g';
  unitSel.addEventListener('change', e => { unit = e.target.value; });

  const warnEl = h('p', { class: 'field-help', hidden: true }, STR.custom.atwaterWarn);
  const portionG = h('input', { class: 'input', type: 'text', inputmode: 'decimal', value: food?.defaultPortion?.grams ?? '' });
  const portionL = h('input', { class: 'input', type: 'text', value: food?.defaultPortion?.label ?? '', placeholder: STR.custom.portionName });

  const content = h('div', { class: 'sheet sheet-sm' },
    h('div', { class: 'sheet-head' },
      h('h2', { class: 'dlg-title' }, STR.custom.customFoodTitle),
      iconButton({ iconName: 'x', ariaLabel: STR.common.close, onClick: () => dlg.close() })),
    fields.name.field.el,
    unitSel,
    mk('kcal', STR.custom.kcalLabel), mk('protein', STR.custom.proteinLabel),
    mk('carbs', STR.custom.carbsLabel), mk('fat', STR.custom.fatLabel),
    h('p', { class: 'field-label' }, STR.custom.portionLabel),
    h('div', { class: 'form-row' },
      formField({ label: STR.custom.portionGrams, input: portionG }).el,
      formField({ label: STR.custom.portionName, input: portionL }).el),
    warnEl,
    h('div', { class: 'dlg-actions' },
      button({ label: STR.common.cancel, variant: 'secondary', onClick: () => dlg.close() }),
      button({
        label: food ? STR.today.save : STR.custom.create, variant: 'primary',
        onClick: () => {
          const nv = validateName(fields.name.input.value);
          fields.name.field.setError(nv.ok ? null : errMsg(nv.error));
          const kv = validateKcalPer100(fields.kcal.input.value);
          fields.kcal.field.setError(kv.ok ? null : errMsg(kv.error));
          const pv = validateMacroPer100(fields.protein.input.value);
          fields.protein.field.setError(pv.ok ? null : errMsg(pv.error));
          const cv = validateMacroPer100(fields.carbs.input.value);
          fields.carbs.field.setError(cv.ok ? null : errMsg(cv.error));
          const fv = validateMacroPer100(fields.fat.input.value);
          fields.fat.field.setError(fv.ok ? null : errMsg(fv.error));
          if (!(nv.ok && kv.ok && pv.ok && cv.ok && fv.ok)) return;

          const per100 = { kcal: kv.value, protein: pv.value, carbs: cv.value, fat: fv.value };
          warnEl.hidden = atwaterCheck(per100);
          let defaultPortion = null;
          const pg = portionG.value.trim(), pl = portionL.value.trim();
          if (pg || pl) {
            const vg = validatePortionGrams(pg);
            if (!vg.ok || !pl) {
              warnEl.hidden = false; warnEl.textContent = errMsg('portion_range');
              return;
            }
            defaultPortion = { grams: vg.value, label: pl };
          }
          const payload = { name: nv.value, unit, per100, defaultPortion, portions: [] };
          if (food) ctx.actions.updateCustomFood(food.id, payload);
          else ctx.actions.addCustomFood(payload);
          dlg.close();
        },
      })));

  const dlg = openDialog(content, { className: 'dlg-sheet' });
  return dlg;
}
