// tests/foods.test.js — integridad de la base de alimentos estatica.
import test from 'node:test';
import assert from 'node:assert/strict';
import { FOODS, FOOD_CATEGORIES } from '../data/foods.js';
import { sanitizeFood } from '../js/storage/schema.js';
import { atwaterCheck } from '../js/domain/portions.js';

test('>= 120 alimentos', () => {
  assert.ok(FOODS.length >= 120, `solo ${FOODS.length} alimentos`);
});

test('ids unicos y categorias validas', () => {
  const ids = new Set();
  for (const f of FOODS) {
    assert.ok(!ids.has(f.id), `id duplicado: ${f.id}`);
    ids.add(f.id);
    assert.ok(FOOD_CATEGORIES.includes(f.category), `categoria desconocida: ${f.category} (${f.id})`);
  }
});

test('todos pasan sanitizeFood (JSON round-trip)', () => {
  for (const f of FOODS) {
    const clean = sanitizeFood(JSON.parse(JSON.stringify(f)));
    assert.ok(clean, `no sanea: ${f.id}`);
    assert.equal(clean.id, f.id);
    assert.equal(clean.defaultPortion !== null || f.portions.length > 0, true,
      `sin porcion de referencia: ${f.id}`);
  }
});

test('porciones dentro de rango', () => {
  for (const f of FOODS) {
    assert.ok(f.defaultPortion.grams >= 1 && f.defaultPortion.grams <= 5000, f.id);
    for (const p of f.portions) {
      assert.ok(p.grams >= 1 && p.grams <= 5000, `${f.id} ${p.label}`);
      assert.ok(p.label.length > 0, f.id);
    }
  }
});

test('coherencia Atwater en >= 85% (fibra y redondeos explican el resto)', () => {
  const bad = FOODS.filter(f => !atwaterCheck(f.per100));
  const pct = bad.length / FOODS.length;
  assert.ok(pct <= 0.15, `Atwater falla en ${bad.length}: ${bad.slice(0, 8).map(f => f.id).join(', ')}`);
});

test('sin aliases duplicados dentro de un alimento', () => {
  for (const f of FOODS) {
    const set = new Set(f.aliases.map(a => a.toLowerCase()));
    assert.equal(set.size, f.aliases.length, f.id);
  }
});
