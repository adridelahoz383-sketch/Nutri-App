// js/ui/components/meals.js — MealCard + FoodEntryRow.

import { h, icon } from '../dom.js';
import { STR } from '../../i18n/es.js';
import { fmtKcal, fmtGram } from '../../domain/format.js';
import { entryNutrients } from '../../domain/portions.js';
import { iconButton, button } from './forms.js';

const MEAL_ICONS = { breakfast: 'sunrise', lunch: 'sun', dinner: 'moon', snack: 'apple' };

export function entryRow({ entry, onEdit, onDelete }) {
  const n = entryNutrients(entry);
  const qty = entry.portionLabel
    ? `${entry.portionLabel} · ${fmtGram(entry.grams)} ${entry.unit}`
    : `${fmtGram(entry.grams)} ${entry.unit}`;
  const estimated = entry.quantitySource === 'default' || entry.portionLabel;
  return h('li', { class: 'entry-row' },
    h('button', { class: 'entry-main', type: 'button', on: { click: () => onEdit(entry) } },
      h('span', { class: 'entry-name' }, entry.foodName),
      h('span', { class: 'entry-meta' },
        qty,
        estimated ? h('span', { class: 'badge badge-info' }, STR.today.estimated) : null)),
    h('span', { class: 'entry-kcal' }, `≈ ${fmtKcal(n.kcal)}`),
    h('span', { class: 'entry-actions' },
      iconButton({ iconName: 'edit', ariaLabel: STR.today.edit, onClick: () => onEdit(entry) }),
      iconButton({ iconName: 'trash', ariaLabel: STR.today.delete, onClick: () => onDelete(entry) })));
}

// MealCard: cabecera con icono + nombre + subtotal + boton añadir; <details> en movil (CSS).
export function mealCard({ meal, entries, totalKcal, expanded, onAdd, onEdit, onDelete }) {
  const name = STR.meals[meal];
  const list = h('ul', { class: 'entry-list' },
    entries.map(e => entryRow({ entry: e, onEdit, onDelete })),
    entries.length === 0
      ? h('li', { class: 'entry-empty' },
          STR.today.emptyMeal(name),
          ' ',
          h('button', { class: 'link-btn', type: 'button', on: { click: () => onAdd(meal) } }, STR.today.add))
      : null);

  const det = h('details', { class: 'meal-card card', open: expanded ? true : null },
    h('summary', { class: 'meal-head' },
      icon(MEAL_ICONS[meal] ?? 'utensils', 20),
      h('span', { class: 'meal-name' }, name),
      h('span', { class: 'meal-subtotal' }, `≈ ${fmtKcal(totalKcal)}`),
      h('span', {
        class: 'meal-add btn-icon', role: 'button', tabindex: '0', 'aria-label': STR.today.addToMeal(name),
        on: {
          click: e => { e.preventDefault(); onAdd(meal); },
          keydown: e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onAdd(meal); } },
        },
      }, icon('plus', 18))),
    h('div', { class: 'meal-body' }, list));
  return det;
}
