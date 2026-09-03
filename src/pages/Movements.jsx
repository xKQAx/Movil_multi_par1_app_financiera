import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import Header from '../components/Header';
import MovementCard from '../components/MovementCard';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import MovementForm from '../components/MovementForm';
import MonthSummary from '../components/MonthSummary';
import { useFinance } from '../context/FinanceContext';
import { useToast } from '../hooks/useToast';
import { ROUTES } from '../utils/constants';
import {
  filterMovementsList,
  formatDayHeading,
  groupMovementsByDate,
  uniqueCategories,
} from '../utils/movementList';

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
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');

  const typeFiltered = useMemo(
    () => filterMovementsList(monthMovements, { type: typeFilter }),
    [monthMovements, typeFilter]
  );
  const categories = useMemo(() => uniqueCategories(typeFiltered), [typeFiltered]);
  const visibleMovements = useMemo(
    () => filterMovementsList(typeFiltered, { query, category }),
    [typeFiltered, query, category]
  );
  const dayGroups = useMemo(
    () => groupMovementsByDate(visibleMovements),
    [visibleMovements]
  );

  const isIncome = (movement) => movement?.type === 'income';
  const hasActiveFilters = typeFilter !== 'all' || query.trim() !== '' || category !== '';

  const handleTypeFilter = (id) => {
    setTypeFilter(id);
    setCategory('');
  };

  const handleDelete = async () => {
    if (!deletingMovement) return;
    const result = await deleteMovement(deletingMovement.id);
    if (!result.success) {
      setDeletingMovement(null);
      showToast(
        result.error ||
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
                onClick={() => handleTypeFilter(filter.id)}
                aria-pressed={typeFilter === filter.id}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <form
            className="movements-toolbar"
            role="search"
            onSubmit={(event) => event.preventDefault()}
          >
            <div className="form-group">
              <label htmlFor="movements-query">Buscar</label>
              <div className="movements-search">
                <Search size={18} className="movements-search__icon" aria-hidden="true" />
                <input
                  id="movements-query"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Descripción o categoría"
                  autoComplete="off"
                />
              </div>
            </div>
          </form>

          <div>
            <p id="category-filter-label" className="category-chips__label">
              Categoría
            </p>
            <div className="category-chips" role="group" aria-labelledby="category-filter-label">
              <button
                type="button"
                className={`chip${category === '' ? ' chip--active' : ''}`}
                onClick={() => setCategory('')}
                aria-pressed={category === ''}
              >
                Todas
              </button>
              {categories.map((name) => (
                <button
                  key={name}
                  type="button"
                  className={`chip${category === name ? ' chip--active' : ''}`}
                  onClick={() => setCategory(name)}
                  aria-pressed={category === name}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {visibleMovements.length === 0 ? (
            <div className="movements-filter-empty card">
              <EmptyState
                title="Sin coincidencias"
                message={
                  hasActiveFilters
                    ? 'No hay movimientos con esa búsqueda o categoría. Prueba otro texto o elige Todas.'
                    : 'No hay movimientos para este filtro.'
                }
              />
            </div>
          ) : (
            <div className="day-groups">
              {dayGroups.map((group) => (
                <section key={group.date || 'sin-fecha'} className="day-group" aria-labelledby={`day-${group.date}`}>
                  <h3 id={`day-${group.date}`} className="day-group__title">
                    {formatDayHeading(group.date)}
                  </h3>
                  {group.items.map((movement) => (
                    <MovementCard
                      key={movement.id}
                      movement={movement}
                      showActions
                      showDate={false}
                      onEdit={setEditingMovement}
                      onDelete={setDeletingMovement}
                    />
                  ))}
                </section>
              ))}
            </div>
          )}
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
