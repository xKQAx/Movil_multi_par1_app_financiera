import { useFinance } from '../context/FinanceContext';
import { formatMonthYear } from '../utils/formatCurrency';
import LogoutButton from './LogoutButton';

export default function Header({ subtitle }) {
  const { preferences, activeMonth, activeYear } = useFinance();
  const monthLabel =
    preferences.activeMonthName || formatMonthYear(activeMonth, activeYear);

  return (
    <header className="header">
      <div className="header__row">
        <div className="header__text">
          <p className="header__greeting">Hola, {preferences.name || 'Estudiante'} 👋</p>
          <h1 className="header__title">{subtitle || monthLabel}</h1>
        </div>
        <LogoutButton variant="header" />
      </div>
    </header>
  );
}
