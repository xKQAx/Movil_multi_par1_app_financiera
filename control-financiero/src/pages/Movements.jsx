import { useState } from 'react';
import Header from '../components/Header';
import MovementCard from '../components/MovementCard';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import MovementForm from '../components/MovementForm';
import { useFinance } from '../context/FinanceContext';

export default function Movements() {
  const { monthMovements, deleteMovement } = useFinance();
  const [editingMovement, setEditingMovement] = useState(null);
  const [deletingMovement, setDeletingMovement] = useState(null);
  const [toast, setToast] = useState('');

  const incomes = monthMovements.filter((m) => m.type === 'income');
  const expenses = monthMovements.filter((m) => m.type === 'expense');

  const handleDelete = () => {
    if (deletingMovement) {
      deleteMovement(deletingMovement.id);
      setDeletingMovement(null);
      setToast('Gasto eliminado correctamente ✓');
      setTimeout(() => setToast(''), 3000);
    }
  };

  const handleEditSuccess = () => {
    setEditingMovement(null);
    setToast('Gasto actualizado ✓');
    setTimeout(() => setToast(''), 3000);
  };

  if (editingMovement) {
    return (
      <div className="page">
        <Header subtitle="Editar gasto" />
        <div className="card">
          <MovementForm
            type="expense"
            initialData={editingMovement}
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

      {toast && <div className="toast toast--success" role="status">{toast}</div>}

      {monthMovements.length === 0 ? (
        <EmptyState
          title="Sin movimientos"
          message="Registra tu primer ingreso o gasto desde el inicio."
        />
      ) : (
        <>
          <section className="movements-section">
            <h2 className="section-title section-title--income">Ingresos</h2>
            {incomes.length === 0 ? (
              <p className="text-muted">No hay ingresos este mes.</p>
            ) : (
              incomes.map((m) => <MovementCard key={m.id} movement={m} />)
            )}
          </section>

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
        </>
      )}

      <ConfirmDialog
        open={!!deletingMovement}
        title="¿Eliminar este gasto?"
        message="Esta acción no se puede deshacer."
        onConfirm={handleDelete}
        onCancel={() => setDeletingMovement(null)}
      />
    </div>
  );
}
