import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, DEMO_MOVEMENTS } from '../utils/constants.js';
import { isValidMovementDate, getTodayISO } from '../utils/formatCurrency.js';
import { generateId } from '../utils/financeRules.js';

const THEMES = new Set(['light', 'dark']);
const ACCENTS = new Set(['blue', 'green', 'purple']);

export function parseMovementPayload(body) {
  const type = body?.type === 'income' || body?.type === 'expense' ? body.type : null;
  if (!type) {
    return { error: 'El tipo debe ser ingreso o gasto.', status: 400 };
  }

  const description = String(body?.description || '').trim();
  if (!description) {
    return { error: 'La descripción es obligatoria.', status: 400 };
  }

  const category = String(body?.category || '').trim();
  const allowed = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  if (!allowed.includes(category)) {
    return { error: 'Categoría no válida.', status: 400 };
  }

  const amount = Number(body?.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: 'El monto debe ser mayor que $0.', status: 400 };
  }

  const date = String(body?.date || '');
  if (!isValidMovementDate(date, getTodayISO())) {
    return { error: 'La fecha no es válida o es futura.', status: 400 };
  }

  return { data: { type, description, category, amount, date } };
}

export function parsePreferencesPayload(body) {
  const name = String(body?.name ?? '').trim() || 'Estudiante';
  const theme = THEMES.has(body?.theme) ? body.theme : 'light';
  const accentColor = ACCENTS.has(body?.accentColor) ? body.accentColor : 'blue';
  const activeMonthName = String(body?.activeMonthName ?? '').trim();
  return { name, theme, accentColor, activeMonthName };
}

export function demoMovementsForToday() {
  const today = getTodayISO();
  return DEMO_MOVEMENTS.map((movement) => ({
    ...movement,
    id: generateId(),
    date: today,
  }));
}
