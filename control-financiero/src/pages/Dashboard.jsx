import { useNavigate } from 'react-router-dom';
import { Plus, Minus, Mic } from 'lucide-react';
import Header from '../components/Header';
import BalanceCard from '../components/BalanceCard';
import AlertCard from '../components/AlertCard';
import CategoryChart from '../components/CategoryChart';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/formatCurrency';

export default function Dashboard() {
  const navigate = useNavigate();
  const { totalIncome, totalExpenses, balance, expensesByCategory } = useFinance();

  return (
    <div className="page dashboard">
      <Header />

      <BalanceCard />
      <AlertCard />

      <section className="quick-actions" aria-label="Acciones rápidas">
        <button
          type="button"
          className="quick-action quick-action--income"
          onClick={() => navigate('/agregar/ingreso')}
        >
          <Plus size={22} aria-hidden="true" />
          Registrar ingreso
        </button>
        <button
          type="button"
          className="quick-action quick-action--expense"
          onClick={() => navigate('/agregar/gasto')}
        >
          <Minus size={22} aria-hidden="true" />
          Registrar gasto
        </button>
        <button
          type="button"
          className="quick-action quick-action--voice"
          onClick={() => navigate('/agregar/voz')}
        >
          <Mic size={22} aria-hidden="true" />
          🎙 Registrar por voz
        </button>
      </section>

      <section className="month-summary card">
        <h2 className="section-title">Resumen del mes</h2>
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

      {/* PENDIENTE — Mejorar visualización financiera (compañero del equipo) */}
      <section className="category-summary card">
        <h2 className="section-title">Gastos por categoría</h2>
        {expensesByCategory.length === 0 ? (
          <p className="text-muted">No hay gastos registrados este mes.</p>
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
  );
}
