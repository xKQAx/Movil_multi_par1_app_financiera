import { formatPesosField, parsePesosInput } from '../utils/formatCurrency';

/**
 * Input de pesos enteros. El value controlado es un entero (o '');
 * lo que se VE es `$ 800.000` (miles es-CO, sin decimales).
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
  const commit = (raw) => {
    onChange(parsePesosInput(raw));
  };

  return (
    <input
      ref={inputRef}
      id={id}
      className="currency-field"
      type="text"
      inputMode="numeric"
      autoComplete="off"
      enterKeyHint="done"
      placeholder={placeholder}
      value={formatPesosField(value)}
      onChange={(event) => commit(event.target.value)}
      onBlur={(event) => commit(event.target.value)}
      disabled={disabled}
      aria-invalid={invalid}
      aria-describedby={describedBy}
    />
  );
}
