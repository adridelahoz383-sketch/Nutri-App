import test from 'node:test';
import assert from 'node:assert/strict';
import { normalize, buildIndex, searchFoods, scoreFood } from '../js/domain/foodSearch.js';

const FOODS = [
  { id: 'platano', name: 'Plátano cocido', aliases: ['plátano verde'] },
  { id: 'banano', name: 'Banano (guineo)', aliases: ['banana', 'guineo'] },
  { id: 'arroz', name: 'Arroz blanco cocido', aliases: ['arroz'] },
  { id: 'arroz-int', name: 'Arroz integral cocido', aliases: [] },
];

const idx = buildIndex(FOODS);

test('normalize quita tildes y baja a minusculas', () => {
  assert.equal(normalize('Plátano  COCIDO'), 'platano cocido');
  assert.equal(normalize('Árroz'), 'arroz');
});

test('busca por nombre sin tildes', () => {
  const r = searchFoods('platano', idx);
  assert.equal(r[0].id, 'platano');
});

test('busca por alias', () => {
  const r = searchFoods('guineo', idx);
  assert.equal(r[0].id, 'banano');
});

test('ranking: exacto antes que parcial', () => {
  const r = searchFoods('arroz', idx);
  assert.equal(r[0].id, 'arroz');
});

test('typo de 1 letra en palabra larga', () => {
  const r = searchFoods('bananos', idx); // empieza por -> score 80 anyway
  assert.equal(r[0].id, 'banano');
  const r2 = searchFoods('platao', idx);
  assert.equal(r2[0].id, 'platano');
});

test('sin resultados -> []', () => {
  assert.deepEqual(searchFoods('xyzq', idx), []);
  assert.deepEqual(searchFoods('', idx), []);
});
