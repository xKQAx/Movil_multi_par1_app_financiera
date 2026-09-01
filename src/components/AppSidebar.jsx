import { NavLink } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import { ROUTES } from '../utils/constants';
import { NAV_ITEMS } from './navItems';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import LogoutButton from './LogoutButton';

/** Navegación lateral de escritorio. Reutiliza NAV_ITEMS (DRY con la barra inferior). */
export default function AppSidebar() {
  const { user } = useAuth();
  const { preferences } = useFinance();
  const displayName = preferences.name || user?.name || 'Estudiante';

  return (
    <aside className="app-sidebar" aria-label="Navegación principal">
      <NavLink to={ROUTES.dashboard} className="app-sidebar__brand">
        <span className="app-sidebar__mark" aria-hidden="true">
          <Wallet size={16} />
        </span>
        <span>Control Financiero</span>
      </NavLink>

      <nav className="app-sidebar__nav">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === ROUTES.dashboard}
            className={({ isActive }) =>
              `app-sidebar__item${isActive ? ' app-sidebar__item--active' : ''}`
            }
          >
            <Icon size={20} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="app-sidebar__footer">
        <div className="app-sidebar__user">
          <p className="app-sidebar__user-name">{displayName}</p>
          {user?.email && (
            <p className="app-sidebar__user-email" title={user.email}>
              {user.email}
            </p>
          )}
        </div>
        <LogoutButton variant="sidebar" />
      </div>
    </aside>
  );
}
