/**
 * Ritmo del mes activo: cupo diario y proyección de gasto.
 * Datos derivados; el mes calendario lo marca `now` (inyectable en tests).
 */

function toSafeDate(now) {
  if (now instanceof Date && !Number.isNaN(now.getTime())) return now;
  return new Date();
}

/**
 * @param {{ totalIncome?: number, totalExpenses?: number, balance?: number, now?: Date }} params
 */
export function getMonthPace({
  totalIncome = 0,
  totalExpenses = 0,
  balance,
  now = new Date(),
} = {}) {
  const date = toSafeDate(now);
  const income = Number(totalIncome) || 0;
  const expenses = Number(totalExpenses) || 0;
  const remaining =
    balance == null ? Math.max(0, income - expenses) : Math.max(0, Number(balance) || 0);

  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysElapsed = Math.min(Math.max(day, 1), daysInMonth);
  const daysRemaining = daysInMonth - daysElapsed + 1;

  const dailyAllowance =
    remaining > 0 && daysRemaining > 0 ? Math.round(remaining / daysRemaining) : null;

  const avgDailyExpense = daysElapsed > 0 ? expenses / daysElapsed : 0;
  const projectedExpenses = avgDailyExpense * daysInMonth;
  const willRunShort = income > 0 && projectedExpenses > income;

  return {
    hasIncome: income > 0,
    daysInMonth,
    daysElapsed,
    daysRemaining,
    dailyAllowance,
    avgDailyExpense,
    projectedExpenses,
    willRunShort,
  };
}
