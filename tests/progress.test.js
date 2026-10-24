import test from 'node:test';
import assert from 'node:assert/strict';
import { pctOf, dayStatus } from '../js/domain/progress.js';

test('pctOf', () => {
  assert.equal(pctOf(1540, 2210).toFixed(1), '69.7');
  assert.equal(pctOf(0, 2210), 0);
  assert.equal(pctOf(100, 0), 0);
});

test('dayStatus: <90 under, 90-105 on_track, >105 over', () => {
  assert.equal(dayStatus(1000, 2000), 'under');
  assert.equal(dayStatus(1900, 2000), 'on_track');
  assert.equal(dayStatus(2100, 2000), 'on_track');
  assert.equal(dayStatus(2200, 2000), 'over');
});
