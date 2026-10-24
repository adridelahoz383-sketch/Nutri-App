// js/storage/repository.js — acceso a localStorage con validacion de esquema.
// Factory: createRepository(storage) — inyectable para tests (MemoryStorage).

import * as ss from './safeStorage.js';
import * as schema from './schema.js';
import { migrate } from './migrations.js';
import { STORAGE_PREFIX } from '../config.js';

export const KEYS = {
  meta: `${STORAGE_PREFIX}meta`,
  profile: `${STORAGE_PREFIX}profile`,
  settings: `${STORAGE_PREFIX}settings`,
  weights: `${STORAGE_PREFIX}weights`,
  customFoods: `${STORAGE_PREFIX}customFoods`,
};
export const monthKey = yyyyMM => `${STORAGE_PREFIX}log:${yyyyMM}`;
export const corruptKey = key => `${STORAGE_PREFIX}corrupt:${key}:${Date.now()}`;

export function createRepository(storage) {

  function readSanitized(key, sanitizer, fallback, corrupt) {
    const res = ss.getJSON(storage, key);
    if (!res.ok) {
      if (res.reason === 'parse' && res.raw != null) corrupt.push({ key, raw: res.raw });
      return fallback;
    }
    const clean = sanitizer(res.value);
    if (clean === null) {
      corrupt.push({ key, raw: res.raw ?? JSON.stringify(res.value) });
      return fallback;
    }
    return clean;
  }

  return {
    storage,

    loadAll() {
      const corrupt = [];
      let meta = readSanitized(KEYS.meta, schema.sanitizeMeta, null, corrupt);
      const profile = readSanitized(KEYS.profile, schema.sanitizeProfile, null, corrupt);
      const settings = readSanitized(KEYS.settings, schema.sanitizeSettings, schema.sanitizeSettings({}), corrupt);
      const weights = readSanitized(KEYS.weights, schema.sanitizeWeights, [], corrupt) ?? [];
      const customFoods = readSanitized(KEYS.customFoods, schema.sanitizeCustomFoods, [], corrupt) ?? [];
      if (!meta) { meta = schema.newMeta(); this.saveMeta(meta); }
      else if (meta.schemaVersion < 1) { this.saveMeta({ ...meta, schemaVersion: 1 }); }
      const { data } = migrate(meta, { profile, settings, weights, customFoods });
      return { meta, ...data, corrupt };
    },

    loadMonth(yyyyMM) {
      const key = monthKey(yyyyMM);
      const corrupt = [];
      const days = readSanitized(key, schema.sanitizeMonthLog, {}, corrupt);
      return { days: days ?? {}, corrupt };
    },

    saveMeta: v => ss.setJSON(storage, KEYS.meta, v),
    saveProfile: v => ss.setJSON(storage, KEYS.profile, v),
    saveSettings: v => ss.setJSON(storage, KEYS.settings, v),
    saveWeights: v => ss.setJSON(storage, KEYS.weights, v),
    saveCustomFoods: v => ss.setJSON(storage, KEYS.customFoods, v),
    saveMonth(yyyyMM, days) { ss.setJSON(storage, monthKey(yyyyMM), days); },

    backupCorrupt(key, raw) {
      try { ss.setJSON(storage, corruptKey(key), String(raw).slice(0, 200000)); } catch { /* noop */ }
    },

    listCorruptKeys() {
      return ss.keysWithPrefix(storage, `${STORAGE_PREFIX}corrupt:`);
    },

    // Borra SOLO claves nt:* (incluye logs y corrupt).
    removeAll() {
      for (const k of ss.keysWithPrefix(storage, STORAGE_PREFIX)) ss.remove(storage, k);
    },
  };
}
