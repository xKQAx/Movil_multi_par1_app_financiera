import { formatPesosInput, parsePesosInput } from '../utils/formatCurrency';

/**
 * Input de pesos enteros con miles es-CO (800.000).
 * El padre guarda un entero o '' ; al persistir sigue siendo pesos sin centavos.
 */
export default function CurrencyInput({
  id,
  value,
  onChange,
  placeholder = '0',
  disabled = false,
  invalid = false,
  describedBy,
  inputRef,
}) {
  return (
    <div className="currency-input">
      <span className="currency-input__prefix" aria-hidden="true">
        $
      </span>
      <input
        ref={inputRef}
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        enterKeyHint="done"
        placeholder={placeholder}
        value={formatPesosInput(value)}
        onChange={(event) => onChange(parsePesosInput(event.target.value))}
        disabled={disabled}
        aria-invalid={invalid}
        aria-describedby={describedBy}
      />
    </div>
  );
}
