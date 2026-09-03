import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatMonthYear } from '../utils/formatCurrency';

/** Barra compacta: mes anterior / siguiente (sin pasar del mes calendario). */
export default function MonthSwitcher({ asTitle = false }) {
  const {
    activeMonth,
    activeYear,
    isCurrentMonth,
    preferences,
    goToPreviousMonth,
    goToNextMonth,
  } = useFinance();

  const calendarLabel = formatMonthYear(activeMonth, activeYear);
  const label =
    isCurrentMonth && preferences.activeMonthName.trim()
      ? preferences.activeMonthName.trim()
      : calendarLabel;
  const LabelTag = asTitle ? 'h1' : 'p';

  return (
    <div className="month-switcher" role="group" aria-label="Mes visible">
      <button
        type="button"
        className="month-switcher__btn"
        onClick={goToPreviousMonth}
        aria-label="Mes anterior"
      >
        <ChevronLeft size={20} aria-hidden="true" />
      </button>
      <LabelTag className={`month-switcher__label${asTitle ? ' month-switcher__label--title' : ''}`} aria-live="polite">
        {label}
      </LabelTag>
      <button
        type="button"
        className="month-switcher__btn"
        onClick={goToNextMonth}
        disabled={isCurrentMonth}
        aria-label="Mes siguiente"
      >
        <ChevronRight size={20} aria-hidden="true" />
      </button>
    </div>
  );
}
