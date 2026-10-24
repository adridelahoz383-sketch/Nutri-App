// tests/nutrition.test.js — vectores de prueba ESPECIFICACION §8.13
import test from 'node:test';
import assert from 'node:assert/strict';
import { calcBMR, calcTDEE, calcCalorieTarget, calcProteinTarget, calcTargets, calcBMI, calcAge } from '../js/domain/nutrition.js';

const NOW = new Date(2026, 8, 24); // anio 2026

test('calcAge usa año de nacimiento', () => {
  assert.equal(calcAge(1996, NOW), 30);
});

test('vector A: male 30y 80kg 180cm moderate -> BMR 1780, TDEE 2759', () => {
  const bmr = calcBMR({ sex: 'male', weightKg: 80, heightCm: 180, age: 30 });
  assert.equal(bmr, 1780);
  assert.equal(calcTDEE(bmr, 'moderate'), 2759);
  const t = calcCalorieTarget({ tdee: 2759, bmr: 1780, sex: 'male', goal: 'lose', pace: 'moderate' });
  assert.equal(t.kcal, 2210);
  assert.equal(t.floorApplied, false);
});

test('vector B: female 25y 60kg 165cm light maintain -> BMR 1345.25, target 1850', () => {
  const bmr = calcBMR({ sex: 'female', weightKg: 60, heightCm: 165, age: 25 });
  assert.ok(Math.abs(bmr - 1345.25) < 0.001);
  const t = calcCalorieTarget({ tdee: calcTDEE(bmr, 'light'), bmr, sex: 'female', goal: 'maintain', pace: 'moderate' });
  assert.equal(t.kcal, 1850);
});

test('vector C: suelo calorico aplicado', () => {
  const bmr = calcBMR({ sex: 'female', weightKg: 50, heightCm: 150, age: 60 });
  assert.ok(Math.abs(bmr - 976.5) < 0.001);
  const tdee = calcTDEE(bmr, 'sedentary');
  const t = calcCalorieTarget({ tdee, bmr, sex: 'female', goal: 'lose', pace: 'aggressive' });
  assert.equal(t.kcal, 1200); // raw 878.85 < suelo 1200
  assert.equal(t.floorApplied, true);
});

test('vector D: unspecified 40y 70kg 170cm moderate gain/moderate', () => {
  const bmr = calcBMR({ sex: 'unspecified', weightKg: 70, heightCm: 170, age: 40 });
  assert.ok(Math.abs(bmr - 1484.5) < 0.001);
  const t = calcCalorieTarget({ tdee: calcTDEE(bmr, 'moderate'), bmr, sex: 'unspecified', goal: 'gain', pace: 'moderate' });
  assert.equal(t.kcal, 2530);
});

test('proteina: 80kg entrena 4 dias lose -> 160g', () => {
  const p = calcProteinTarget({ weightKg: 80, heightCm: 180, goal: 'lose', resistanceDaysPerWeek: 4 });
  assert.equal(p.grams, 160);
});

test('proteina: IMC>=30 usa peso de referencia -> 155g', () => {
  const p = calcProteinTarget({ weightKg: 120, heightCm: 175, goal: 'lose', resistanceDaysPerWeek: 3 });
  assert.equal(p.grams, 155); // ref 76.56 * 2.0 = 153.1 -> 155
});

test('proteina: sin fuerza -> 1.2 g/kg', () => {
  const p = calcProteinTarget({ weightKg: 80, heightCm: 180, goal: 'lose', resistanceDaysPerWeek: 0 });
  assert.equal(p.grams, 95); // 96 -> 95
});

test('proteina: fuerza + gain -> 1.8 g/kg', () => {
  const p = calcProteinTarget({ weightKg: 70, heightCm: 175, goal: 'gain', resistanceDaysPerWeek: 3 });
  assert.equal(p.grams, 125); // 126 -> 125
});

test('calcTargets integra todo', () => {
  const profile = { sex: 'male', birthYear: 1996, heightCm: 180, activityLevel: 'moderate', goal: 'lose', pace: 'moderate', resistanceDaysPerWeek: 4 };
  const t = calcTargets(profile, 80, NOW);
  assert.equal(t.bmr, 1780);
  assert.equal(t.kcal, 2210);
  assert.equal(t.proteinGrams, 160);
  assert.ok(t.weeklyKg < 0);
});

test('calcBMI', () => {
  assert.ok(Math.abs(calcBMI(80, 180) - 24.69) < 0.01);
});
