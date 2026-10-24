// js/storage/exportImport.js — exportar/importar todos los datos como JSON.
// Import valida TODO antes de escribir; si falla no modifica nada.

import * as schema from './schema.js';
import { SCHEMA_VERSION, IMPORT_MAX_BYTES, STORAGE_PREFIX } from '../config.js';

export function buildExport(state) {
  return {
    app: 'nutritrack',
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      profile: state.profile,
      settings: state.settings,
      weights: state.weights,
      customFoods: state.customFoods,
      days: state.days,
    },
  };
}

// Devuelve datos saneados listos para escribir, o lanza Error con clave de motivo.
export function parseImport(jsonText) {
  if (typeof jsonText !== 'string' || jsonText.length > IMPORT_MAX_BYTES) throw new Error('import_too_large');
  let obj;
  try { obj = JSON.parse(jsonText); } catch { throw new Error('import_not_json'); }
  if (!obj || obj.app !== 'nutritrack' || typeof obj.data !== 'object' || obj.data === null) {
    throw new Error('import_not_app');
  }
  if (obj.schemaVersion > SCHEMA_VERSION) throw new Error('import_newer_version');

  const d = obj.data;
  const profile = schema.sanitizeProfile(d.profile);
  if (!profile) throw new Error('import_bad_profile');
  const settings = schema.sanitizeSettings(d.settings);
  const weights = schema.sanitizeWeights(d.weights);
  if (!weights) throw new Error('import_bad_weights');
  const customFoods = schema.sanitizeCustomFoods(d.customFoods) ?? [];

  const days = {};
  if (d.days && typeof d.days === 'object') {
    const entries = Object.entries(d.days);
    if (entries.length > 50000) throw new Error('import_too_large');
    for (const [k, v] of entries) {
      const day = schema.sanitizeDayLog(v);
      if (day) days[k] = day;
    }
  }
  return { profile, settings, weights, customFoods, days };
}

// Escribe los datos importados (tras haber borrado). Agrupa dias por mes.
export function writeImported(repo, data) {
  repo.removeAll();
  repo.saveMeta(schema.newMeta());
  repo.saveProfile(data.profile);
  repo.saveSettings(data.settings);
  repo.saveWeights(data.weights);
  repo.saveCustomFoods(data.customFoods);
  const byMonth = {};
  for (const [date, day] of Object.entries(data.days)) {
    const mk = date.slice(0, 7);
    (byMonth[mk] ??= {})[date] = day;
  }
  for (const [mk, days] of Object.entries(byMonth)) repo.saveMonth(mk, days);
}
