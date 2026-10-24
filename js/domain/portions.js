// js/domain/portions.js — escalado de nutrientes por gramos. Funciones puras.

import { ATWATER } from '../config.js';

// per100 = { kcal, protein, carbs, fat } por 100 g/ml -> nutrientes para `grams`.
export function scaleNutrients(per100, grams) {
  const f = grams / 100;
  return {
    kcal: per100.kcal * f,
    protein: per100.protein * f,
    carbs: per100.carbs * f,
    fat: per100.fat * f,
  };
}

export function entryNutrients(entry) {
  return scaleNutrients(entry.per100, entry.grams);
}

// Suma sin redondear; redondear solo al presentar.
export function sumNutrients(list) {
  const t = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  for (const it of list) {
    const n = it.per100 ? entryNutrients(it) : it;
    t.kcal += n.kcal; t.protein += n.protein; t.carbs += n.carbs; t.fat += n.fat;
  }
  return t;
}

// Coherencia Atwater de un alimento por 100 g (tolerancia 15 % o 15 kcal). [DISENIO]
export function atwaterCheck(per100) {
  const est = per100.protein * ATWATER.protein + per100.carbs * ATWATER.carbs + per100.fat * ATWATER.fat;
  return Math.abs(per100.kcal - est) <= Math.max(per100.kcal * 0.15, 15);
}
