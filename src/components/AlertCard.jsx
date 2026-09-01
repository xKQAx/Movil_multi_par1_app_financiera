import { CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { BUDGET_STATUS } from '../utils/financeRules';

const STATUS_CONFIG = {
  [BUDGET_STATUS.NORMAL]: {
    icon: CheckCircle,
    title: 'Vas bien',
    subtitle: 'Presupuesto saludable',
    className: 'alert-card--normal',
  },
  [BUDGET_STATUS.WARNING]: {
    icon: AlertTriangle,
    title: 'Cuidado con tus gastos',
    subtitle: '⚠️ Precaución — Tu saldo disponible está llegando al límite.',
    className: 'alert-card--warning',
  },
  [BUDGET_STATUS.CRITICAL]: {
    icon: AlertCircle,
    title: 'Tu presupuesto está casi agotado',
    subtitle: '🔴 Presupuesto crítico — Te queda menos del 10 % de tu presupuesto.',
    className: 'alert-card--critical',
  },
  [BUDGET_STATUS.NO_INCOME]: {
    icon: Info,
    title: 'Sin ingresos',
    subtitle: 'Registra primero un ingreso para poder registrar gastos.',
    className: 'alert-card--info',
  },
};

export default function AlertCard() {
  const { budgetStatus, remainingPercentage } = useFinance();
  const config = STATUS_CONFIG[budgetStatus] || STATUS_CONFIG[BUDGET_STATUS.NORMAL];
  const Icon = config.icon;

  return (
    <section className={`alert-card ${config.className}`} aria-live="polite">
      <span className="alert-card__icon-wrap" aria-hidden="true">
        <Icon size={22} />
      </span>
      <div>
        <h2 className="alert-card__title">{config.title}</h2>
        <p className="alert-card__subtitle">{config.subtitle}</p>
        {budgetStatus === BUDGET_STATUS.WARNING && remainingPercentage !== null && (
          <p className="alert-card__extra">
            Solo tienes disponible el {remainingPercentage.toFixed(0)} % de tus ingresos.
          </p>
        )}
        {budgetStatus === BUDGET_STATUS.CRITICAL && remainingPercentage !== null && (
          <p className="alert-card__extra">
            Te queda solo el {remainingPercentage.toFixed(0)} % de tu presupuesto mensual.
          </p>
        )}
      </div>
    </section>
  );
}
