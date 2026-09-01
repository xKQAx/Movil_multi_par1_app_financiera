/** Estados financieros del presupuesto */
export const BUDGET_STATUS = {
  NORMAL: 'NORMAL',
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL',
  NO_INCOME: 'NO_INCOME',
};

/** Partes de fecha local a mediodía (evita el salto UTC). */
function dateParts(dateStr) {
  if (!dateStr) return null;
  const d = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return { month: d.getMonth(), year: d.getFullYear() };
}

/** Filtra movimientos del mes activo */
export function filterMovementsByMonth(movements, month, year) {
  if (!Array.isArray(movements)) return [];
  return movements.filter((m) => {
    const parts = dateParts(m?.date);
    return parts?.month === month && parts?.year === year;
  });
}

/** Más recientes primero; mismo día, el id más nuevo (timestamp) gana. */
export function sortMovementsByDate(movements) {
  if (!Array.isArray(movements)) return [];
  return [...movements].sort((a, b) => {
    const byDate = String(b?.date || '').localeCompare(String(a?.date || ''));
    if (byDate !== 0) return byDate;
    return String(b?.id || '').localeCompare(String(a?.id || ''));
  });
}

/** Total de ingresos del mes */
export function calculateIncome(movements, month, year) {
  return filterMovementsByMonth(movements, month, year)
    .filter((m) => m.type === 'income')
    .reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
}

/** Total de egresos del mes */
export function calculateExpenses(movements, month, year) {
  return filterMovementsByMonth(movements, month, year)
    .filter((m) => m.type === 'expense')
    .reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
}

/** Saldo disponible (nunca negativo) */
export function calculateBalance(totalIncome, totalExpenses) {
  return Math.max(0, totalIncome - totalExpenses);
}

/** Porcentaje de presupuesto restante */
export function calculateRemainingPercentage(balance, totalIncome) {
  if (!totalIncome || totalIncome <= 0) return null;
  return (balance / totalIncome) * 100;
}

/**
 * Valida si se puede agregar/editar un egreso en el mes/año indicados
 * (deben ser los de la fecha del movimiento, no el mes calendario activo).
 * @param excludeId - ID del egreso a excluir (para edición)
 */
export function canAddExpense(movements, month, year, newAmount, excludeId = null) {
  const amount = Number(newAmount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { allowed: false, reason: 'invalid_amount', maxAllowed: 0 };
  }

  const totalIncome = calculateIncome(movements, month, year);
  if (totalIncome <= 0) {
    return { allowed: false, reason: 'no_income', maxAllowed: 0 };
  }

  const expenses = filterMovementsByMonth(movements, month, year)
    .filter((m) => m.type === 'expense' && m.id !== excludeId);

  const currentExpenses = expenses.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
  const balanceAfter = totalIncome - (currentExpenses + amount);

  if (balanceAfter < 0) {
    const maxAllowed = totalIncome - currentExpenses;
    return { allowed: false, reason: 'exceeds_balance', maxAllowed: Math.max(0, maxAllowed) };
  }

  return { allowed: true, maxAllowed: totalIncome - currentExpenses };
}

/**
 * Tras editar o borrar, ningún mes afectado puede quedar con gastos > ingresos.
 * Evita saldo negativo al reducir o eliminar un ingreso.
 */
export function canApplyMovementChange(nextMovements, datesToCheck) {
  const seen = new Set();

  for (const dateStr of datesToCheck) {
    if (!dateStr) continue;
    const parts = dateParts(dateStr);
    if (!parts) continue;
    const { month, year } = parts;
    const key = `${year}-${month}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const income = calculateIncome(nextMovements, month, year);
    const expenses = calculateExpenses(nextMovements, month, year);
    if (expenses > income) {
      return { allowed: false, reason: 'would_exceed_expenses', maxAllowed: income };
    }
  }

  return { allowed: true };
}

/** Determina el estado del presupuesto */
export function getBudgetStatus(totalIncome, balance) {
  if (totalIncome === 0) return BUDGET_STATUS.NO_INCOME;

  const percentage = calculateRemainingPercentage(balance, totalIncome);
  if (percentage === null) return BUDGET_STATUS.NO_INCOME;
  if (percentage <= 10) return BUDGET_STATUS.CRITICAL;
  if (percentage <= 30) return BUDGET_STATUS.WARNING;
  return BUDGET_STATUS.NORMAL;
}

/** Gastos agrupados por categoría */
export function getExpensesByCategory(movements, month, year) {
  const expenses = filterMovementsByMonth(movements, month, year).filter(
    (m) => m.type === 'expense'
  );

  const grouped = {};
  expenses.forEach((m) => {
    const cat = m.category || 'Otro';
    grouped[cat] = (grouped[cat] || 0) + (Number(m.amount) || 0);
  });

  return Object.entries(grouped)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

/** Genera ID único para movimientos */
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
