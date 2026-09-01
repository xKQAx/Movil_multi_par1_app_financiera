import { useState } from 'react';
import Header from '../components/Header';
import { useFinance } from '../context/FinanceContext';
import { ACCENT_COLORS } from '../utils/constants';

export default function Settings() {
  const { preferences, updatePreferences, loadDemoData, clearAllData } = useFinance();
  const [confirmDemo, setConfirmDemo] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleChange = (field, value) => {
    updatePreferences({ [field]: value });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLoadDemo = () => {
    loadDemoData();
    setConfirmDemo(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => {
    clearAllData();
    setConfirmClear(false);
  };

  return (
    <div className="page settings-page">
      <Header subtitle="⚙️ Ajustes" />

      {saved && <div className="toast toast--success" role="status">Preferencias guardadas ✓</div>}

      <section className="settings-section card">
        <h2 className="section-title">Perfil</h2>
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
        <h2 className="section-title">Tema de interfaz</h2>
        <div className="theme-options">
          <button
            type="button"
            className={`theme-option${preferences.theme === 'light' ? ' theme-option--active' : ''}`}
            onClick={() => handleChange('theme', 'light')}
          >
            ☀️ Claro
          </button>
          <button
            type="button"
            className={`theme-option${preferences.theme === 'dark' ? ' theme-option--active' : ''}`}
            onClick={() => handleChange('theme', 'dark')}
          >
            🌙 Oscuro
          </button>
        </div>
      </section>

      <section className="settings-section card">
        <h2 className="section-title">Color de acento</h2>
        <div className="accent-options">
          {Object.entries({ blue: '🔵 Azul', green: '🟢 Verde', purple: '🟣 Morado' }).map(
            ([key, label]) => (
              <button
                key={key}
                type="button"
                className={`accent-option${preferences.accentColor === key ? ' accent-option--active' : ''}`}
                onClick={() => handleChange('accentColor', key)}
                style={{ '--accent-preview': ACCENT_COLORS[key].primary }}
              >
                {label}
              </button>
            )
          )}
        </div>
      </section>

      <section className="settings-section card">
        <h2 className="section-title">Datos</h2>
        {!confirmDemo ? (
          <button type="button" className="btn btn--secondary btn--block" onClick={() => setConfirmDemo(true)}>
            Cargar datos de demostración
          </button>
        ) : (
          <div className="confirm-inline">
            <p>¿Cargar datos de ejemplo? Reemplazará los movimientos actuales.</p>
            <div className="form-actions">
              <button type="button" className="btn btn--secondary" onClick={() => setConfirmDemo(false)}>
                Cancelar
              </button>
              <button type="button" className="btn btn--primary" onClick={handleLoadDemo}>
                Cargar
              </button>
            </div>
          </div>
        )}

        {!confirmClear ? (
          <button
            type="button"
            className="btn btn--danger btn--block"
            style={{ marginTop: '0.75rem' }}
            onClick={() => setConfirmClear(true)}
          >
            Borrar todos los datos
          </button>
        ) : (
          <div className="confirm-inline" style={{ marginTop: '0.75rem' }}>
            <p>¿Eliminar todos los movimientos? Esta acción no se puede deshacer.</p>
            <div className="form-actions">
              <button type="button" className="btn btn--secondary" onClick={() => setConfirmClear(false)}>
                Cancelar
              </button>
              <button type="button" className="btn btn--danger" onClick={handleClear}>
                Eliminar todo
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="settings-section card future-improvements">
        <h2 className="section-title">Mejoras futuras</h2>
        <ul className="future-list">
          <li>Presupuesto por categoría con alertas específicas</li>
          <li>Historial mensual (Junio, Julio, Agosto...)</li>
          <li>Exportación a CSV y PDF</li>
          <li>Copias de seguridad JSON (importar/exportar)</li>
          <li>Notificaciones avanzadas de presupuesto</li>
          <li>PWA instalable y empaquetado con Capacitor</li>
          <li>Migración a Supabase para persistencia en la nube</li>
        </ul>
      </section>

      <section className="settings-section card teammate-task">
        <h2 className="section-title">📋 Tarea pendiente — Compañero</h2>
        <p><strong>Mejorar visualización financiera</strong></p>
        <ol className="task-list">
          <li>Crear visualización de gastos por categoría (barras, circular o progreso)</li>
          <li>Mostrar qué categoría consume más presupuesto</li>
          <li>Mostrar porcentajes por categoría</li>
          <li>Diseño responsive coherente con tema claro/oscuro y color de acento</li>
          <li>No modificar las reglas de negocio en <code>financeRules.js</code></li>
        </ol>
      </section>
    </div>
  );
}
