const PESOS_FORMATTER = new Intl.NumberFormat('es-CO', {
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

const MAX_PESOS_DIGITS = 12;

/** Formatea montos en pesos colombianos (COP), sin centavos. */
export function formatCurrency(amount) {
  const value = Number(amount) || 0;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Extrae un entero en pesos desde texto (escribe, pega "$ 800.000", etc.).
 * Vacío si no hay dígitos. Sin decimales.
 */
export function parsePesosInput(raw) {
  let text = String(raw ?? '').replace(/[^\d.,]/g, '');
  text = text.replace(/[.,]\d{1,2}$/, '');
  const digits = text.replace(/\D/g, '').slice(0, MAX_PESOS_DIGITS);
  if (!digits) return '';
  const value = Number(digits);
  return Number.isFinite(value) ? value : '';
}

/** Separador de miles es-CO para el input: 800000 → "800.000". */
export function formatPesosInput(value) {
  if (value === '' || value === null || value === undefined) return '';
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  return PESOS_FORMATTER.format(Math.trunc(Math.abs(n)));
}

/** Desplaza un mes (delta ±1, ±2…). */
export function shiftMonthYear(month, year, delta) {
  const date = new Date(year, month + delta, 1);
  return { month: date.getMonth(), year: date.getFullYear() };
}

/** true si (month, year) es posterior al mes de referencia. */
export function isMonthAfter(month, year, refMonth, refYear) {
  return year > refYear || (year === refYear && month > refMonth);
}

export function isSameMonth(month, year, otherMonth, otherYear) {
  return month === otherMonth && year === otherYear;
}

export function getCalendarMonth(now = new Date()) {
  return { month: now.getMonth(), year: now.getFullYear() };
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
