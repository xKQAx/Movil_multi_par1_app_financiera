/** Formatea montos en pesos colombianos (COP). */
export function formatCurrency(amount) {
  const value = Number(amount) || 0;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/** Formatea fecha corta: "31 Ago" */
export function formatShortDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T12:00:00');
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}

/** Formatea mes y año: "Agosto 2026" */
export function formatMonthYear(month, year) {
  const date = new Date(year, month, 1);
  const formatted = date.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

/** Obtiene mes y año de una fecha ISO */
export function getMonthYearFromDate(dateStr) {
  const date = new Date(dateStr + 'T12:00:00');
  return { month: date.getMonth(), year: date.getFullYear() };
}

/** Fecha actual en formato YYYY-MM-DD */
export function getTodayISO() {
  return new Date().toISOString().split('T')[0];
}
