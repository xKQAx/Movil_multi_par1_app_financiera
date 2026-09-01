import { formatCurrency } from '../utils/formatCurrency';
import { useFinance } from '../context/FinanceContext';
import { BUDGET_STATUS } from '../utils/financeRules';

export default function BalanceCard() {
  const { balance, totalIncome, totalExpenses, remainingPercentage, budgetStatus } =
    useFinance();

  const percentage = remainingPercentage ?? 0;
  const barWidth = budgetStatus === BUDGET_STATUS.NO_INCOME ? 0 : Math.min(100, percentage);

  return (
    <section className="balance-card" aria-label="Resumen de saldo">
      <span className="balance-card__glow" aria-hidden="true" />
      <span className="balance-card__sheen" aria-hidden="true" />
      <p className="balance-card__label">Saldo disponible</p>
      <p className="balance-card__amount">{formatCurrency(balance)}</p>

      <div className="balance-card__details">
        <div>
          <span className="balance-card__detail-label">Ingresos</span>
          <span className="balance-card__detail-value balance-card__detail-value--income">
            {formatCurrency(totalIncome)}
          </span>
        </div>
        <div>
          <span className="balance-card__detail-label">Egresos</span>
          <span className="balance-card__detail-value balance-card__detail-value--expense">
            {formatCurrency(totalExpenses)}
          </span>
        </div>
      </div>

      {budgetStatus !== BUDGET_STATUS.NO_INCOME && (
        <div className="balance-card__progress">
          <div className="progress-bar" role="progressbar" aria-valuenow={barWidth} aria-valuemin={0} aria-valuemax={100}>
            <div className="progress-bar__fill" style={{ width: `${barWidth}%` }} />
          </div>
          <span className="balance-card__percentage">{percentage.toFixed(1)} %</span>
        </div>
      )}

      {budgetStatus === BUDGET_STATUS.NO_INCOME && (
        <p className="balance-card__no-income">Aún no tienes ingresos registrados.</p>
      )}
    </section>
  );
}
