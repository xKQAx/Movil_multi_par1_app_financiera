export function toClientMovement(row) {
  return {
    id: row.id,
    type: row.type,
    description: row.description,
    category: row.category,
    amount: Number(row.amount),
    date: formatSqlDate(row.date),
  };
}

export function toClientPreferences(row, fallbackName = '') {
  return {
    name: row?.display_name || fallbackName || 'Estudiante',
    theme: row?.theme === 'dark' ? 'dark' : 'light',
    accentColor: ['blue', 'green', 'purple'].includes(row?.accent_color)
      ? row.accent_color
      : 'blue',
    activeMonthName: row?.active_month_name || '',
  };
}

function formatSqlDate(value) {
  if (!value) return '';
  if (typeof value === 'string') return value.slice(0, 10);
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  return String(value).slice(0, 10);
}

export function isUniqueViolation(error) {
  return error?.code === '23505' || /duplicate key|unique constraint/i.test(String(error?.message || ''));
}
