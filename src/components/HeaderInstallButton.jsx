import { Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { ROUTES } from '../utils/constants';

/** Control discreto: instala si el navegador lo permite; si no, lleva a Ajustes. */
export default function HeaderInstallButton() {
  const navigate = useNavigate();
  const { canInstall, promptInstall, isStandalone } = useInstallPrompt();

  if (isStandalone) return null;

  const handleClick = async () => {
    if (canInstall) {
      await promptInstall();
      return;
    }
    navigate(`${ROUTES.settings}#instalar`);
  };

  return (
    <button
      type="button"
      className="header__install"
      onClick={handleClick}
      aria-label={canInstall ? 'Instalar app' : 'Cómo instalar la app'}
      title={canInstall ? 'Instalar app' : 'Cómo instalar'}
    >
      <Download size={18} aria-hidden="true" />
    </button>
  );
}
