/**
 * Pruebas de reglas del parcial (saldo, tope del mes, 30 % / 10 %).
 * Ejecutar: node src/utils/financeRules.test.js
 */
import assert from 'node:assert/strict';
import {
  BUDGET_STATUS,
  canAddExpense,
  canApplyMovementChange,
  calculateBalance,
  calculateRemainingPercentage,
  getBudgetStatus,
  sortMovementsByDate,
} from './financeRules.js';

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

const SEP = '2026-09-15';
const OCT = '2026-10-03';

const base = [
  { id: 'i1', type: 'income', amount: 100000, date: '2026-09-01' },
  { id: 'e1', type: 'expense', amount: 40000, date: '2026-09-02' },
];

test('canAddExpense permite un gasto dentro del saldo del mismo mes', () => {
  const result = canAddExpense(base, 8, 2026, 50000);
  assert.equal(result.allowed, true);
  assert.equal(result.maxAllowed, 60000);
});

test('canAddExpense bloquea si el gasto supera ingresos − egresos del mes', () => {
  const result = canAddExpense(base, 8, 2026, 70000);
  assert.equal(result.allowed, false);
  assert.equal(result.reason, 'exceeds_balance');
  assert.equal(result.maxAllowed, 60000);
});

test('canAddExpense bloquea gastos en un mes sin ingresos (otra fecha)', () => {
  const result = canAddExpense(base, 9, 2026, 1000);
  assert.equal(result.allowed, false);
  assert.equal(result.reason, 'no_income');
  assert.equal(result.maxAllowed, 0);
});

test('canAddExpense al editar excluye el propio egreso', () => {
  const result = canAddExpense(base, 8, 2026, 90000, 'e1');
  assert.equal(result.allowed, true);
  assert.equal(result.maxAllowed, 100000);
});

test('canAddExpense rechaza montos inválidos', () => {
  const result = canAddExpense(base, 8, 2026, 0);
  assert.equal(result.allowed, false);
  assert.equal(result.reason, 'invalid_amount');
});

test('saldo nunca negativo', () => {
  assert.equal(calculateBalance(100, 250), 0);
  assert.equal(calculateBalance(100, 40), 60);
});

test('30 % restante es precaución', () => {
  assert.equal(getBudgetStatus(100000, 30000), BUDGET_STATUS.WARNING);
  assert.equal(getBudgetStatus(100000, 25000), BUDGET_STATUS.WARNING);
  assert.equal(calculateRemainingPercentage(30000, 100000), 30);
});

test('más de 30 % restante es normal', () => {
  assert.equal(getBudgetStatus(100000, 31000), BUDGET_STATUS.NORMAL);
});

test('10 % restante es crítico', () => {
  assert.equal(getBudgetStatus(100000, 10000), BUDGET_STATUS.CRITICAL);
  assert.equal(getBudgetStatus(100000, 9000), BUDGET_STATUS.CRITICAL);
});

test('sin ingresos no permite estado de presupuesto numérico', () => {
  assert.equal(getBudgetStatus(0, 0), BUDGET_STATUS.NO_INCOME);
});

test('borrar un ingreso que dejaría gastos ilegales se bloquea', () => {
  const next = base.filter((m) => m.id !== 'i1');
  const result = canApplyMovementChange(next, [SEP]);
  assert.equal(result.allowed, false);
  assert.equal(result.reason, 'would_exceed_expenses');
});

test('mover un ingreso a otro mes no deja gastos huérfanos', () => {
  const next = base.map((m) => (m.id === 'i1' ? { ...m, date: OCT } : m));
  const result = canApplyMovementChange(next, ['2026-09-01', OCT]);
  assert.equal(result.allowed, false);
});

test('ordenar movimientos: fecha más reciente primero', () => {
  const sorted = sortMovementsByDate([
    { id: 'a', date: '2026-09-01' },
    { id: 'c', date: '2026-09-20' },
    { id: 'b', date: '2026-09-10' },
  ]);
  assert.deepEqual(sorted.map((m) => m.id), ['c', 'b', 'a']);
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
