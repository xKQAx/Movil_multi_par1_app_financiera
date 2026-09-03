import { useFinance } from '../context/FinanceContext';
import HeaderInstallButton from './HeaderInstallButton';
import LogoutButton from './LogoutButton';
import MonthSwitcher from './MonthSwitcher';

export default function Header({ subtitle, showMonthNav = false }) {
  const { preferences } = useFinance();

  return (
    <header className="header">
      <div className="header__row">
        <div className="header__text">
          <p className="header__greeting">Hola, {preferences.name || 'Estudiante'} 👋</p>
          {subtitle ? <h1 className="header__title">{subtitle}</h1> : null}
        </div>
        <div className="header__actions">
          <HeaderInstallButton />
          <LogoutButton variant="header" />
        </div>
      </div>
      {showMonthNav && <MonthSwitcher asTitle={!subtitle} />}
    </header>
  );
}
