import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import MovementCard from '../components/MovementCard';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import MovementForm from '../components/MovementForm';
import MonthSummary from '../components/MonthSummary';
import { useFinance } from '../context/FinanceContext';
import { useToast } from '../hooks/useToast';
import { ROUTES } from '../utils/constants';

const TYPE_FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'income', label: 'Ingresos' },
  { id: 'expense', label: 'Egresos' },
];

export default function Movements() {
  const navigate = useNavigate();
  const { monthMovements, deleteMovement } = useFinance();
  const { showToast } = useToast();
  const [editingMovement, setEditingMovement] = useState(null);
  const [deletingMovement, setDeletingMovement] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');

  const incomes = monthMovements.filter((m) => m.type === 'income');
  const expenses = monthMovements.filter((m) => m.type === 'expense');
  const showIncomes = typeFilter !== 'expense';
  const showExpenses = typeFilter !== 'income';

  const isIncome = (movement) => movement?.type === 'income';

  const handleDelete = () => {
    if (!deletingMovement) return;
    const result = deleteMovement(deletingMovement.id);
    if (!result.success) {
      setDeletingMovement(null);
      showToast(
        'No puedes eliminar este ingreso: los gastos de ese mes quedarían por encima de los ingresos. Reduce o borra egresos primero.',
        'error'
      );
      return;
    }
    const msg = isIncome(deletingMovement)
      ? 'Ingreso eliminado ✓'
      : 'Gasto eliminado ✓';
    setDeletingMovement(null);
    showToast(msg);
  };

  const handleEditSuccess = (movType) => {
    setEditingMovement(null);
    showToast(movType === 'income' ? 'Ingreso actualizado ✓' : 'Gasto actualizado ✓');
  };

  if (editingMovement) {
    const editingIncome = editingMovement.type === 'income';
    return (
      <div className="page page--narrow">
        <Header subtitle={editingIncome ? 'Editar ingreso' : 'Editar gasto'} />
        <div className="card">
          <MovementForm
            type={editingMovement.type}
            initialData={editingMovement}
            enableVoice={false}
            onSuccess={handleEditSuccess}
            onCancel={() => setEditingMovement(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="page movements-page">
      <Header subtitle="Movimientos" />

      {monthMovements.length === 0 ? (
        <div className="movements-empty">
          <EmptyState
            title="Sin movimientos este mes"
            message="Empieza con un ingreso (mesada, beca o trabajo). Después podrás anotar gastos de alimentación, transporte y el resto."
          />
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => navigate(ROUTES.add('ingreso'))}
          >
            Registrar ingreso
          </button>
        </div>
      ) : (
        <>
          <MonthSummary title="Totales de este mes" />

          <div className="segmented" role="group" aria-label="Filtrar por tipo">
            {TYPE_FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                className={`segmented__btn${typeFilter === filter.id ? ' segmented__btn--active' : ''}`}
                onClick={() => setTypeFilter(filter.id)}
                aria-pressed={typeFilter === filter.id}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="movements-page__grid">
            {showIncomes && (
              <section className="movements-section">
                <h2 className="section-title section-title--income">Ingresos</h2>
                {incomes.length === 0 ? (
                  <p className="text-muted">No hay ingresos este mes. Los gastos se validan contra este total.</p>
                ) : (
                  incomes.map((m) => (
                    <MovementCard
                      key={m.id}
                      movement={m}
                      showActions
                      onEdit={setEditingMovement}
                      onDelete={setDeletingMovement}
                    />
                  ))
                )}
              </section>
            )}

            {showExpenses && (
              <section className="movements-section">
                <h2 className="section-title section-title--expense">Egresos</h2>
                {expenses.length === 0 ? (
                  <p className="text-muted">No hay egresos este mes.</p>
                ) : (
                  expenses.map((m) => (
                    <MovementCard
                      key={m.id}
                      movement={m}
                      showActions
                      onEdit={setEditingMovement}
                      onDelete={setDeletingMovement}
                    />
                  ))
                )}
              </section>
            )}
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!deletingMovement}
        title={isIncome(deletingMovement) ? '¿Eliminar este ingreso?' : '¿Eliminar este gasto?'}
        message={
          isIncome(deletingMovement)
            ? 'Si los gastos del mes superan lo que quedaría de ingresos, no se podrá eliminar.'
            : 'Esta acción no se puede deshacer.'
        }
        onConfirm={handleDelete}
        onCancel={() => setDeletingMovement(null)}
      />
    </div>
  );
}
