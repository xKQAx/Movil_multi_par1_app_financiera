import { formatShortDate, getTodayISO } from './formatCurrency.js';

export const RECENT_MOVEMENTS_LIMIT = 5;

function shiftISODate(iso, days) {
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function matchesQuery(movement, query) {
  if (!query) return true;
  const haystack = `${movement?.description || ''} ${movement?.category || ''}`.toLowerCase();
  return haystack.includes(query);
}

/**
 * Filtra una lista ya limitada al mes (p. ej. `monthMovements`).
 * No sustituye a `filterMovementsByMonth`.
 */
export function filterMovementsList(
  movements,
  { type = 'all', query = '', category = '' } = {}
) {
  if (!Array.isArray(movements)) return [];
  const needle = String(query).trim().toLowerCase();

  return movements.filter((movement) => {
    if (type === 'income' && movement?.type !== 'income') return false;
    if (type === 'expense' && movement?.type !== 'expense') return false;
    if (category && movement?.category !== category) return false;
    return matchesQuery(movement, needle);
  });
}

/** Categorías distintas, ordenadas en español. */
export function uniqueCategories(movements) {
  if (!Array.isArray(movements)) return [];
  const names = new Set();
  movements.forEach((movement) => {
    if (movement?.category) names.add(movement.category);
  });
  return [...names].sort((a, b) => a.localeCompare(b, 'es'));
}

/** Agrupa conservando el orden de entrada (se espera más reciente primero). */
export function groupMovementsByDate(movements) {
  if (!Array.isArray(movements)) return [];
  const groups = [];
  const byDate = new Map();

  movements.forEach((movement) => {
    const date = movement?.date || '';
    if (!byDate.has(date)) {
      const items = [];
      byDate.set(date, items);
      groups.push({ date, items });
    }
    byDate.get(date).push(movement);
  });

  return groups;
}

export function formatDayHeading(dateStr, todayISO = getTodayISO()) {
  if (!dateStr) return '';
  if (dateStr === todayISO) return 'Hoy';
  if (dateStr === shiftISODate(todayISO, -1)) return 'Ayer';
  return formatShortDate(dateStr);
}

export function getRecentMovements(movements, limit = RECENT_MOVEMENTS_LIMIT) {
  if (!Array.isArray(movements)) return [];
  return movements.slice(0, limit);
}
