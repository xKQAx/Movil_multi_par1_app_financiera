import { formatCurrency, formatShortDate } from '../utils/formatCurrency';
import { CATEGORY_EMOJIS } from '../utils/constants';

export default function MovementCard({
  movement,
  onEdit,
  onDelete,
  showActions = false,
  showDate = true,
}) {
  const isIncome = movement.type === 'income';
  const emoji = CATEGORY_EMOJIS[movement.category] || '📌';

  return (
    <article className={`movement-card movement-card--${movement.type}`}>
      <div className="movement-card__icon" aria-hidden="true">
        {emoji}
      </div>
      <div className="movement-card__info">
        <p className="movement-card__description">{movement.description}</p>
        <p className="movement-card__meta">
          {showDate ? `${movement.category} · ${formatShortDate(movement.date)}` : movement.category}
        </p>
      </div>
      <div className="movement-card__right">
        <p className={`movement-card__amount movement-card__amount--${movement.type}`}>
          {isIncome ? '+' : '−'}{formatCurrency(movement.amount)}
        </p>
        {showActions && (
          <div className="movement-card__actions">
            {onEdit && (
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => onEdit(movement)}
                aria-label={`Editar ${movement.description}`}
              >
                Editar
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                className="btn btn--ghost btn--sm btn--danger"
                onClick={() => onDelete(movement)}
                aria-label={`Eliminar ${movement.description}`}
              >
                Eliminar
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
