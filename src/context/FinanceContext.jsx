import { createContext, useContext, useMemo, useEffect, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import {
  calculateIncome,
  calculateExpenses,
  calculateBalance,
  calculateRemainingPercentage,
  getBudgetStatus,
  getExpensesByCategory,
  canAddExpense,
  generateId,
  BUDGET_STATUS,
} from '../utils/financeRules';
import {
  DEFAULT_PREFERENCES,
  DEMO_MOVEMENTS,
  EMPTY_MOVEMENTS,
  EMPTY_CRITICAL_NOTIFIED,
} from '../utils/constants';

const FinanceContext = createContext(null);

export function FinanceProvider({ children }) {
  const [movements, setMovements] = useLocalStorage('cf_movements', EMPTY_MOVEMENTS);
  const [preferences, setPreferences] = useLocalStorage('cf_preferences', DEFAULT_PREFERENCES);
  const [_criticalNotified, setCriticalNotified] = useLocalStorage(
    'cf_critical_notified',
    EMPTY_CRITICAL_NOTIFIED
  );

  const now = new Date();
  const activeMonth = now.getMonth();
  const activeYear = now.getFullYear();
  const monthKey = `${activeYear}-${activeMonth}`;

  const totalIncome = useMemo(
    () => calculateIncome(movements, activeMonth, activeYear),
    [movements, activeMonth, activeYear]
  );

  const totalExpenses = useMemo(
    () => calculateExpenses(movements, activeMonth, activeYear),
    [movements, activeMonth, activeYear]
  );

  const balance = useMemo(
    () => calculateBalance(totalIncome, totalExpenses),
    [totalIncome, totalExpenses]
  );

  const remainingPercentage = useMemo(
    () => calculateRemainingPercentage(balance, totalIncome),
    [balance, totalIncome]
  );

  const budgetStatus = useMemo(
    () => getBudgetStatus(totalIncome, balance),
    [totalIncome, balance]
  );

  const expensesByCategory = useMemo(
    () => getExpensesByCategory(movements, activeMonth, activeYear),
    [movements, activeMonth, activeYear]
  );

  const monthMovements = useMemo(() => {
    return movements.filter((m) => {
      const d = new Date(m.date + 'T12:00:00');
      return d.getMonth() === activeMonth && d.getFullYear() === activeYear;
    });
  }, [movements, activeMonth, activeYear]);

  // Notificación local en nivel crítico (una vez por mes)
  useEffect(() => {
    if (budgetStatus !== BUDGET_STATUS.CRITICAL) return;

    setCriticalNotified((prev) => {
      if (prev[monthKey]) return prev;

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🔴 Presupuesto crítico', {
          body: 'Te queda menos del 10% de tu presupuesto.',
          icon: '/vite.svg',
        });
        return { ...prev, [monthKey]: true };
      }

      return prev;
    });
  }, [budgetStatus, monthKey, setCriticalNotified]);

  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
  }, []);

  const addMovement = useCallback(
    (movement) => {
      const newMovement = { ...movement, id: generateId() };

      if (movement.type === 'expense') {
        const validation = canAddExpense(
          movements,
          activeMonth,
          activeYear,
          movement.amount
        );
        if (!validation.allowed) {
          return { success: false, ...validation };
        }
      }

      setMovements((prev) => [...prev, newMovement]);
      return { success: true, movement: newMovement };
    },
    [movements, activeMonth, activeYear, setMovements]
  );

  const updateMovement = useCallback(
    (id, updates) => {
      const existing = movements.find((m) => m.id === id);
      if (!existing) return { success: false, reason: 'not_found' };

      if (existing.type === 'expense' || updates.type === 'expense') {
        const amount = updates.amount ?? existing.amount;
        const validation = canAddExpense(
          movements,
          activeMonth,
          activeYear,
          amount,
          id
        );
        if (!validation.allowed) {
          return { success: false, ...validation };
        }
      }

      setMovements((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
      );
      return { success: true };
    },
    [movements, activeMonth, activeYear, setMovements]
  );

  const deleteMovement = useCallback(
    (id) => {
      setMovements((prev) => prev.filter((m) => m.id !== id));
      return { success: true };
    },
    [setMovements]
  );

  const updatePreferences = useCallback(
    (updates) => {
      setPreferences((prev) => ({ ...prev, ...updates }));
    },
    [setPreferences]
  );

  const loadDemoData = useCallback(() => {
    setMovements(DEMO_MOVEMENTS.map((m) => ({ ...m, id: generateId() })));
  }, [setMovements]);

  const clearAllData = useCallback(() => {
    setMovements([]);
    setCriticalNotified({});
  }, [setMovements, setCriticalNotified]);

  const validateExpense = useCallback(
    (amount, excludeId = null) => {
      return canAddExpense(movements, activeMonth, activeYear, amount, excludeId);
    },
    [movements, activeMonth, activeYear]
  );

  const value = useMemo(
    () => ({
      movements,
      monthMovements,
      preferences,
      totalIncome,
      totalExpenses,
      balance,
      remainingPercentage,
      budgetStatus,
      expensesByCategory,
      activeMonth,
      activeYear,
      addMovement,
      updateMovement,
      deleteMovement,
      updatePreferences,
      loadDemoData,
      clearAllData,
      validateExpense,
      requestNotificationPermission,
    }),
    [
      movements,
      monthMovements,
      preferences,
      totalIncome,
      totalExpenses,
      balance,
      remainingPercentage,
      budgetStatus,
      expensesByCategory,
      activeMonth,
      activeYear,
      addMovement,
      updateMovement,
      deleteMovement,
      updatePreferences,
      loadDemoData,
      clearAllData,
      validateExpense,
      requestNotificationPermission,
    ]
  );

  return (
    <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance debe usarse dentro de FinanceProvider');
  }
  return context;
}
