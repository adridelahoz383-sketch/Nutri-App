// js/domain/nutrition.js — BMR (Mifflin-St Jeor), TDEE, objetivos. Funciones puras.
// Fuentes: ESPECIFICACION.md §7-8, §35. Constantes en js/config.js.

import {
  ACTIVITY_FACTORS, GOAL_ADJUSTMENT, SEX_FLOOR_KCAL, PROTEIN_G_PER_KG,
  RESISTANCE_MIN_DAYS, BMI_HIGH, BMI_REF, KCAL_PER_KG,
} from '../config.js';

const roundTo = (n, step) => Math.round(n / step) * step;

export function calcAge(birthYear, today = new Date()) {
  return today.getFullYear() - birthYear;
}

export function calcBMI(weightKg, heightCm) {
  const h = heightCm / 100;
  return weightKg / (h * h);
}

// Mifflin-St Jeor (1990). [EVIDENCIA]
// 'unspecified': punto medio entre +5 y -161 = -78. [DISENIO, menos preciso]
export function calcBMR({ sex, weightKg, heightCm, age }) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (sex === 'male') return base + 5;
  if (sex === 'female') return base - 161;
  return base - 78;
}

export function calcTDEE(bmr, activityLevel) {
  const f = ACTIVITY_FACTORS[activityLevel];
  if (!f) throw new Error(`activityLevel desconocido: ${activityLevel}`);
  return bmr * f;
}

// target = max(TDEE * (1+adj), floor); floor = max(round(BMR), suelo por sexo).
export function calcCalorieTarget({ tdee, bmr, sex, goal, pace }) {
  const adj = (GOAL_ADJUSTMENT[goal] && GOAL_ADJUSTMENT[goal][pace]) ?? 0;
  const raw = tdee * (1 + adj);
  const floor = Math.max(Math.round(bmr), SEX_FLOOR_KCAL[sex] ?? SEX_FLOOR_KCAL.unspecified);
  const floorApplied = raw < floor;
  return { kcal: roundTo(Math.max(raw, floor), 10), floorApplied, adjustment: adj };
}

// Ritmo esperado inicial (solo informativo; Hall 2011: no lineal a largo plazo). [ESTIMACION]
export function calcExpectedWeeklyChange(targetKcal, tdee, weightKg) {
  const dailyDelta = targetKcal - tdee;
  const weeklyKg = dailyDelta * 7 / KCAL_PER_KG;
  return { weeklyKg, weeklyPct: weightKg > 0 ? weeklyKg / weightKg * 100 : 0 };
}

export function trainsResistance(resistanceDaysPerWeek) {
  return (resistanceDaysPerWeek ?? 0) >= RESISTANCE_MIN_DAYS;
}

// g/kg sobre peso real o peso de referencia (IMC>=30). [EVIDENCIA+DISENIO]
export function calcProteinTarget({ weightKg, heightCm, goal, resistanceDaysPerWeek }) {
  const bmi = calcBMI(weightKg, heightCm);
  const refWeight = bmi >= BMI_HIGH ? BMI_REF * Math.pow(heightCm / 100, 2) : weightKg;
  const resistance = trainsResistance(resistanceDaysPerWeek);
  const gPerKg = !resistance
    ? PROTEIN_G_PER_KG.default
    : (goal === 'lose' || goal === 'recomp' ? PROTEIN_G_PER_KG.resistanceDeficit : PROTEIN_G_PER_KG.resistanceSurplus);
  return { grams: roundTo(refWeight * gPerKg, 5), refWeight, gPerKg };
}

// Objetivo completo a partir de perfil + peso de calculo.
export function calcTargets(profile, weightKg, today = new Date()) {
  const age = calcAge(profile.birthYear, today);
  const bmr = calcBMR({ sex: profile.sex, weightKg, heightCm: profile.heightCm, age });
  const tdee = calcTDEE(bmr, profile.activityLevel);
  const { kcal, floorApplied, adjustment } = calcCalorieTarget({
    tdee, bmr, sex: profile.sex, goal: profile.goal, pace: profile.pace,
  });
  const protein = calcProteinTarget({
    weightKg, heightCm: profile.heightCm, goal: profile.goal,
    resistanceDaysPerWeek: profile.resistanceDaysPerWeek,
  });
  const expected = calcExpectedWeeklyChange(kcal, tdee, weightKg);
  return { bmr, tdee, kcal, proteinGrams: protein.grams, floorApplied, adjustment, ...expected };
}
