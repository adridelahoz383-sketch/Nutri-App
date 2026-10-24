import test from 'node:test';
import assert from 'node:assert/strict';
import { kgToLb, lbToKg, cmToFtIn, ftInToCm, round1 } from '../js/domain/units.js';

test('kg <-> lb ida y vuelta', () => {
  assert.ok(Math.abs(kgToLb(80) - 176.37) < 0.01);
  assert.ok(Math.abs(lbToKg(kgToLb(80)) - 80) < 0.0001);
});

test('cm <-> ft/in', () => {
  const { ft, inch } = cmToFtIn(180);
  assert.equal(ft, 5);
  assert.ok(Math.abs(inch - 10.9) < 0.05);
  assert.ok(Math.abs(ftInToCm(5, 11) - 180.34) < 0.01);
});

test('round1', () => {
  assert.equal(round1(79.54), 79.5);
});
