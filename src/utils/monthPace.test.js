/**
 * Ritmo del mes (días restantes, cupo diario, proyección).
 * Ejecutar: node src/utils/monthPace.test.js
 */
import assert from 'node:assert/strict';
import { getMonthPace } from './monthPace.js';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`ok  ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL ${name}`);
    console.error(`     ${error.message}`);
  }
}

test('septiembre 15: 16 días restantes (incluye hoy)', () => {
  const pace = getMonthPace({
    totalIncome: 320000,
    totalExpenses: 80000,
    now: new Date(2026, 8, 15),
  });
  assert.equal(pace.daysInMonth, 30);
  assert.equal(pace.daysElapsed, 15);
  assert.equal(pace.daysRemaining, 16);
  assert.equal(pace.hasIncome, true);
});

test('cupo diario = saldo / días restantes si hay saldo', () => {
  const pace = getMonthPace({
    totalIncome: 300000,
    totalExpenses: 100000,
    balance: 200000,
    now: new Date(2026, 8, 15),
  });
  assert.equal(pace.dailyAllowance, Math.round(200000 / 16));
});

test('sin saldo no sugiere cupo diario', () => {
  const pace = getMonthPace({
    totalIncome: 100000,
    totalExpenses: 100000,
    now: new Date(2026, 8, 10),
  });
  assert.equal(pace.dailyAllowance, null);
});

test('proyección se queda corta si el promedio diario es alto', () => {
  const pace = getMonthPace({
    totalIncome: 200000,
    totalExpenses: 150000,
    now: new Date(2026, 8, 15),
  });
  assert.equal(pace.willRunShort, true);
});

test('sin gastos el ritmo no se queda corto', () => {
  const pace = getMonthPace({
    totalIncome: 200000,
    totalExpenses: 0,
    now: new Date(2026, 8, 10),
  });
  assert.equal(pace.willRunShort, false);
  assert.equal(pace.avgDailyExpense, 0);
});

test('sin ingresos: empty, no rompe el cálculo', () => {
  const pace = getMonthPace({
    totalIncome: 0,
    totalExpenses: 0,
    now: new Date(2026, 8, 1),
  });
  assert.equal(pace.hasIncome, false);
  assert.equal(pace.daysRemaining, 30);
  assert.equal(pace.willRunShort, false);
});

test('último día del mes: 1 día restante', () => {
  const pace = getMonthPace({
    totalIncome: 100000,
    totalExpenses: 40000,
    now: new Date(2026, 8, 30),
  });
  assert.equal(pace.daysRemaining, 1);
  assert.equal(pace.dailyAllowance, 60000);
});

test('mes anterior: cerrado, promedio sobre el mes completo', () => {
  const pace = getMonthPace({
    totalIncome: 300000,
    totalExpenses: 93000,
    month: 7,
    year: 2026,
    now: new Date(2026, 8, 15),
  });
  assert.equal(pace.daysInMonth, 31);
  assert.equal(pace.daysElapsed, 31);
  assert.equal(pace.daysRemaining, 0);
  assert.equal(pace.dailyAllowance, null);
  assert.equal(pace.isPastMonth, true);
  assert.equal(pace.avgDailyExpense, 3000);
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
