/** Estados financieros del presupuesto */
export const BUDGET_STATUS = {
  NORMAL: 'NORMAL',
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL',
  NO_INCOME: 'NO_INCOME',
};

/** Filtra movimientos del mes activo */
export function filterMovementsByMonth(movements, month, year) {
  if (!Array.isArray(movements)) return [];
  return movements.filter((m) => {
    if (!m?.date) return false;
    const d = new Date(m.date + 'T12:00:00');
    return d.getMonth() === month && d.getFullYear() === year;
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
 * Valida si se puede agregar/editar un egreso.
 * @param excludeId - ID del egreso a excluir (para edición)
 */
export function canAddExpense(movements, month, year, newAmount, excludeId = null) {
  const totalIncome = calculateIncome(movements, month, year);
  if (totalIncome <= 0) {
    return { allowed: false, reason: 'no_income', maxAllowed: 0 };
  }

  const expenses = filterMovementsByMonth(movements, month, year)
    .filter((m) => m.type === 'expense' && m.id !== excludeId);

  const currentExpenses = expenses.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
  const balanceAfter = totalIncome - (currentExpenses + Number(newAmount));

  if (balanceAfter < 0) {
    const maxAllowed = totalIncome - currentExpenses;
    return { allowed: false, reason: 'exceeds_balance', maxAllowed: Math.max(0, maxAllowed) };
  }

  return { allowed: true, maxAllowed: totalIncome - currentExpenses };
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
