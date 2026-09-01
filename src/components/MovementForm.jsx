import { useState, useEffect, useMemo, useRef } from 'react';
import { useFinance } from '../context/FinanceContext';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../utils/constants';
import { formatCurrency, formatMonthYear, getMonthYearFromDate, getTodayISO, isValidMovementDate } from '../utils/formatCurrency';
import { categoryForType } from '../utils/speechParser';
import { focusFirstInvalid } from '../utils/formFocus';
import VoiceCapture from './VoiceCapture';

function amountToInput(amount) {
  if (amount === null || amount === undefined || amount === '') return '';
  return String(amount);
}

function expenseBlockMessage(validation) {
  if (!validation || validation.allowed) return '';
  if (validation.reason === 'no_income') {
    return 'Registra primero un ingreso en ese mes para poder registrar gastos.';
  }
  return `No puedes registrar este gasto porque supera tu saldo de ese mes. Máximo disponible: ${formatCurrency(validation.maxAllowed)}`;
}

export default function MovementForm({
  type = 'expense',
  initialData = null,
  onSuccess,
  onCancel,
  enableVoice = false,
  allowTypeChange = false,
  onTypeChange,
}) {
  const { addMovement, updateMovement, validateExpense } = useFinance();
  const isEditing = !!initialData?.id;
  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const defaultCategory = categories[0];
  const today = getTodayISO();
  const formRef = useRef(null);
  const amountInputRef = useRef(null);
  const descriptionInputRef = useRef(null);

  const [form, setForm] = useState({
    description: initialData?.description || '',
    category: initialData?.category
      ? categoryForType(initialData.category, type)
      : defaultCategory,
    amount: amountToInput(initialData?.amount),
    date: initialData?.date || today,
  });
  const [errors, setErrors] = useState({});
  const [formAlert, setFormAlert] = useState('');
  const [voiceHint, setVoiceHint] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dataSyncKey = useMemo(() => {
    if (!initialData) return null;
    return [
      initialData.id ?? 'new',
      initialData.description ?? '',
      initialData.category ?? '',
      initialData.amount ?? '',
      initialData.date ?? '',
      initialData._stamp ?? '',
    ].join('|');
  }, [initialData]);

  useEffect(() => {
    if (!dataSyncKey || !initialData) return;

    const nextCategory = categoryForType(initialData.category || defaultCategory, type);
    const nextAmount = amountToInput(initialData.amount);
    setForm({
      description: initialData.description || '',
      category: nextCategory,
      amount: nextAmount,
      date: initialData.date || getTodayISO(),
    });
    setErrors({});
    setFormAlert('');
    setIsSubmitting(false);

    requestAnimationFrame(() => {
      if (nextAmount) amountInputRef.current?.focus();
      else descriptionInputRef.current?.focus();
    });
    // Solo al llegar datos de voz o edición; el cambio de tipo se cubre en el efecto de categorías.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSyncKey]);

  useEffect(() => {
    setForm((prev) => {
      if (categories.includes(prev.category)) return prev;
      return { ...prev, category: 'Otro' };
    });
  }, [type, categories]);

  const validate = () => {
    const newErrors = {};
    if (!form.description.trim()) newErrors.description = 'La descripción es obligatoria.';
    if (!form.category) newErrors.category = 'Selecciona una categoría.';
    const amount = Number(form.amount);
    if (!form.amount || Number.isNaN(amount)) newErrors.amount = 'El monto es obligatorio.';
    else if (amount <= 0) newErrors.amount = 'El monto debe ser mayor que $0.';
    else if (!Number.isInteger(amount)) newErrors.amount = 'Usa pesos enteros, sin centavos.';
    if (!form.date) newErrors.date = 'La fecha es obligatoria.';
    else if (!isValidMovementDate(form.date, today)) {
      newErrors.date = form.date > today ? 'La fecha no puede ser futura.' : 'La fecha no es válida.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleVoiceParsed = (result) => {
    if (!result?.data) return;
    const data = result.data;
    setForm((prev) => ({
      ...prev,
      description: data.description || prev.description,
      category: categoryForType(data.category || prev.category, type),
      amount: data.amount !== '' && data.amount != null ? String(data.amount) : prev.amount,
    }));
    setErrors({});
    if (result.detectedType && result.detectedType !== type) {
      setVoiceHint(
        result.detectedType === 'income'
          ? 'Detectamos un ingreso; estás en el formulario de gasto. Revisa categoría y monto antes de guardar.'
          : 'Detectamos un gasto; estás en el formulario de ingreso. Revisa categoría y monto antes de guardar.'
      );
    } else if (result.success) {
      setVoiceHint('Revisa los datos dictados y guarda cuando estén bien.');
    } else {
      setVoiceHint('Rellenamos lo que se entendió. Completa el monto u otros campos a mano.');
    }
    requestAnimationFrame(() => {
      if (data.amount) amountInputRef.current?.focus();
      else descriptionInputRef.current?.focus();
    });
  };

  const amountNum = Number(form.amount);
  const expenseValidation =
    type === 'expense' && amountNum > 0 && form.date
      ? validateExpense(amountNum, isEditing ? initialData?.id : null, form.date)
      : { allowed: true };
  const expenseBlocked = type === 'expense' && amountNum > 0 && !expenseValidation.allowed;
  const saveBlockReason = expenseBlocked ? expenseBlockMessage(expenseValidation) : '';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validate()) {
      requestAnimationFrame(() => focusFirstInvalid(formRef.current));
      return;
    }
    if (type === 'expense' && expenseBlocked) return;

    const movementData = {
      type,
      description: form.description.trim(),
      category: form.category,
      amount: Number(form.amount),
      date: form.date,
    };

    setIsSubmitting(true);

    let result;
    if (isEditing) {
      result = updateMovement(initialData.id, movementData);
    } else {
      result = addMovement(movementData);
    }

    if (result.success) {
      onSuccess?.(type);
      return;
    }

    setIsSubmitting(false);
    if (result.reason === 'exceeds_balance') {
      setFormAlert(
        `No puedes registrar este gasto. El máximo disponible ese mes es ${formatCurrency(result.maxAllowed)}.`
      );
    } else if (result.reason === 'no_income') {
      setFormAlert('Registra primero un ingreso en ese mes para poder registrar gastos.');
    } else if (result.reason === 'would_exceed_expenses') {
      setFormAlert(
        'Este cambio dejaría los gastos de ese mes por encima de los ingresos. Ajusta el monto o los egresos primero.'
      );
    } else {
      setFormAlert('No se pudo guardar. Revisa los datos e inténtalo de nuevo.');
    }
  };

  const formMonth = form.date ? getMonthYearFromDate(form.date) : null;
  const todayMonth = getMonthYearFromDate(today);
  const otherMonth =
    formMonth &&
    (formMonth.month !== todayMonth.month || formMonth.year !== todayMonth.year);

  return (
    <form ref={formRef} className="movement-form" onSubmit={handleSubmit} noValidate>
      {enableVoice && !isEditing && (
        <VoiceCapture variant="compact" lockedType={type} onParsed={handleVoiceParsed} />
      )}

      {voiceHint && (
        <p className="form-alert form-alert--info" role="status">{voiceHint}</p>
      )}

      {allowTypeChange && (
        <div className="form-group">
          <span id="movement-type-label">Tipo</span>
          <div className="segmented" role="group" aria-labelledby="movement-type-label">
            <button
              type="button"
              className={`segmented__btn${type === 'income' ? ' segmented__btn--active' : ''}`}
              onClick={() => onTypeChange?.('income')}
              aria-pressed={type === 'income'}
            >
              Ingreso
            </button>
            <button
              type="button"
              className={`segmented__btn${type === 'expense' ? ' segmented__btn--active' : ''}`}
              onClick={() => onTypeChange?.('expense')}
              aria-pressed={type === 'expense'}
            >
              Gasto
            </button>
          </div>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="description">Descripción</label>
        <input
          ref={descriptionInputRef}
          id="description"
          type="text"
          value={form.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder={type === 'income' ? 'Ej: Mesada' : 'Ej: Almuerzo'}
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? 'description-error' : undefined}
        />
        {errors.description && <p id="description-error" className="form-error">{errors.description}</p>}
      </div>

      <div className="form-group">
        <label htmlFor="category">Categoría</label>
        <select
          id="category"
          value={categories.includes(form.category) ? form.category : 'Otro'}
          onChange={(e) => handleChange('category', e.target.value)}
          aria-invalid={!!errors.category}
          aria-describedby={errors.category ? 'category-error' : undefined}
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        {errors.category && <p id="category-error" className="form-error">{errors.category}</p>}
      </div>

      <div className="form-group">
        <label htmlFor="amount">Monto</label>
        <input
          ref={amountInputRef}
          id="amount"
          type="number"
          min="1"
          step="1"
          value={form.amount}
          onChange={(e) => handleChange('amount', e.target.value)}
          placeholder="0"
          aria-invalid={!!errors.amount}
          aria-describedby={errors.amount ? 'amount-error' : undefined}
        />
        {errors.amount && <p id="amount-error" className="form-error">{errors.amount}</p>}
      </div>

      <div className="form-group">
        <label htmlFor="date">Fecha</label>
        <input
          id="date"
          type="date"
          value={form.date}
          max={today}
          onChange={(e) => handleChange('date', e.target.value)}
          aria-invalid={!!errors.date}
          aria-describedby={otherMonth ? 'date-month-hint' : errors.date ? 'date-error' : undefined}
        />
        {errors.date && <p id="date-error" className="form-error">{errors.date}</p>}
        {otherMonth && !errors.date && (
          <p id="date-month-hint" className="form-alert form-alert--info" role="status">
            Este movimiento cuenta para {formatMonthYear(formMonth.month, formMonth.year)}, no para el mes actual.
          </p>
        )}
      </div>

      {formAlert && (
        <div className="form-alert form-alert--error" role="alert">
          {formAlert}
        </div>
      )}

      <div className="form-actions">
        {onCancel && (
          <button type="button" className="btn btn--secondary" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </button>
        )}
        <button
          type="submit"
          className="btn btn--primary"
          disabled={expenseBlocked || isSubmitting}
          aria-busy={isSubmitting}
          aria-describedby={expenseBlocked ? 'save-blocked-reason' : undefined}
        >
          {isSubmitting ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Guardar'}
        </button>
      </div>
      {saveBlockReason && (
        <p id="save-blocked-reason" className="form-error form-error--block" role="status">
          {saveBlockReason}
        </p>
      )}
    </form>
  );
}
