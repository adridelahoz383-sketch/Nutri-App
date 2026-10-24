// js/domain/validation.js — parseo y validacion de entradas del usuario.
// Devuelven { ok: true, value } o { ok: false, error: '<clave de error>' }.

import { LIMITS } from '../config.js';

// Acepta "79,5" y "79.5". Rechaza texto, ambiguedad de separadores y vacio.
export function parseLocaleNumber(str) {
  if (typeof str === 'number') return Number.isFinite(str) ? str : null;
  if (typeof str !== 'string') return null;
  const s = str.trim();
  if (!s) return null;
  if (s.includes(',') && s.includes('.')) return null; // ambiguo: "1.234,5"
  const norm = s.replace(',', '.');
  if (!/^-?\d+(\.\d+)?$/.test(norm)) return null;
  const n = parseFloat(norm);
  return Number.isFinite(n) ? n : null;
}

const inRange = (n, { min, max }) => n >= min && n <= max;
const ok = value => ({ ok: true, value });
const fail = error => ({ ok: false, error });

export function validateGrams(str) {
  const n = parseLocaleNumber(str);
  if (n === null) return fail('grams_invalid');
  if (!inRange(n, LIMITS.grams)) return fail('grams_range');
  return ok(n);
}

export function validateWeightKg(str) {
  const n = parseLocaleNumber(str);
  if (n === null) return fail('weight_invalid');
  if (!inRange(n, LIMITS.weightKg)) return fail('weight_range');
  return ok(n);
}

export function validateHeightCm(str) {
  const n = parseLocaleNumber(str);
  if (n === null) return fail('height_invalid');
  if (!inRange(n, LIMITS.heightCm)) return fail('height_range');
  return ok(n);
}

// Año de nacimiento: edad resultante 18-80.
export function validateBirthYear(str, currentYear = new Date().getFullYear()) {
  const n = parseLocaleNumber(str);
  if (n === null || !Number.isInteger(n)) return fail('birthyear_invalid');
  const age = currentYear - n;
  if (age < LIMITS.age.min) return fail('age_too_young');
  if (age > LIMITS.age.max) return fail('age_too_old');
  return ok(n);
}

export function validateName(str) {
  if (typeof str !== 'string') return fail('name_invalid');
  const v = str.trim();
  if (v.length < LIMITS.name.min || v.length > LIMITS.name.max) return fail('name_range');
  return ok(v);
}

export function validateKcalPer100(str) {
  const n = parseLocaleNumber(str);
  if (n === null || !inRange(n, LIMITS.kcalPer100)) return fail('kcal_range');
  return ok(n);
}

export function validateMacroPer100(str, allowEmpty = true) {
  if (typeof str === 'string' && str.trim() === '' && allowEmpty) return ok(0);
  const n = parseLocaleNumber(str);
  if (n === null || !inRange(n, LIMITS.macroPer100)) return fail('macro_range');
  return ok(n);
}

export function validatePortionGrams(str) {
  const n = parseLocaleNumber(str);
  if (n === null || !inRange(n, LIMITS.portionGrams)) return fail('portion_range');
  return ok(n);
}

export function isSuspiciousWeightJump(newKg, prevKg, daysSincePrev) {
  if (!prevKg || !daysSincePrev || daysSincePrev > 7) return false;
  return Math.abs(newKg - prevKg) / prevKg * 100 > 3;
}
