import test from 'node:test';
import assert from 'node:assert/strict';
import { parseQuickInput } from '../js/domain/quickParse.js';

test('"arroz 200g"', () => {
  const r = parseQuickInput('arroz 200g');
  assert.deepEqual(r, { query: 'arroz', grams: 200 });
});

test('"arroz 200 g"', () => {
  assert.deepEqual(parseQuickInput('arroz 200 g'), { query: 'arroz', grams: 200 });
});

test('"200 g arroz"', () => {
  assert.deepEqual(parseQuickInput('200 g arroz'), { query: 'arroz', grams: 200 });
});

test('"arroz 200,5 g" coma decimal', () => {
  assert.deepEqual(parseQuickInput('arroz 200,5 g'), { query: 'arroz', grams: 200.5 });
});

test('"arroz" -> grams null', () => {
  assert.deepEqual(parseQuickInput('arroz'), { query: 'arroz', grams: null });
});

test('vacio -> error', () => {
  assert.equal(parseQuickInput('').error, 'empty');
  assert.equal(parseQuickInput('   ').error, 'empty');
});

test('cantidad al inicio y al final -> error two_amounts', () => {
  assert.equal(parseQuickInput('100 arroz 200').error, 'two_amounts');
});

test('"leche 250 ml"', () => {
  assert.deepEqual(parseQuickInput('leche 250 ml'), { query: 'leche', grams: 250 });
});

test('nombre con espacios', () => {
  assert.deepEqual(parseQuickInput('arroz integral 150'), { query: 'arroz integral', grams: 150 });
});
