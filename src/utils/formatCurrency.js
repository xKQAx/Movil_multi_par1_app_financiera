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

/** Obtiene mes y año de una fecha ISO (YYYY-MM-DD). */
export function getMonthYearFromDate(dateStr) {
  const date = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(date.getTime())) {
    const now = new Date();
    return { month: now.getMonth(), year: now.getFullYear() };
  }
  return { month: date.getMonth(), year: date.getFullYear() };
}

/** Fecha ISO calendario válida y no futura. */
export function isValidMovementDate(dateStr, today = getTodayISO()) {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const date = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(date.getTime())) return false;
  return dateStr <= today;
}

/** Fecha local actual en formato YYYY-MM-DD (evita el salto de día por UTC). */
export function getTodayISO() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
