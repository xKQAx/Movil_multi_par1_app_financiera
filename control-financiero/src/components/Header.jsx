import { useFinance } from '../context/FinanceContext';
import { formatMonthYear } from '../utils/formatCurrency';

export default function Header({ subtitle }) {
  const { preferences, activeMonth, activeYear } = useFinance();
  const monthLabel =
    preferences.activeMonthName || formatMonthYear(activeMonth, activeYear);

  return (
    <header className="header">
      <p className="header__greeting">Hola, {preferences.name || 'Estudiante'} 👋</p>
      <h1 className="header__title">{subtitle || monthLabel}</h1>
    </header>
  );
}
