import { useNavigate } from 'react-router-dom';
import { Plus, Minus, Mic } from 'lucide-react';
import Header from '../components/Header';
import BalanceCard from '../components/BalanceCard';
import AlertCard from '../components/AlertCard';
import CategoryChart from '../components/CategoryChart';
import EmptyState from '../components/EmptyState';
import MonthSummary from '../components/MonthSummary';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/formatCurrency';
import { ROUTES } from '../utils/constants';

export default function Dashboard() {
  const navigate = useNavigate();
  const { totalIncome, totalExpenses, expensesByCategory } = useFinance();
  const noIncome = totalIncome <= 0;

  return (
    <div className="page dashboard">
      <Header />

      <div className="dashboard__hero">
        <BalanceCard />
        <AlertCard />
      </div>

      {noIncome && (
        <div className="card dashboard-empty-income">
          <EmptyState
            title="Empieza por un ingreso"
            message="Anota tu mesada, beca o pago de este mes. Hasta entonces los gastos quedan bloqueados: no pueden superar los ingresos del mismo mes."
          />
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => navigate(ROUTES.add('ingreso'))}
          >
            Registrar ingreso
          </button>
        </div>
      )}

      <section className="quick-actions" aria-label="Acciones rápidas">
        <button
          type="button"
          className="quick-action quick-action--income"
          onClick={() => navigate(ROUTES.add('ingreso'))}
        >
          <Plus size={22} aria-hidden="true" />
          Registrar ingreso
        </button>
        <button
          type="button"
          className="quick-action quick-action--expense"
          onClick={() => navigate(ROUTES.add('gasto'))}
          disabled={noIncome}
          title={noIncome ? 'Registra un ingreso primero' : undefined}
          aria-describedby={noIncome ? 'quick-expense-hint' : undefined}
        >
          <Minus size={22} aria-hidden="true" />
          Registrar gasto
        </button>
        <button
          type="button"
          className="quick-action quick-action--voice"
          onClick={() => navigate(ROUTES.add('voz'))}
        >
          <Mic size={22} aria-hidden="true" />
          Registrar por voz
        </button>
      </section>
      {noIncome && (
        <p id="quick-expense-hint" className="text-muted quick-actions__hint">
          El gasto está bloqueado hasta que registres un ingreso este mes.
        </p>
      )}

      <div className="dashboard__panels">
        <MonthSummary />

        <section className="category-summary card">
          <h2 className="section-title">Gastos por categoría</h2>
          {expensesByCategory.length === 0 ? (
            <p className="text-muted">
              {noIncome
                ? 'Cuando registres ingresos y gastos, aquí verás en qué se va el mes.'
                : 'Aún no hay gastos este mes. Puedes registrar uno o dictarlo por voz.'}
            </p>
          ) : (
            <>
              <CategoryChart
                expensesByCategory={expensesByCategory}
                totalExpenses={totalExpenses}
              />
              <ul className="category-list category-list--compact">
                {expensesByCategory.map(({ category, amount }) => (
                  <li key={category} className="category-list__item">
                    <span className="category-list__name">{category}</span>
                    <span className="category-list__amount">{formatCurrency(amount)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
