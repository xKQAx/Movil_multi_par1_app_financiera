import { Download } from 'lucide-react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

/** CTA de PWA: botón nativo si existe, o pista corta para iOS Safari. */
export default function InstallAppCard() {
  const { canInstall, promptInstall, isIos, isStandalone } = useInstallPrompt();

  if (isStandalone) {
    return (
      <section className="settings-section card">
        <h2 className="section-title">Instalar app</h2>
        <p className="text-muted">Ya estás usando Control Financiero como app instalada.</p>
      </section>
    );
  }

  return (
    <section className="settings-section card">
      <h2 className="section-title">Instalar app</h2>
      {canInstall && (
        <button type="button" className="btn btn--primary btn--block" onClick={promptInstall}>
          <Download size={18} aria-hidden="true" />
          Instalar app
        </button>
      )}
      {isIos && (
        <p className="text-muted">
          En iPhone o iPad: toca <strong>Compartir</strong> y luego{' '}
          <strong>Añadir a pantalla de inicio</strong>.
        </p>
      )}
      {!canInstall && !isIos && (
        <p className="text-muted">
          En Android (Chrome): el navegador mostrará Instalar cuando la app esté en HTTPS.
          En iPhone: Compartir → «Añadir a pantalla de inicio».
        </p>
      )}
    </section>
  );
}
