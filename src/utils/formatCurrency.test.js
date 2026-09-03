/**
 * Moneda COP sin decimales y navegación de mes.
 * Ejecutar: node src/utils/formatCurrency.test.js
 */
import assert from 'node:assert/strict';
import {
  formatCurrency,
  formatPesosField,
  formatPesosInput,
  parsePesosInput,
  shiftMonthYear,
  isMonthAfter,
  isSameMonth,
  getCalendarMonth,
} from './formatCurrency.js';

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

test('formatCurrency no muestra centavos', () => {
  assert.equal(formatCurrency(800000), '$ 800.000');
  assert.equal(formatCurrency(1500), '$ 1.500');
  assert.doesNotMatch(formatCurrency(1500), /1\.500,\d/);
});

test('formatPesosInput usa miles es-CO con punto visible', () => {
  assert.equal(formatPesosInput(800000), '800.000');
  assert.equal(formatPesosInput(''), '');
  assert.equal(formatPesosInput(0), '0');
  assert.equal(formatPesosInput(8000), '8.000');
});

test('formatPesosField incluye símbolo y miles mientras se escribe', () => {
  assert.equal(formatPesosField(800000), '$ 800.000');
  assert.equal(formatPesosField(8), '$ 8');
  assert.equal(formatPesosField(''), '');
});

test('parsePesosInput acepta dígitos, puntos y símbolo $', () => {
  assert.equal(parsePesosInput('800000'), 800000);
  assert.equal(parsePesosInput('800.000'), 800000);
  assert.equal(parsePesosInput('$ 800.000'), 800000);
  assert.equal(parsePesosInput(''), '');
  assert.equal(parsePesosInput('abc'), '');
});

test('parsePesosInput descarta centavos al pegar y conserva miles', () => {
  assert.equal(parsePesosInput('800000,50'), 800000);
  assert.equal(parsePesosInput('12.500'), 12500);
});

test('shiftMonthYear y tope hacia el futuro', () => {
  assert.deepEqual(shiftMonthYear(0, 2026, -1), { month: 11, year: 2025 });
  assert.deepEqual(shiftMonthYear(11, 2025, 1), { month: 0, year: 2026 });
  assert.equal(isMonthAfter(8, 2026, 8, 2026), false);
  assert.equal(isMonthAfter(9, 2026, 8, 2026), true);
  assert.equal(isSameMonth(8, 2026, 8, 2026), true);
});

test('getCalendarMonth lee mes/año de la fecha', () => {
  assert.deepEqual(getCalendarMonth(new Date(2026, 8, 3)), { month: 8, year: 2026 });
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
