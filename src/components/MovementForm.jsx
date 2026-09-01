import { useState, useEffect, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../utils/constants';
import { formatCurrency, getTodayISO } from '../utils/formatCurrency';
import { BUDGET_STATUS } from '../utils/financeRules';

export default function MovementForm({
  type = 'expense',
  initialData = null,
  onSuccess,
  onCancel,
}) {
  const { addMovement, updateMovement, validateExpense, budgetStatus } = useFinance();
  const isEditing = !!initialData?.id;
  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const defaultCategory = categories[0];

  const [form, setForm] = useState({
    description: initialData?.description || '',
    category: initialData?.category || defaultCategory,
    amount: initialData?.amount?.toString() || '',
    date: initialData?.date || getTodayISO(),
  });
  const [errors, setErrors] = useState({});
  const [expenseError, setExpenseError] = useState('');

  // Clave estable para sincronizar datos de voz o edición sin bucles por referencia
  const dataSyncKey = useMemo(() => {
    if (!initialData) return null;
    return [
      initialData.id ?? 'new',
      initialData.description ?? '',
      initialData.category ?? '',
      initialData.amount ?? '',
      initialData.date ?? '',
    ].join('|');
  }, [initialData]);

  useEffect(() => {
    if (!dataSyncKey) return;

    setForm({
      description: initialData.description || '',
      category: initialData.category || defaultCategory,
      amount: initialData.amount?.toString() || '',
      date: initialData.date || getTodayISO(),
    });
    setErrors({});
    setExpenseError('');
  }, [dataSyncKey, initialData, defaultCategory]);

  const validate = () => {
    const newErrors = {};
    if (!form.description.trim()) newErrors.description = 'La descripción es obligatoria.';
    if (!form.category) newErrors.category = 'Selecciona una categoría.';
    const amount = Number(form.amount);
    if (!form.amount || isNaN(amount)) newErrors.amount = 'El monto es obligatorio.';
    else if (amount <= 0) newErrors.amount = 'El monto debe ser mayor que $0.';
    if (!form.date) newErrors.date = 'La fecha es obligatoria.';
    else if (form.date > getTodayISO()) {
      newErrors.date = 'La fecha no puede ser futura.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkExpenseLimit = () => {
    if (type !== 'expense') return true;

    if (budgetStatus === BUDGET_STATUS.NO_INCOME) {
      setExpenseError('Registra primero un ingreso para poder registrar gastos.');
      return false;
    }

    const amount = Number(form.amount);
    if (!amount || amount <= 0) return true;

    const validation = validateExpense(amount, isEditing ? initialData.id : null);
    if (!validation.allowed) {
      setExpenseError(
        `No puedes registrar este gasto porque supera tu saldo disponible. Máximo disponible para gastar: ${formatCurrency(validation.maxAllowed)}`
      );
      return false;
    }

    setExpenseError('');
    return true;
  };

  useEffect(() => {
    if (type === 'expense' && form.amount) {
      checkExpenseLimit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.amount, type]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (type === 'expense' && !checkExpenseLimit()) return;

    const movementData = {
      type,
      description: form.description.trim(),
      category: form.category,
      amount: Number(form.amount),
      date: form.date,
    };

    let result;
    if (isEditing) {
      result = updateMovement(initialData.id, movementData);
    } else {
      result = addMovement(movementData);
    }

    if (result.success) {
      onSuccess?.(type);
    } else if (result.reason === 'exceeds_balance') {
      setExpenseError(
        `No puedes registrar este gasto. El máximo disponible es ${formatCurrency(result.maxAllowed)}.`
      );
    } else if (result.reason === 'no_income') {
      setExpenseError('Registra primero un ingreso para poder registrar gastos.');
    }
  };

  const amountNum = Number(form.amount);
  const expenseBlocked =
    type === 'expense' &&
    (budgetStatus === BUDGET_STATUS.NO_INCOME ||
      (amountNum > 0 && !validateExpense(amountNum, isEditing ? initialData?.id : null).allowed));

  return (
    <form className="movement-form" onSubmit={handleSubmit} noValidate>
      <div className="form-group">
        <label htmlFor="description">Descripción</label>
        <input
          id="description"
          type="text"
          value={form.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder={type === 'income' ? 'Ej: Mesada' : 'Ej: Almuerzo'}
          aria-invalid={!!errors.description}
        />
        {errors.description && <p className="form-error">{errors.description}</p>}
      </div>

      <div className="form-group">
        <label htmlFor="category">Categoría</label>
        <select
          id="category"
          value={form.category}
          onChange={(e) => handleChange('category', e.target.value)}
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        {errors.category && <p className="form-error">{errors.category}</p>}
      </div>

      <div className="form-group">
        <label htmlFor="amount">Monto</label>
        <input
          id="amount"
          type="number"
          min="1"
          step="1"
          value={form.amount}
          onChange={(e) => handleChange('amount', e.target.value)}
          placeholder="0"
          aria-invalid={!!errors.amount}
        />
        {errors.amount && <p className="form-error">{errors.amount}</p>}
      </div>

      <div className="form-group">
        <label htmlFor="date">Fecha</label>
        <input
          id="date"
          type="date"
          value={form.date}
          max={getTodayISO()}
          onChange={(e) => handleChange('date', e.target.value)}
        />
        {errors.date && <p className="form-error">{errors.date}</p>}
      </div>

      {expenseError && (
        <div className="form-alert form-alert--error" role="alert">
          {expenseError}
        </div>
      )}

      <div className="form-actions">
        {onCancel && (
          <button type="button" className="btn btn--secondary" onClick={onCancel}>
            Cancelar
          </button>
        )}
        <button
          type="submit"
          className="btn btn--primary"
          disabled={expenseBlocked}
        >
          {isEditing ? 'Guardar cambios' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}
