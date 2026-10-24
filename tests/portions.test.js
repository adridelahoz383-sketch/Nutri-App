import test from 'node:test';
import assert from 'node:assert/strict';
import { scaleNutrients, entryNutrients, sumNutrients, atwaterCheck } from '../js/domain/portions.js';

const rice = { kcal: 130, protein: 2.7, carbs: 28.2, fat: 0.3 };

test('scaleNutrients: 200 g de arroz = 260 kcal', () => {
  const n = scaleNutrients(rice, 200);
  assert.equal(n.kcal, 260);
  assert.ok(Math.abs(n.protein - 5.4) < 0.001);
});

test('scaleNutrients: 0 g -> 0', () => {
  assert.equal(scaleNutrients(rice, 0).kcal, 0);
});

test('entryNutrients usa per100 x grams/100', () => {
  const e = { per100: { kcal: 89, protein: 1.1, carbs: 22.8, fat: 0.3 }, grams: 118 };
  assert.ok(Math.abs(entryNutrients(e).kcal - 105.02) < 0.01);
});

test('sumNutrients no redondea intermedio', () => {
  const list = [
    { per100: rice, grams: 150 },
    { per100: rice, grams: 75 },
  ];
  const t = sumNutrients(list);
  assert.ok(Math.abs(t.kcal - 292.5) < 0.001);
});

test('atwaterCheck acepta coherencia', () => {
  assert.equal(atwaterCheck(rice), true); // 4*2.7+4*28.2+9*0.3 = 126.3 vs 130
  assert.equal(atwaterCheck({ kcal: 500, protein: 1, carbs: 1, fat: 1 }), false);
});
