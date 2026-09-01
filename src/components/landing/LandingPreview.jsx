import { AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import { PREVIEW_SNAPSHOT } from './landingContent';

/**
 * Mock visual de la app (datos fijos, sin estado real).
 * aria-hidden: es decorativa; el copy del hero lleva el mensaje.
 */
export default function LandingPreview() {
  const { monthLabel, income, expenses, balance, remainingPercent, movements } = PREVIEW_SNAPSHOT;

  return (
    <aside className="landing-preview" aria-hidden="true">
      <div className="landing-preview__frame">
        <div className="landing-preview__chrome">
          <span className="landing-preview__dots">
            <span />
            <span />
            <span />
          </span>
          <span className="landing-preview__chrome-title">{monthLabel}</span>
        </div>

        <div className="landing-preview__balance">
          <p className="landing-preview__balance-label">Saldo disponible</p>
          <p className="landing-preview__balance-amount">{formatCurrency(balance)}</p>
          <div className="landing-preview__balance-row">
            <span>
              Ingresos <strong>{formatCurrency(income)}</strong>
            </span>
            <span>
              Gastos <strong>{formatCurrency(expenses)}</strong>
            </span>
          </div>
          <div className="landing-preview__progress">
            <div className="landing-preview__track">
              <div
                className="landing-preview__fill"
                style={{ width: `${remainingPercent}%` }}
              />
            </div>
            <span>{remainingPercent} %</span>
          </div>
        </div>

        <div className="landing-preview__alert">
          <span className="landing-preview__alert-icon" aria-hidden="true">
            <AlertTriangle size={16} />
          </span>
          <div>
            <p className="landing-preview__alert-title">Precaución</p>
            <p>Te queda el {remainingPercent} % del mes. Mejor pausar las salidas.</p>
          </div>
        </div>

        <ul className="landing-preview__moves">
          {movements.map((item) => (
            <li key={item.description}>
              <span className="landing-preview__emoji">{item.emoji}</span>
              <span className="landing-preview__move-info">
                <strong>{item.description}</strong>
                <small>{item.category}</small>
              </span>
              <span className="landing-preview__move-amount">
                −{formatCurrency(item.amount)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
