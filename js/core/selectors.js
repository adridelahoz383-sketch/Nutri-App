// js/core/selectors.js — datos derivados del estado. Puros (sin DOM).

import { FOODS } from '../../data/foods.js';
import { calcTargets } from '../domain/nutrition.js';
import { sumNutrients } from '../domain/portions.js';
import { weightStats } from '../domain/weight.js';
import { MEALS } from '../config.js';
import { todayKey } from '../domain/dates.js';

export const selectAllFoods = state => [...state.customFoods, ...FOODS];

export const foodById = (state, id) => selectAllFoods(state).find(f => f.id === id) ?? null;

export const selectDay = (state, date) => state.days[date] ?? null;

export function selectDayTotals(state, date) {
  const day = selectDay(state, date);
  return sumNutrients(day ? day.entries : []);
}

export function selectMealTotals(state, date) {
  const day = selectDay(state, date);
  const out = {};
  for (const m of MEALS) out[m] = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  if (!day) return out;
  for (const e of day.entries) {
    const n = sumNutrients([e]);
    const t = out[e.meal];
    t.kcal += n.kcal; t.protein += n.protein; t.carbs += n.carbs; t.fat += n.fat;
  }
  return out;
}

export const selectWeightStats = (state, today = todayKey()) =>
  weightStats(state.weights, state.profile?.goal ?? 'maintain', today);

// Peso usado en los calculos: tendencia si >= 3 registros, si no el ultimo. §8.12
export function selectWeightForCalc(state) {
  const stats = selectWeightStats(state);
  return stats ? stats.weightForCalc : null;
}

// Objetivos completos; null si falta perfil o peso.
export function selectTargets(state, today = new Date()) {
  if (!state.profile) return null;
  const w = selectWeightForCalc(state);
  if (w == null) return null;
  return calcTargets(state.profile, w, today);
}

// Objetivo aplicable a un dia concreto: snapshot del dia si existe, si no el actual.
export function selectTargetForDate(state, date, today = new Date()) {
  const day = selectDay(state, date);
  if (day?.targetSnapshot) return day.targetSnapshot;
  const t = selectTargets(state, today);
  return t ? { kcal: t.kcal, protein: t.proteinGrams } : null;
}
