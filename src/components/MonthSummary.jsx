import { formatCurrency } from '../utils/formatCurrency';
import { useFinance } from '../context/FinanceContext';

/** Totales del mes calendario actual (Dashboard y listado). */
export default function MonthSummary({ title = 'Resumen del mes' }) {
  const { totalIncome, totalExpenses, balance } = useFinance();

  return (
    <section className="month-summary card">
      <h2 className="section-title">{title}</h2>
      <div className="month-summary__grid">
        <div className="month-summary__item">
          <span className="month-summary__label">Ingresos</span>
          <span className="month-summary__value month-summary__value--income">
            {formatCurrency(totalIncome)}
          </span>
        </div>
        <div className="month-summary__item">
          <span className="month-summary__label">Gastos</span>
          <span className="month-summary__value month-summary__value--expense">
            {formatCurrency(totalExpenses)}
          </span>
        </div>
        <div className="month-summary__item">
          <span className="month-summary__label">Disponible</span>
          <span className="month-summary__value">{formatCurrency(balance)}</span>
        </div>
      </div>
    </section>
  );
}
