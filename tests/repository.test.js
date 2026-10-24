// tests/repository.test.js — integracion de storage sobre MemoryStorage.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createMemoryStorage } from '../js/storage/memoryStorage.js';
import { createRepository, KEYS, monthKey } from '../js/storage/repository.js';
import { migrate } from '../js/storage/migrations.js';
import { sanitizeProfile, sanitizeDayLog, sanitizeFood } from '../js/storage/schema.js';

const newRepo = () => createRepository(createMemoryStorage());

const PROFILE = {
  alias: 'Ana', sex: 'female', birthYear: 1996, heightCm: 165,
  activityLevel: 'light', resistanceDaysPerWeek: 3, goal: 'lose', pace: 'moderate',
  disclaimerAcceptedAt: '2026-09-24T10:00:00.000Z',
};

test('loadAll en storage vacio: meta nuevo, resto por defecto, sin corruptos', () => {
  const repo = newRepo();
  const all = repo.loadAll();
  assert.equal(all.profile, null);
  assert.deepEqual(all.weights, []);
  assert.deepEqual(all.customFoods, []);
  assert.equal(all.corrupt.length, 0);
  assert.equal(all.meta.schemaVersion, 1);
});

test('perfil: guardar y recargar', () => {
  const repo = newRepo();
  repo.saveProfile(PROFILE);
  const all = repo.loadAll();
  assert.equal(all.profile.sex, 'female');
  assert.equal(all.profile.birthYear, 1996);
  assert.equal(all.profile.alias, 'Ana');
});

test('JSON corrupto -> fallback + registro en corrupt[]', () => {
  const repo = newRepo();
  repo.storage.setItem(KEYS.profile, '{no es json');
  repo.storage.setItem(KEYS.weights, '[{"kg":"mucho"}]'); // parsea pero no sanea -> []
  const all = repo.loadAll();
  assert.equal(all.profile, null);
  assert.ok(all.corrupt.some(c => c.key === KEYS.profile));
  assert.deepEqual(all.weights, []);
});

test('meses: saveMonth/loadMonth round-trip con saneado', () => {
  const repo = newRepo();
  const day = {
    date: '2026-09-24', targetSnapshot: { kcal: 1850, protein: 120 },
    entries: [{
      id: 'e1', meal: 'lunch', foodId: 'arroz-blanco-cocido', foodName: 'Arroz blanco cocido',
      unit: 'g', grams: 150, quantitySource: 'user', portionLabel: '1 taza',
      per100: { kcal: 130, protein: 2.7, carbs: 28.2, fat: 0.3 },
      sourceName: 'USDA FoodData Central', createdAt: 'x', updatedAt: 'x',
    }],
  };
  repo.saveMonth('2026-09', { '2026-09-24': day });
  const { days, corrupt } = repo.loadMonth('2026-09');
  assert.equal(corrupt.length, 0);
  assert.equal(days['2026-09-24'].entries[0].grams, 150);
  assert.equal(days['2026-09-24'].targetSnapshot.kcal, 1850);
  // mes vacio
  assert.deepEqual(repo.loadMonth('2026-10').days, {});
  // clave de mes correcta
  assert.equal(monthKey('2026-09'), 'nt:log:2026-09');
});

test('removeAll solo borra claves nt:*', () => {
  const storage = createMemoryStorage();
  const repo = createRepository(storage);
  storage.setItem('otra-app:clave', 'no-tocar');
  repo.saveProfile(PROFILE);
  repo.saveMonth('2026-09', {});
  repo.removeAll();
  assert.equal(storage.getItem('otra-app:clave'), 'no-tocar');
  assert.equal(storage.getItem(KEYS.profile), null);
});

test('migrate sube versiones hasta SCHEMA_VERSION', () => {
  const { schemaVersion, data } = migrate({ schemaVersion: 0 }, { profile: 'p' });
  assert.equal(schemaVersion, 1);
  assert.equal(data.profile, 'p');
});

test('sanitizeProfile rechaza perfiles incompletos', () => {
  assert.equal(sanitizeProfile({ sex: 'female' }), null);
  assert.equal(sanitizeProfile({ ...PROFILE, sex: 'otro' }), null);
  assert.equal(sanitizeProfile({ ...PROFILE, activityLevel: 'superman' }), null);
});

test('sanitizeDayLog descarta entradas invalidas pero conserva el dia', () => {
  const day = sanitizeDayLog({
    date: '2026-09-24',
    entries: [
      { id: 'ok', meal: 'lunch', foodName: 'X', grams: 100, per100: { kcal: 100, protein: 1, carbs: 20, fat: 1 } },
      { id: 'bad', meal: 'desayuno-inexistente', grams: 100, per100: { kcal: 1, protein: 0, carbs: 0, fat: 0 } },
      { id: 'bad2', meal: 'lunch', foodName: 'Y', grams: -5, per100: { kcal: 1, protein: 0, carbs: 0, fat: 0 } },
    ],
  });
  assert.equal(day.entries.length, 1);
  assert.equal(day.entries[0].id, 'ok');
});

test('sanitizeFood resiste prototype pollution en source', () => {
  const f = sanitizeFood(JSON.parse('{"id":"x","name":"X","per100":{"kcal":1,"protein":0,"carbs":0,"fat":0},"source":{"name":"s","__proto__":{"evil":1}}}'));
  assert.ok(f);
  assert.equal({}.evil, undefined);
});
