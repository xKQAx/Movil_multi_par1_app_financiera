/**
 * Pruebas ligeras del parser de voz (función pura).
 * Ejecutar: node src/utils/speechParser.test.js
 */
import assert from 'node:assert/strict';
import {
  parseSpeechCommand,
  extractAmount,
  categoryForType,
} from './speechParser.js';

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

test('gasté ocho mil pesos en transporte', () => {
  const result = parseSpeechCommand('gasté ocho mil pesos en transporte');
  assert.equal(result.success, true);
  assert.equal(result.data.type, 'expense');
  assert.equal(result.data.amount, 8000);
  assert.equal(result.data.category, 'Transporte');
  assert.match(result.data.description.toLowerCase(), /transporte/);
});

test('recibí 200 mil de mesada', () => {
  const result = parseSpeechCommand('recibí 200 mil de mesada');
  assert.equal(result.success, true);
  assert.equal(result.data.type, 'income');
  assert.equal(result.data.amount, 200000);
  assert.equal(result.data.category, 'Mesada');
});

test('pagué veinte mil de almuerzo', () => {
  const result = parseSpeechCommand('pagué veinte mil de almuerzo');
  assert.equal(result.success, true);
  assert.equal(result.data.type, 'expense');
  assert.equal(result.data.amount, 20000);
  assert.equal(result.data.category, 'Alimentación');
});

test('miles con punto colombiano 8.000', () => {
  const result = parseSpeechCommand('gasté 8.000 pesos en bus');
  assert.equal(result.success, true);
  assert.equal(result.data.amount, 8000);
  assert.equal(result.data.category, 'Transporte');
});

test('miles con coma 8,000 (Whisper)', () => {
  const result = parseSpeechCommand('gasté 8,000 pesos en transporte');
  assert.equal(result.success, true);
  assert.equal(result.data.amount, 8000);
});

test('doscientos mil no se confunde con "dos"', () => {
  assert.equal(extractAmount('doscientos mil de beca'), 200000);
  const result = parseSpeechCommand('recibí doscientos mil de beca');
  assert.equal(result.data.amount, 200000);
  assert.equal(result.data.type, 'income');
  assert.equal(result.data.category, 'Beca');
});

test('cincuenta mil no se confunde con "cien"', () => {
  assert.equal(extractAmount('cincuenta mil'), 50000);
});

test('gané cincuenta mil de freelance', () => {
  const result = parseSpeechCommand('gané cincuenta mil de freelance');
  assert.equal(result.success, true);
  assert.equal(result.data.type, 'income');
  assert.equal(result.data.amount, 50000);
  assert.equal(result.data.category, 'Freelance');
});

test('sin monto deja partial editable', () => {
  const result = parseSpeechCommand('gasté en cine');
  assert.equal(result.success, false);
  assert.ok(result.partial);
  assert.equal(result.partial.category, 'Entretenimiento');
  assert.equal(result.partial.amount, '');
});

test('texto vacío', () => {
  const result = parseSpeechCommand('   ');
  assert.equal(result.success, false);
});

test('categoría inválida para el tipo cae en Otro', () => {
  assert.equal(categoryForType('Transporte', 'income'), 'Otro');
  assert.equal(categoryForType('Mesada', 'income'), 'Mesada');
  assert.equal(categoryForType('Transporte', 'expense'), 'Transporte');
});

test('me dieron 300 mil de mesada', () => {
  const result = parseSpeechCommand('me dieron 300 mil de mesada');
  assert.equal(result.success, true);
  assert.equal(result.data.type, 'income');
  assert.equal(result.data.amount, 300000);
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
