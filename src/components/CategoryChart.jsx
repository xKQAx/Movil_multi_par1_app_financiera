import { formatCurrency } from '../utils/formatCurrency';
import { CATEGORY_EMOJIS } from '../utils/constants';

/**
 * Barras de progreso horizontales para gastos por categoría.
 * Muestra porcentaje del total y resalta la categoría dominante.
 */
export default function CategoryChart({ expensesByCategory, totalExpenses }) {
  if (!expensesByCategory.length || totalExpenses <= 0) {
    return null;
  }

  const topCategory = expensesByCategory[0]?.category;

  return (
    <ul className="category-chart" aria-label="Distribución de gastos por categoría">
      {expensesByCategory.map(({ category, amount }) => {
        const percentage = Math.round((amount / totalExpenses) * 100);
        const isTop = category === topCategory;

        return (
          <li key={category} className="category-chart__item">
            <div className="category-chart__header">
              <span className="category-chart__name">
                {CATEGORY_EMOJIS[category] || '📌'} {category}
                {isTop && expensesByCategory.length > 1 && (
                  <span className="category-chart__badge">Mayor gasto</span>
                )}
              </span>
              <span className="category-chart__meta">
                {formatCurrency(amount)} · {percentage}%
              </span>
            </div>
            <div
              className="category-chart__track"
              role="progressbar"
              aria-valuenow={percentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${category}: ${percentage}% del total`}
            >
              <div
                className={`category-chart__bar${isTop ? ' category-chart__bar--top' : ''}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
