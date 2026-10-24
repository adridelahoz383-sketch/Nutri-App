import test from 'node:test';
import assert from 'node:assert/strict';
import { computeTrend, weightStats, linearSlope, weeklyAverages } from '../js/domain/weight.js';

const E = (date, kg) => ({ id: date, date, kg, createdAt: '', updatedAt: '' });

test('computeTrend: primer punto = primer peso', () => {
  const t = computeTrend([E('2026-09-01', 80), E('2026-09-02', 79)]);
  assert.equal(t[0].trend, 80);
  // aeff = 0.1 para 1 dia: 80 + 0.1*(79-80) = 79.9
  assert.ok(Math.abs(t[1].trend - 79.9) < 0.001);
});

test('computeTrend maneja huecos de 30 dias', () => {
  const t = computeTrend([E('2026-08-01', 80), E('2026-08-31', 78)]);
  const aeff = 1 - Math.pow(0.9, 30);
  const expected = 80 + aeff * (78 - 80);
  assert.ok(Math.abs(t[1].trend - expected) < 0.001);
});

test('weightStats con 1 registro: sin tendencia ni ritmo', () => {
  const s = weightStats([E('2026-09-20', 80)], 'lose', '2026-09-24');
  assert.equal(s.initial, 80);
  assert.equal(s.current, 80);
  assert.equal(s.diffAbs, 0);
  assert.equal(s.hasTrend, false);
  assert.equal(s.assessment, 'insufficient');
  assert.equal(s.weightForCalc, 80);
});

test('weightStats: tendencia con >=3 registros y >=7 dias', () => {
  const s = weightStats([
    E('2026-09-01', 80), E('2026-09-05', 79.6), E('2026-09-09', 79.2),
  ], 'lose', '2026-09-24');
  assert.equal(s.hasTrend, true);
  assert.ok(s.trendCurrent < 80);
  assert.equal(s.weightForCalc, s.trendCurrent);
  // aun < 4 registros -> sin valoracion de ritmo
  assert.equal(s.ratePerWeek, null);
});

test('weightStats: ritmo con 4+ registros y >=14 dias', () => {
  const s = weightStats([
    E('2026-08-20', 82), E('2026-08-27', 81.4), E('2026-09-03', 80.9), E('2026-09-10', 80.3),
  ], 'lose', '2026-09-24');
  assert.equal(s.hasRate, true);
  assert.ok(s.ratePerWeek < 0);
  assert.ok(s.ratePerWeek < -0.4 && s.ratePerWeek > -0.7); // pendiente -0.08 kg/dia * 7
});

test('valoracion on_track para perdida razonable', () => {
  // ~ -0.6 %/semana con 80kg => dentro de -1.0..-0.25
  const s = weightStats([
    E('2026-08-20', 80), E('2026-08-27', 79.5), E('2026-09-03', 79.0), E('2026-09-10', 78.5),
  ], 'lose', '2026-09-24');
  assert.equal(s.assessment, 'on_track');
});

test('linearSlope', () => {
  const pts = [{ x: 0, y: 80 }, { x: 7, y: 79 }, { x: 14, y: 78 }];
  assert.ok(Math.abs(linearSlope(pts) - (-2 / 14)) < 0.001);
});

test('weeklyAverages agrupa por semana ISO', () => {
  const w = weeklyAverages([
    E('2026-09-14', 80), E('2026-09-16', 79), E('2026-09-21', 78.5),
  ]);
  assert.equal(w.length, 2);
  assert.ok(Math.abs(w[0].avg - 79.5) < 0.001);
  assert.equal(w[1].avg, 78.5);
});

test('diffPct', () => {
  const s = weightStats([E('2026-09-01', 80), E('2026-09-08', 78)], 'lose', '2026-09-24');
  assert.ok(Math.abs(s.diffPct - (-2.5)) < 0.001);
});
