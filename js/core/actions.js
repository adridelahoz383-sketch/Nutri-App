// js/core/actions.js — unica via para mutar el estado y persistir.
// createActions({ store, repository }) -> { ...acciones }

import { MEALS } from '../config.js';
import { validateGrams, validateWeightKg } from '../domain/validation.js';
import { monthKey as monthOf, nowIso } from '../domain/dates.js';
import { selectAllFoods, selectTargets, selectWeightForCalc } from './selectors.js';
import { buildExport, parseImport, writeImported } from '../storage/exportImport.js';

const uuid = () => (globalThis.crypto?.randomUUID?.() ??
  'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10));

const clone = o => (globalThis.structuredClone ? structuredClone(o) : JSON.parse(JSON.stringify(o)));

export function createActions({ store, repository, onError }) {
  const persist = fn => {
    try { fn(); } catch (e) {
      onError?.('quota', e);
    }
  };

  // Asegura que el mes de `date` esta cargado en memoria (carga perezosa).
  function ensureMonthLoaded(date) {
    const mk = monthOf(date);
    if (store.getState().loadedMonths?.has(mk)) return;
    const { days } = repository.loadMonth(mk);
    store.setState(s => ({
      ...s,
      days: { ...s.days, ...days },
      loadedMonths: new Set([...(s.loadedMonths ?? []), mk]),
    }));
  }

  function persistMonthOf(date) {
    const mk = monthOf(date);
    const monthDays = {};
    for (const [d, day] of Object.entries(store.getState().days)) {
      if (d.startsWith(mk)) monthDays[d] = day;
    }
    persist(() => repository.saveMonth(mk, monthDays));
  }

  function withSnapshot(day, state) {
    const t = selectTargets(state);
    const snapshot = t ? { kcal: t.kcal, protein: t.proteinGrams } : (day?.targetSnapshot ?? null);
    return { date: day?.date ?? '', entries: day?.entries ?? [], ...day, targetSnapshot: snapshot };
  }

  function writeDay(date, day) {
    store.setState(s => ({ ...s, days: { ...s.days, [date]: day } }));
    persistMonthOf(date);
  }

  return {
    ensureMonthLoaded,

    saveProfile(input) {
      const now = nowIso();
      const prev = store.getState().profile;
      const profile = { ...input, createdAt: prev?.createdAt ?? now, updatedAt: now };
      store.setState(s => ({ ...s, profile }));
      persist(() => repository.saveProfile(profile));
      return profile;
    },

    updateSettings(patch) {
      const settings = { ...store.getState().settings, ...patch };
      store.setState(s => ({ ...s, settings }));
      persist(() => repository.saveSettings(settings));
    },

    addEntry(date, meal, { foodId, grams, portionLabel }) {
      if (!MEALS.includes(meal)) throw new Error('bad_meal');
      const state = store.getState();
      const food = selectAllFoods(state).find(f => f.id === foodId);
      if (!food) throw new Error('food_not_found');
      const g = grams ?? food.defaultPortion?.grams ?? 100;
      const vg = validateGrams(g);
      if (!vg.ok) throw new Error(vg.error);
      const now = nowIso();
      const entry = {
        id: uuid(), meal, foodId: food.id, foodName: food.name, unit: food.unit,
        grams: vg.value,
        quantitySource: grams == null ? 'default' : 'user',
        portionLabel: grams == null ? (food.defaultPortion?.label ?? null) : (portionLabel ?? null),
        per100: { kcal: food.per100.kcal, protein: food.per100.protein, carbs: food.per100.carbs, fat: food.per100.fat },
        sourceName: food.source?.name ?? '',
        createdAt: now, updatedAt: now,
      };
      ensureMonthLoaded(date);
      const day = withSnapshot(store.getState().days[date] ?? { date, entries: [] }, store.getState());
      writeDay(date, { ...day, date, entries: [...day.entries, entry] });
      return entry;
    },

    updateEntry(date, id, patch) {
      const day = store.getState().days[date];
      const entry = day?.entries.find(e => e.id === id);
      if (!entry) return null;
      const updated = { ...entry, updatedAt: nowIso() };
      if (patch.grams !== undefined) {
        const vg = validateGrams(patch.grams);
        if (!vg.ok) throw new Error(vg.error);
        updated.grams = vg.value;
        updated.quantitySource = 'user';
      }
      if (patch.portionLabel !== undefined) updated.portionLabel = patch.portionLabel;
      if (patch.meal && MEALS.includes(patch.meal)) updated.meal = patch.meal;
      writeDay(date, {
        ...day,
        entries: day.entries.map(e => (e.id === id ? updated : e)),
      });
      return updated;
    },

    removeEntry(date, id) {
      const day = store.getState().days[date];
      const entry = day?.entries.find(e => e.id === id);
      if (!entry) return null;
      writeDay(date, { ...day, entries: day.entries.filter(e => e.id !== id) });
      return entry;
    },

    restoreEntry(date, entry) {
      const day = withSnapshot(store.getState().days[date] ?? { date, entries: [] }, store.getState());
      if (day.entries.some(e => e.id === entry.id)) return; // ya restaurada
      writeDay(date, { ...day, date, entries: [...day.entries, clone(entry)] });
    },

    addCustomFood(input) {
      const now = nowIso();
      const food = {
        id: `custom-${uuid()}`,
        name: input.name,
        aliases: input.aliases ?? [],
        category: input.category ?? 'miscelaneos',
        unit: input.unit === 'ml' ? 'ml' : 'g',
        per100: input.per100,
        defaultPortion: input.defaultPortion ?? null,
        portions: input.portions ?? [],
        source: { name: 'Tú (personalizado)', ref: null, retrieved: now.slice(0, 7) },
        portionSource: 'personalizado',
        isCustom: true,
      };
      const list = [...store.getState().customFoods, food];
      store.setState(s => ({ ...s, customFoods: list }));
      persist(() => repository.saveCustomFoods(list));
      return food;
    },

    updateCustomFood(id, patch) {
      const list = store.getState().customFoods.map(f => (f.id === id ? { ...f, ...patch, isCustom: true } : f));
      store.setState(s => ({ ...s, customFoods: list }));
      persist(() => repository.saveCustomFoods(list));
    },

    removeCustomFood(id) {
      const list = store.getState().customFoods.filter(f => f.id !== id);
      store.setState(s => ({ ...s, customFoods: list }));
      persist(() => repository.saveCustomFoods(list));
    },

    // Un registro por dia: reemplaza si existe.
    upsertWeight(date, kgInput) {
      const v = validateWeightKg(kgInput);
      if (!v.ok) throw new Error(v.error);
      const now = nowIso();
      const weights = [...store.getState().weights];
      const i = weights.findIndex(w => w.date === date);
      const prevKcal = selectTargets(store.getState())?.kcal ?? null;
      if (i >= 0) weights[i] = { ...weights[i], kg: v.value, updatedAt: now };
      else weights.push({ id: uuid(), date, kg: v.value, createdAt: now, updatedAt: now });
      weights.sort((a, b) => a.date.localeCompare(b.date));
      store.setState(s => ({ ...s, weights }));
      persist(() => repository.saveWeights(weights));
      const newKcal = selectTargets(store.getState())?.kcal ?? null;
      return { entry: i >= 0 ? weights[i] : weights[weights.length - 1], targetChanged: prevKcal !== null && newKcal !== null && Math.abs(newKcal - prevKcal) >= 50, newKcal };
    },

    removeWeight(id) {
      const weights = store.getState().weights.filter(w => w.id !== id);
      store.setState(s => ({ ...s, weights }));
      persist(() => repository.saveWeights(weights));
    },

    exportData() {
      return JSON.stringify(buildExport(store.getState()), null, 2);
    },

    importData(jsonText) {
      const data = parseImport(jsonText); // lanza si invalido — no toca nada
      writeImported(repository, data);
      // Recargar desde storage para consistencia
      const all = repository.loadAll();
      store.setState(s => ({
        ...s,
        profile: data.profile, settings: data.settings,
        weights: data.weights, customFoods: data.customFoods,
        days: data.days, loadedMonths: new Set(Object.keys(data.days).map(d => d.slice(0, 7))),
        meta: all.meta,
      }));
      return data;
    },

    wipeAllData() {
      repository.removeAll();
    },
  };
}
