/**
 * Ritmo del mes visible: cupo diario y proyección de gasto.
 * `month`/`year` son el mes seleccionado; `now` (inyectable) marca el calendario real.
 */

function toSafeDate(now) {
  if (now instanceof Date && !Number.isNaN(now.getTime())) return now;
  return new Date();
}

/**
 * @param {{ totalIncome?: number, totalExpenses?: number, balance?: number, now?: Date, month?: number, year?: number }} params
 */
export function getMonthPace({
  totalIncome = 0,
  totalExpenses = 0,
  balance,
  now = new Date(),
  month,
  year,
} = {}) {
  const date = toSafeDate(now);
  const viewYear = year ?? date.getFullYear();
  const viewMonth = month ?? date.getMonth();
  const isViewingCurrent =
    viewYear === date.getFullYear() && viewMonth === date.getMonth();

  const income = Number(totalIncome) || 0;
  const expenses = Number(totalExpenses) || 0;
  const remaining =
    balance == null ? Math.max(0, income - expenses) : Math.max(0, Number(balance) || 0);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysElapsed = isViewingCurrent
    ? Math.min(Math.max(date.getDate(), 1), daysInMonth)
    : daysInMonth;
  const daysRemaining = isViewingCurrent ? daysInMonth - daysElapsed + 1 : 0;

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
    isPastMonth: !isViewingCurrent,
  };
}
