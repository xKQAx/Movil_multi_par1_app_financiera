import { useState } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { BUDGET_STATUS } from '../utils/financeRules';

/**
 * Fallback in-app de la notificación crítica: se muestra aunque el SO
 * no permita Notification API (típico en móvil sin gesto previo).
 */
export default function CriticalBanner() {
  const {
    budgetStatus,
    remainingPercentage,
    monthKey,
    notificationPermission,
    requestNotificationPermission,
  } = useFinance();
  const [dismissedKey, setDismissedKey] = useState(() => {
    try {
      return sessionStorage.getItem('cf_critical_banner_dismissed') || '';
    } catch {
      return '';
    }
  });
  const [permMessage, setPermMessage] = useState('');

  if (budgetStatus !== BUDGET_STATUS.CRITICAL) return null;
  if (dismissedKey === monthKey) return null;

  const handleDismiss = () => {
    try {
      sessionStorage.setItem('cf_critical_banner_dismissed', monthKey);
    } catch {
      /* ignore */
    }
    setDismissedKey(monthKey);
  };

  const handleEnableNotifications = async () => {
    const result = await requestNotificationPermission();
    if (result.granted) {
      setPermMessage('Notificaciones del sistema activadas.');
    } else if (result.denied) {
      setPermMessage(
        'El navegador bloqueó las notificaciones. Esta alerta in-app seguirá avisándote.'
      );
    } else if (!result.supported) {
      setPermMessage('Este navegador no soporta notificaciones del sistema. Usamos esta alerta.');
    }
  };

  const pct = remainingPercentage !== null ? remainingPercentage.toFixed(0) : '—';
  const showEnableBtn =
    notificationPermission === 'default' || notificationPermission === 'unsupported';

  return (
    <aside className="critical-banner" role="alert">
      <Bell size={22} className="critical-banner__icon" aria-hidden="true" />
      <div className="critical-banner__body">
        <p className="critical-banner__title">Presupuesto crítico</p>
        <p className="critical-banner__text">
          Te queda menos del 10 % de tu presupuesto este mes ({pct} % disponible).
        </p>
        {permMessage && <p className="critical-banner__hint">{permMessage}</p>}
        {showEnableBtn && (
          <button
            type="button"
            className="btn btn--sm critical-banner__action"
            onClick={handleEnableNotifications}
          >
            Activar avisos del sistema
          </button>
        )}
        {notificationPermission === 'denied' && (
          <p className="critical-banner__hint">
            <BellOff size={14} aria-hidden="true" /> El sistema no notificará; esta alerta cubre el
            aviso en la app.
          </p>
        )}
      </div>
      <button
        type="button"
        className="critical-banner__close"
        onClick={handleDismiss}
        aria-label="Cerrar aviso crítico"
      >
        <X size={18} />
      </button>
    </aside>
  );
}
