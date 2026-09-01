/** Enfoca el primer campo marcado como inválido (tras validar). */
export function focusFirstInvalid(formEl) {
  const invalid = formEl?.querySelector('[aria-invalid="true"]');
  if (invalid && typeof invalid.focus === 'function') {
    invalid.focus();
  }
}
