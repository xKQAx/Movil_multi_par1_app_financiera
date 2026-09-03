import { useMemo } from 'react';
import { CalendarDays } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/formatCurrency';
import { getMonthPace } from '../utils/monthPace';

function daysLabel(count) {
  return count === 1 ? '1 día' : `${count} días`;
}

export default function MonthPace() {
  const { totalIncome, totalExpenses, balance, activeMonth, activeYear } = useFinance();
  const pace = useMemo(
    () => getMonthPace({ totalIncome, totalExpenses, balance, month: activeMonth, year: activeYear }),
    [totalIncome, totalExpenses, balance, activeMonth, activeYear]
  );

  if (!pace.hasIncome) {
    return (
      <section className="month-pace card" aria-labelledby="month-pace-title">
        <h2 id="month-pace-title" className="section-title">
          Ritmo del mes
        </h2>
        <p className="text-muted">
          Cuando anotes un ingreso verás los días que quedan, un cupo diario y si el gasto actual alcanza a fin de mes.
        </p>
      </section>
    );
  }

  const hintClass = pace.willRunShort
    ? 'month-pace__hint month-pace__hint--alert'
    : 'month-pace__hint month-pace__hint--ok';

  let hint;
  if (pace.isPastMonth) {
    hint = pace.willRunShort
      ? 'En ese mes el gasto diario no habría alcanzado hasta fin de mes.'
      : 'Mes cerrado: el saldo ya no cambia con el paso de los días.';
  } else if (pace.avgDailyExpense <= 0) {
    hint = 'Aún no hay gastos: el cupo diario reparte el saldo en los días que quedan.';
  } else if (pace.willRunShort) {
    hint = `Si sigues gastando ${formatCurrency(pace.avgDailyExpense)} al día, el saldo no alcanzaría antes de fin de mes.`;
  } else {
    hint = 'Al ritmo actual, el saldo sí alcanza hasta fin de mes.';
  }

  return (
    <section className="month-pace card" aria-labelledby="month-pace-title">
      <h2 id="month-pace-title" className="section-title">
        <CalendarDays size={18} aria-hidden="true" className="month-pace__icon" />
        Ritmo del mes
      </h2>
      <div className="month-pace__grid">
        <div className="month-pace__item">
          <span className="month-pace__label">Días restantes</span>
          <span className="month-pace__value">
            {pace.daysRemaining > 0 ? daysLabel(pace.daysRemaining) : 'Mes cerrado'}
          </span>
        </div>
        <div className="month-pace__item">
          <span className="month-pace__label">Cupo diario</span>
          <span className="month-pace__value month-pace__value--income">
            {pace.daysRemaining === 0
              ? '—'
              : pace.dailyAllowance != null
                ? formatCurrency(pace.dailyAllowance)
                : 'Sin saldo'}
          </span>
        </div>
        <div className="month-pace__item">
          <span className="month-pace__label">Gasto / día</span>
          <span className="month-pace__value month-pace__value--expense">
            {formatCurrency(pace.avgDailyExpense)}
          </span>
        </div>
      </div>
      <p className={hintClass}>{hint}</p>
    </section>
  );
}
