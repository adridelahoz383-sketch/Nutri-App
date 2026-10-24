// tests/actions.test.js — integracion: store + actions + repository (MemoryStorage).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createMemoryStorage } from '../js/storage/memoryStorage.js';
import { createRepository, KEYS } from '../js/storage/repository.js';
import { createStore } from '../js/core/store.js';
import { createActions } from '../js/core/actions.js';
import { selectDayTotals, selectTargets } from '../js/core/selectors.js';

function setup() {
  const repository = createRepository(createMemoryStorage());
  const store = createStore({
    profile: null,
    settings: { weightUnit: 'kg', heightUnit: 'cm', theme: 'light' },
    weights: [], customFoods: [], days: {}, loadedMonths: new Set(),
    meta: null,
  });
  const actions = createActions({ store, repository });
  return { repository, store, actions };
}

const PROFILE = {
  alias: null, sex: 'male', birthYear: 1996, heightCm: 180,
  activityLevel: 'moderate', resistanceDaysPerWeek: 4, goal: 'lose', pace: 'moderate',
  disclaimerAcceptedAt: '2026-09-01T00:00:00.000Z',
};

test('saveProfile persiste y rehidrata', () => {
  const { repository, actions } = setup();
  actions.saveProfile(PROFILE);
  const all = repository.loadAll();
  assert.equal(all.profile.sex, 'male');
  assert.equal(all.profile.heightCm, 180);
});

test('addEntry con gramos: snapshot nutricional + quantitySource user', () => {
  const { store, actions } = setup();
  actions.saveProfile(PROFILE);
  actions.upsertWeight('2026-09-20', 80);
  const e = actions.addEntry('2026-09-24', 'lunch', { foodId: 'arroz-blanco-cocido', grams: 200 });
  assert.equal(e.quantitySource, 'user');
  assert.equal(e.per100.kcal, 130); // snapshot, no referencia
  const totals = selectDayTotals(store.getState(), '2026-09-24');
  assert.ok(Math.abs(totals.kcal - 260) < 0.001);
});

test('addEntry sin gramos: porcion por defecto + quantitySource default', () => {
  const { store, actions } = setup();
  const e = actions.addEntry('2026-09-24', 'breakfast', { foodId: 'arroz-blanco-cocido' });
  assert.equal(e.quantitySource, 'default');
  assert.equal(e.grams, 150);
  assert.equal(e.portionLabel, '1 taza');
});

test('dia guarda targetSnapshot si hay objetivos', () => {
  const { store, actions } = setup();
  actions.saveProfile(PROFILE);
  actions.upsertWeight('2026-09-20', 80);
  actions.addEntry('2026-09-24', 'lunch', { foodId: 'arroz-blanco-cocido', grams: 100 });
  const day = store.getState().days['2026-09-24'];
  const t = selectTargets(store.getState());
  assert.equal(day.targetSnapshot.kcal, t.kcal);
  assert.equal(day.targetSnapshot.protein, t.proteinGrams);
});

test('updateEntry y removeEntry/restoreEntry', () => {
  const { store, actions } = setup();
  const e = actions.addEntry('2026-09-24', 'snack', { foodId: 'arroz-blanco-cocido', grams: 100 });
  actions.updateEntry('2026-09-24', e.id, { grams: 250 });
  assert.equal(store.getState().days['2026-09-24'].entries[0].grams, 250);
  const removed = actions.removeEntry('2026-09-24', e.id);
  assert.equal(store.getState().days['2026-09-24'].entries.length, 0);
  actions.restoreEntry('2026-09-24', removed);
  assert.equal(store.getState().days['2026-09-24'].entries.length, 1);
});

test('addEntry valida: comida desconocida, alimento inexistente, gramos invalidos', () => {
  const { actions } = setup();
  assert.throws(() => actions.addEntry('2026-09-24', 'brunch', { foodId: 'x' }), /bad_meal/);
  assert.throws(() => actions.addEntry('2026-09-24', 'lunch', { foodId: 'no-existe' }), /food_not_found/);
  assert.throws(() => actions.addEntry('2026-09-24', 'lunch', { foodId: 'arroz-blanco-cocido', grams: 99999 }), /grams_range/);
});

test('upsertWeight: uno por dia, ordenado, validacion', () => {
  const { store, actions } = setup();
  actions.upsertWeight('2026-09-22', '81');
  actions.upsertWeight('2026-09-20', 80.5);
  actions.upsertWeight('2026-09-22', '80,9'); // reemplaza el del mismo dia
  const w = store.getState().weights;
  assert.equal(w.length, 2);
  assert.equal(w[0].date, '2026-09-20');
  assert.equal(w[1].kg, 80.9);
  assert.throws(() => actions.upsertWeight('2026-09-23', 'quince'), /weight_invalid/);
});

test('addCustomFood entra en busqueda y persiste', () => {
  const { repository, store, actions } = setup();
  const food = actions.addCustomFood({
    name: 'Mi mezcla', per100: { kcal: 200, protein: 10, carbs: 20, fat: 8 },
  });
  assert.ok(food.id.startsWith('custom-'));
  assert.equal(store.getState().customFoods.length, 1);
  const all = repository.loadAll();
  assert.equal(all.customFoods[0].name, 'Mi mezcla');
  // se puede registrar como entrada
  const e = actions.addEntry('2026-09-24', 'dinner', { foodId: food.id, grams: 50 });
  assert.equal(e.per100.kcal, 200);
});

test('export/import round-trip', () => {
  const { store, repository, actions } = setup();
  actions.saveProfile(PROFILE);
  actions.upsertWeight('2026-09-20', 80);
  actions.upsertWeight('2026-09-21', 79.8);
  actions.addEntry('2026-09-24', 'lunch', { foodId: 'arroz-blanco-cocido', grams: 200 });
  const json = actions.exportData();

  // nueva app sobre storage nuevo
  const repo2 = createRepository(createMemoryStorage());
  const store2 = createStore({
    profile: null, settings: {}, weights: [], customFoods: [], days: {}, loadedMonths: new Set(), meta: null,
  });
  const actions2 = createActions({ store: store2, repository: repo2 });
  actions2.importData(json);

  const s2 = store2.getState();
  assert.equal(s2.profile.sex, 'male');
  assert.equal(s2.weights.length, 2);
  assert.equal(s2.days['2026-09-24'].entries[0].grams, 200);
  // y persiste en el nuevo storage
  assert.equal(repo2.loadAll().weights.length, 2);
});

test('importData invalido lanza sin tocar datos', () => {
  const { store, actions } = setup();
  actions.saveProfile(PROFILE);
  assert.throws(() => actions.importData('{"app":"otra"}'), /import_not_app/);
  assert.throws(() => actions.importData('no json'), /import_not_json/);
  assert.equal(store.getState().profile.sex, 'male'); // intacto
});
