import { Download, Monitor, Share } from 'lucide-react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

/** Card siempre visible en Ajustes: no depende de beforeinstallprompt. */
export default function InstallAppCard() {
  const { canInstall, promptInstall, isIos, isAndroid, isDesktop, isStandalone } = useInstallPrompt();

  if (isStandalone) {
    return (
      <section id="instalar" className="settings-section card install-card">
        <h2 className="section-title">Instalar app</h2>
        <p className="text-muted">Ya está instalada. La estás usando como aplicación.</p>
      </section>
    );
  }

  return (
    <section id="instalar" className="settings-section card install-card">
      <h2 className="section-title">Instalar app</h2>
      <p className="text-muted">
        Pon Control Financiero en el escritorio o en la pantalla de inicio. No hace falta tienda.
      </p>

      {canInstall && (
        <button type="button" className="btn btn--primary btn--block" onClick={promptInstall}>
          <Download size={18} aria-hidden="true" />
          Instalar ahora
        </button>
      )}

      <ol className="install-card__steps">
        {(isDesktop || (!isIos && !isAndroid)) && (
          <li>
            <Monitor size={18} aria-hidden="true" />
            <span>
              <strong>Chrome en el computador:</strong> en la barra de direcciones, a la derecha,
              toca el icono de instalar (⊕ / computador). También está en el menú ⋮ →{' '}
              <strong>Instalar Control Financiero</strong>.
            </span>
          </li>
        )}
        {(isAndroid || isDesktop) && (
          <li>
            <Download size={18} aria-hidden="true" />
            <span>
              <strong>Android (Chrome):</strong> menú ⋮ → <strong>Instalar app</strong> o{' '}
              <strong>Añadir a la pantalla de inicio</strong>
              {canInstall ? '. O usa el botón de arriba.' : '.'}
            </span>
          </li>
        )}
        {(isIos || isDesktop) && (
          <li>
            <Share size={18} aria-hidden="true" />
            <span>
              <strong>iPhone / iPad (Safari):</strong> toca <strong>Compartir</strong> (el cuadrado
              con la flecha) y luego <strong>Añadir a pantalla de inicio</strong>.
            </span>
          </li>
        )}
      </ol>
    </section>
  );
}
