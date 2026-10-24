import test from 'node:test';
import assert from 'node:assert/strict';
import { dateKey, todayKey, parseKey, isValidKey, addDays, daysBetween, isFutureKey, monthKey, isoWeekKey, formatDay } from '../js/domain/dates.js';

test('dateKey produce YYYY-MM-DD local', () => {
  assert.equal(dateKey(new Date(2026, 8, 5)), '2026-09-05');
  assert.equal(todayKey(new Date(2026, 0, 1)), '2026-01-01');
});

test('parseKey valida fechas reales', () => {
  assert.ok(parseKey('2026-02-28'));
  assert.equal(parseKey('2026-02-30'), null); // dia inexistente
  assert.equal(parseKey('2026-13-01'), null);
  assert.equal(parseKey('abc'), null);
  assert.equal(parseKey('2026-9-5'), null); // requiere padding
  assert.equal(isValidKey('2026-09-24'), true);
});

test('addDays y daysBetween', () => {
  assert.equal(addDays('2026-09-30', 1), '2026-10-01');
  assert.equal(addDays('2026-01-01', -1), '2025-12-31');
  assert.equal(daysBetween('2026-09-01', '2026-09-08'), 7);
  assert.equal(daysBetween('2026-09-08', '2026-09-01'), -7);
});

test('isFutureKey y monthKey', () => {
  assert.equal(isFutureKey('2026-09-25', '2026-09-24'), true);
  assert.equal(isFutureKey('2026-09-24', '2026-09-24'), false);
  assert.equal(monthKey('2026-09-24'), '2026-09');
});

test('isoWeekKey agrupa lunes-domingo', () => {
  assert.equal(isoWeekKey('2026-09-14'), isoWeekKey('2026-09-16')); // misma semana ISO
  assert.notEqual(isoWeekKey('2026-09-14'), isoWeekKey('2026-09-21')); // lunes siguiente
  assert.match(isoWeekKey('2026-09-14'), /^\d{4}-W\d{2}$/);
});

test('formatDay: Hoy/Ayer/formato corto', () => {
  const today = '2026-09-24';
  assert.equal(formatDay(today, today), 'Hoy');
  assert.equal(formatDay('2026-09-23', today), 'Ayer');
  assert.match(formatDay('2026-09-10', today), /10/);
});
