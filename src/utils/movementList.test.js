/**
 * Filtro, agrupación y etiquetas de la lista de movimientos.
 * Ejecutar: node src/utils/movementList.test.js
 */
import assert from 'node:assert/strict';
import {
  filterMovementsList,
  formatDayHeading,
  getRecentMovements,
  groupMovementsByDate,
  uniqueCategories,
} from './movementList.js';

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

const items = [
  { id: '1', type: 'income', description: 'Mesada', category: 'Mesada', date: '2026-09-02' },
  { id: '2', type: 'expense', description: 'Almuerzo', category: 'Alimentación', date: '2026-09-02' },
  { id: '3', type: 'expense', description: 'Bus', category: 'Transporte', date: '2026-09-01' },
];

test('filtra por tipo ingreso', () => {
  const result = filterMovementsList(items, { type: 'income' });
  assert.deepEqual(result.map((m) => m.id), ['1']);
});

test('busca en descripción o categoría', () => {
  const byDesc = filterMovementsList(items, { query: 'almu' });
  const byCat = filterMovementsList(items, { query: 'trans' });
  assert.deepEqual(byDesc.map((m) => m.id), ['2']);
  assert.deepEqual(byCat.map((m) => m.id), ['3']);
});

test('filtra por categoría exacta', () => {
  const result = filterMovementsList(items, { category: 'Alimentación' });
  assert.deepEqual(result.map((m) => m.id), ['2']);
});

test('combina tipo + búsqueda y deja vacío si no hay match', () => {
  const result = filterMovementsList(items, { type: 'expense', query: 'mesada' });
  assert.equal(result.length, 0);
});

test('categorías únicas ordenadas', () => {
  assert.deepEqual(uniqueCategories(items), ['Alimentación', 'Mesada', 'Transporte']);
});

test('agrupa por fecha conservando orden', () => {
  const groups = groupMovementsByDate(items);
  assert.deepEqual(
    groups.map((g) => g.date),
    ['2026-09-02', '2026-09-01']
  );
  assert.deepEqual(
    groups[0].items.map((m) => m.id),
    ['1', '2']
  );
});

test('encabezado de día: hoy / ayer / fecha corta', () => {
  assert.equal(formatDayHeading('2026-09-15', '2026-09-15'), 'Hoy');
  assert.equal(formatDayHeading('2026-09-14', '2026-09-15'), 'Ayer');
  const short = formatDayHeading('2026-09-01', '2026-09-15');
  assert.notEqual(short, 'Hoy');
  assert.notEqual(short, 'Ayer');
  assert.ok(short.length > 0);
});

test('últimos N movimientos', () => {
  assert.deepEqual(
    getRecentMovements(items, 2).map((m) => m.id),
    ['1', '2']
  );
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
