// js/storage/schema.js — validacion/saneado de entidades persistidas.
// Construye objetos NUEVOS campo a campo: mitiga prototype pollution y datos corruptos.

import { MEALS, GOALS, PACES, ACTIVITY_LEVELS, LIMITS, SCHEMA_VERSION } from '../config.js';
import { isValidKey } from '../domain/dates.js';

const isObj = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const isStr = v => typeof v === 'string';
const isNum = v => typeof v === 'number' && Number.isFinite(v);
const pick = (o, keys) => {
  const out = {};
  for (const k of keys) if (k !== '__proto__' && k !== 'constructor' && k !== 'prototype') out[k] = o[k];
  return out;
};

function numIn(v, min, max) { return isNum(v) && v >= min && v <= max; }

export function sanitizePer100(v) {
  if (!isObj(v)) return null;
  const { kcal, protein, carbs, fat } = v;
  if (!numIn(kcal, 0, LIMITS.kcalPer100.max)) return null;
  if (!numIn(protein, 0, LIMITS.macroPer100.max)) return null;
  if (!numIn(carbs, 0, LIMITS.macroPer100.max)) return null;
  if (!numIn(fat, 0, LIMITS.macroPer100.max)) return null;
  const out = { kcal, protein, carbs, fat };
  if (isNum(v.fiber) && v.fiber >= 0 && v.fiber <= 100) out.fiber = v.fiber;
  return out;
}

export function sanitizePortion(v) {
  if (!isObj(v) || !isStr(v.label) || !numIn(v.grams, 1, 5000)) return null;
  return { label: v.label.slice(0, 60), grams: v.grams };
}

export function sanitizeFood(v) {
  if (!isObj(v) || !isStr(v.id) || !isStr(v.name)) return null;
  const per100 = sanitizePer100(v.per100);
  if (!per100) return null;
  const food = {
    id: v.id.slice(0, 80), name: v.name.slice(0, 80),
    aliases: Array.isArray(v.aliases) ? v.aliases.filter(isStr).map(a => a.slice(0, 60)) : [],
    category: isStr(v.category) ? v.category : 'miscelaneos',
    unit: v.unit === 'ml' ? 'ml' : 'g',
    per100,
    defaultPortion: sanitizePortion(v.defaultPortion),
    portions: Array.isArray(v.portions) ? v.portions.map(sanitizePortion).filter(Boolean) : [],
    source: isObj(v.source) && isStr(v.source.name)
      ? pick(v.source, ['name', 'ref', 'retrieved']) : { name: 'Desconocida' },
    portionSource: isStr(v.portionSource) ? v.portionSource.slice(0, 120) : '',
    isCustom: v.isCustom === true,
  };
  return food;
}

export function sanitizeProfile(v) {
  if (!isObj(v)) return null;
  if (!['male', 'female', 'unspecified'].includes(v.sex)) return null;
  if (!Number.isInteger(v.birthYear)) return null;
  if (!numIn(v.heightCm, LIMITS.heightCm.min - 5, LIMITS.heightCm.max + 5)) return null;
  if (!ACTIVITY_LEVELS.includes(v.activityLevel)) return null;
  if (!GOALS.includes(v.goal)) return null;
  if (!PACES.includes(v.pace)) return null;
  const r = v.resistanceDaysPerWeek;
  return {
    alias: isStr(v.alias) && v.alias.trim() ? v.alias.trim().slice(0, 40) : null,
    sex: v.sex,
    birthYear: v.birthYear,
    heightCm: v.heightCm,
    activityLevel: v.activityLevel,
    resistanceDaysPerWeek: (Number.isInteger(r) && r >= 0 && r <= 7) ? r : null,
    goal: v.goal,
    pace: v.pace,
    disclaimerAcceptedAt: isStr(v.disclaimerAcceptedAt) ? v.disclaimerAcceptedAt : null,
    createdAt: isStr(v.createdAt) ? v.createdAt : null,
    updatedAt: isStr(v.updatedAt) ? v.updatedAt : null,
  };
}

export function sanitizeSettings(v) {
  const s = isObj(v) ? v : {};
  return {
    weightUnit: s.weightUnit === 'lb' ? 'lb' : 'kg',
    heightUnit: s.heightUnit === 'ftin' ? 'ftin' : 'cm',
    theme: 'light',
  };
}

export function sanitizeWeightEntry(v) {
  if (!isObj(v) || !isStr(v.id) || !isValidKey(v.date)) return null;
  if (!numIn(v.kg, LIMITS.weightKg.min - 10, LIMITS.weightKg.max + 50)) return null;
  return {
    id: v.id, date: v.date, kg: v.kg,
    createdAt: isStr(v.createdAt) ? v.createdAt : null,
    updatedAt: isStr(v.updatedAt) ? v.updatedAt : null,
  };
}

export function sanitizeLogEntry(v) {
  if (!isObj(v) || !isStr(v.id) || !MEALS.includes(v.meal)) return null;
  const per100 = sanitizePer100(v.per100);
  if (!per100 || !numIn(v.grams, 0.1, 20000) || !isStr(v.foodName)) return null;
  return {
    id: v.id, meal: v.meal,
    foodId: isStr(v.foodId) ? v.foodId : 'unknown',
    foodName: v.foodName.slice(0, 100),
    unit: v.unit === 'ml' ? 'ml' : 'g',
    grams: v.grams,
    quantitySource: v.quantitySource === 'default' ? 'default' : 'user',
    portionLabel: isStr(v.portionLabel) ? v.portionLabel.slice(0, 60) : null,
    per100,
    sourceName: isStr(v.sourceName) ? v.sourceName.slice(0, 120) : '',
    createdAt: isStr(v.createdAt) ? v.createdAt : null,
    updatedAt: isStr(v.updatedAt) ? v.updatedAt : null,
  };
}

export function sanitizeDayLog(v) {
  if (!isObj(v) || !isValidKey(v.date) || !Array.isArray(v.entries)) return null;
  const ts = isObj(v.targetSnapshot) && numIn(v.targetSnapshot.kcal, 0, 10000)
    ? { kcal: v.targetSnapshot.kcal, protein: isNum(v.targetSnapshot.protein) ? v.targetSnapshot.protein : 0 }
    : null;
  return { date: v.date, entries: v.entries.map(sanitizeLogEntry).filter(Boolean), targetSnapshot: ts };
}

export function sanitizeMonthLog(v) {
  if (!isObj(v)) return null;
  const out = {};
  for (const [k, val] of Object.entries(v)) {
    if (!isValidKey(k)) continue;
    const day = sanitizeDayLog(val);
    if (day) out[k] = day;
  }
  return out;
}

export function sanitizeWeights(v) {
  if (!Array.isArray(v)) return null;
  const seen = new Set();
  const out = [];
  for (const e of v.map(sanitizeWeightEntry).filter(Boolean)) {
    if (seen.has(e.date)) continue; // unico por dia
    seen.add(e.date); out.push(e);
  }
  return out;
}

export function sanitizeCustomFoods(v) {
  if (!Array.isArray(v)) return null;
  const out = v.map(sanitizeFood).filter(Boolean);
  out.forEach(f => { f.isCustom = true; });
  return out;
}

export function sanitizeMeta(v) {
  if (!isObj(v)) return null;
  return {
    schemaVersion: Number.isInteger(v.schemaVersion) ? v.schemaVersion : 0,
    createdAt: isStr(v.createdAt) ? v.createdAt : null,
  };
}

export const newMeta = () => ({ schemaVersion: SCHEMA_VERSION, createdAt: new Date().toISOString() });
