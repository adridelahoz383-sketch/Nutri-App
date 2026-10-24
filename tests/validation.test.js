import test from 'node:test';
import assert from 'node:assert/strict';
import { parseLocaleNumber, validateWeightKg, validateGrams, validateHeightCm, validateBirthYear, isSuspiciousWeightJump } from '../js/domain/validation.js';

test('parseLocaleNumber acepta coma y punto', () => {
  assert.equal(parseLocaleNumber('79,5'), 79.5);
  assert.equal(parseLocaleNumber('79.5'), 79.5);
  assert.equal(parseLocaleNumber('80'), 80);
});

test('parseLocaleNumber rechaza ambiguedad y texto', () => {
  assert.equal(parseLocaleNumber('1.234,5'), null);
  assert.equal(parseLocaleNumber('abc'), null);
  assert.equal(parseLocaleNumber(''), null);
  assert.equal(parseLocaleNumber('79,5,2'), null);
});

test('validateWeightKg rangos', () => {
  assert.equal(validateWeightKg('0').ok, false);
  assert.equal(validateWeightKg('29').ok, false);
  assert.equal(validateWeightKg('30').ok, true);
  assert.equal(validateWeightKg('300').ok, true);
  assert.equal(validateWeightKg('301').ok, false);
  assert.equal(validateWeightKg('abc').ok, false);
  assert.equal(validateWeightKg('79,5').value, 79.5);
});

test('validateGrams', () => {
  assert.equal(validateGrams('0').ok, false);
  assert.equal(validateGrams('-5').ok, false);
  assert.equal(validateGrams('5001').ok, false);
  assert.equal(validateGrams('200').ok, true);
});

test('validateHeightCm', () => {
  assert.equal(validateHeightCm('119').ok, false);
  assert.equal(validateHeightCm('165').ok, true);
  assert.equal(validateHeightCm('231').ok, false);
});

test('validateBirthYear edad 18-80', () => {
  const Y = 2026;
  assert.equal(validateBirthYear('2010', Y).error, 'age_too_young'); // 16y
  assert.equal(validateBirthYear('2008', Y).ok, true); // 18y
  assert.equal(validateBirthYear('1945', Y).error, 'age_too_old'); // 81y
  assert.equal(validateBirthYear('2030', Y).error, 'age_too_young');
  assert.equal(validateBirthYear('abc', Y).ok, false);
});

test('isSuspiciousWeightJump', () => {
  assert.equal(isSuspiciousWeightJump(82, 80, 2), false);  // +2.5% < 3%
  assert.equal(isSuspiciousWeightJump(82.5, 80, 2), true); // +3.125%
  assert.equal(isSuspiciousWeightJump(83, 80, 2), true);   // +3.75%
  assert.equal(isSuspiciousWeightJump(85, 80, 10), false); // salto grande pero >7 dias
  assert.equal(isSuspiciousWeightJump(85, 0, 2), false);   // sin peso previo
});
