import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../utils/constants';

/**
 * Control único de cierre de sesión (DRY).
 * variant: header (móvil) | sidebar (escritorio) | block (Ajustes).
 */
export default function LogoutButton({ variant = 'header' }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(ROUTES.landing, { replace: true });
  };

  return (
    <button
      type="button"
      className={`logout-btn logout-btn--${variant}`}
      onClick={handleLogout}
      aria-label="Cerrar sesión"
    >
      <LogOut size={18} aria-hidden="true" />
      <span>Cerrar sesión</span>
    </button>
  );
}
