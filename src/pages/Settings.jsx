import { useEffect, useRef, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import Header from '../components/Header';
import LogoutButton from '../components/LogoutButton';
import ConfirmDialog from '../components/ConfirmDialog';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { ACCENT_COLORS } from '../utils/constants';
import { useToast } from '../hooks/useToast';

const PERMISSION_LABELS = {
  granted: 'Activadas en el sistema',
  denied: 'Bloqueadas por el navegador',
  default: 'Aún no se ha pedido permiso',
  unsupported: 'Este navegador no las soporta',
};

const THEME_OPTIONS = [
  { id: 'light', label: 'Claro', icon: Sun },
  { id: 'dark', label: 'Oscuro', icon: Moon },
];

const ACCENT_OPTIONS = [
  { id: 'blue', label: 'Azul' },
  { id: 'green', label: 'Verde' },
  { id: 'purple', label: 'Morado' },
];

/** Complementos útiles para el parcial que aún no están en la app. Una sola lista. */
const COMPLEMENTARY_IMPROVEMENTS = [
  {
    title: 'Nube y cuenta real',
    text: 'Sesión y movimientos en Supabase (Auth + Postgres). Es la tarea de la compañera; hoy todo queda en este dispositivo.',
  },
  {
    title: 'App instalable',
    text: 'PWA con icono en el celular y avisos aunque cierres la pestaña.',
  },
  {
    title: 'Historial por meses',
    text: 'Cambiar de mes y revisar meses anteriores, no solo el calendario actual.',
  },
  {
    title: 'Exportar movimientos',
    text: 'Descargar el mes en CSV o PDF para Excel o una entrega.',
  },
  {
    title: 'Tope por categoría',
    text: 'Límite propio en alimentación, transporte y demás, con alerta al acercarte.',
  },
];

export default function Settings() {
  const { preferences, updatePreferences, loadDemoData, clearAllData, notificationPermission, requestNotificationPermission } =
    useFinance();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [confirmAction, setConfirmAction] = useState(null);
  const [saved, setSaved] = useState(false);
  const [notifHint, setNotifHint] = useState('');
  const savedTimer = useRef(null);

  useEffect(() => () => clearTimeout(savedTimer.current), []);

  const markSaved = () => {
    setSaved(true);
    clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaved(false), 1600);
  };

  const handleChange = (field, value) => {
    updatePreferences({ [field]: value });
    markSaved();
  };

  const handleConfirm = () => {
    if (confirmAction === 'demo') {
      loadDemoData();
      showToast('Datos de demostración cargados ✓');
    } else if (confirmAction === 'clear') {
      clearAllData();
      showToast('Movimientos eliminados ✓');
    }
    setConfirmAction(null);
  };

  const handleEnableNotifications = async () => {
    const result = await requestNotificationPermission();
    if (result.granted) {
      setNotifHint('Permiso concedido. Si llegas a crítico, el sistema también avisará.');
    } else if (result.denied) {
      setNotifHint(
        'El navegador bloqueó el permiso. La alerta in-app (banner rojo) seguirá funcionando.'
      );
    } else if (!result.supported) {
      setNotifHint('No hay Notification API aquí. El aviso crítico se muestra dentro de la app.');
    } else {
      setNotifHint('Permiso no concedido. El aviso crítico se muestra dentro de la app.');
    }
  };

  return (
    <div className="page settings-page">
      <Header subtitle="Ajustes" />
      <p className="settings-saved" role="status" aria-live="polite">
        {saved ? 'Guardado en este dispositivo' : '\u00a0'}
      </p>

      <section className="settings-section card">
        <h2 className="section-title">Perfil</h2>
        {user?.email && (
          <p className="text-muted settings-session">
            Sesión: {user.email}
          </p>
        )}
        <div className="form-group">
          <label htmlFor="name">¿Cómo quieres que te llamemos?</label>
          <input
            id="name"
            type="text"
            value={preferences.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Carlos"
          />
        </div>
        <div className="form-group">
          <label htmlFor="monthName">Nombre del mes</label>
          <input
            id="monthName"
            type="text"
            value={preferences.activeMonthName}
            onChange={(e) => handleChange('activeMonthName', e.target.value)}
            placeholder='Ej: "Mes del viaje 🌎"'
          />
        </div>
      </section>

      <section className="settings-section card">
        <h2 className="section-title">Notificaciones</h2>
        <p className="text-muted">
          El aviso crítico <strong>siempre</strong> aparece como banner rojo dentro de la app.
          Las notificaciones del sistema son un extra: el navegador (sobre todo en móvil) pide un
          toque para conceder permiso. Si las bloqueas, puedes reactivarlas en la configuración
          del sitio; el banner in-app seguirá funcionando igual.
        </p>
        <p className="settings-notif-status">
          Estado: {PERMISSION_LABELS[notificationPermission] || PERMISSION_LABELS.default}
        </p>
        {notificationPermission !== 'granted' && (
          <button
            type="button"
            className="btn btn--primary btn--block"
            onClick={handleEnableNotifications}
          >
            Activar notificaciones del sistema
          </button>
        )}
        {notifHint && <p className="text-muted settings-notif-hint">{notifHint}</p>}
      </section>

      <section className="settings-section card">
        <h2 className="section-title">Tema de interfaz</h2>
        <div className="theme-options" role="group" aria-label="Tema">
          {THEME_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                type="button"
                className={`theme-option${preferences.theme === option.id ? ' theme-option--active' : ''}`}
                onClick={() => handleChange('theme', option.id)}
                aria-pressed={preferences.theme === option.id}
              >
                <Icon size={18} aria-hidden="true" />
                {option.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="settings-section card">
        <h2 className="section-title">Color de acento</h2>
        <div className="accent-options" role="group" aria-label="Color de acento">
          {ACCENT_OPTIONS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className={`accent-option${preferences.accentColor === id ? ' accent-option--active' : ''}`}
              onClick={() => handleChange('accentColor', id)}
              aria-pressed={preferences.accentColor === id}
              style={{ '--accent-preview': ACCENT_COLORS[id].primary }}
            >
              <span
                className="accent-option__swatch"
                style={{ background: ACCENT_COLORS[id].primary }}
                aria-hidden="true"
              />
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="settings-section card">
        <h2 className="section-title">Datos</h2>
        <button type="button" className="btn btn--secondary btn--block" onClick={() => setConfirmAction('demo')}>
          Cargar datos de demostración
        </button>
        <button
          type="button"
          className="btn btn--danger btn--block settings-clear-btn"
          onClick={() => setConfirmAction('clear')}
        >
          Borrar todos los datos
        </button>
      </section>

      <section className="settings-section card">
        <h2 className="section-title">Sesión</h2>
        <LogoutButton variant="block" />
      </section>

      <section className="settings-section card improvements-card">
        <h2 className="section-title">Mejoras complementarias</h2>
        <p className="text-muted">
          Lo esencial del parcial ya está. Estos cinco extras vendrían después.
        </p>
        <ol className="task-list">
          {COMPLEMENTARY_IMPROVEMENTS.map((item) => (
            <li key={item.title}>
              <strong>{item.title}.</strong> {item.text}
            </li>
          ))}
        </ol>
        <p className="text-muted settings-console-note">
          Un error de consola con <code>startTime</code> / <code>reportAllChanges</code> suele
          venir de una extensión o DevTools (web-vitals), no de esta app, y no la rompe.
        </p>
      </section>

      <ConfirmDialog
        open={confirmAction === 'demo'}
        title="¿Cargar datos de ejemplo?"
        message="Reemplazará los movimientos actuales de este mes."
        confirmLabel="Cargar"
        confirmVariant="primary"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmDialog
        open={confirmAction === 'clear'}
        title="¿Eliminar todos los movimientos?"
        message="Esta acción no se puede deshacer."
        confirmLabel="Eliminar todo"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
