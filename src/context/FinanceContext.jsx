import { createContext, useContext, useMemo, useEffect, useCallback, useRef, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useAuth } from './AuthContext';
import {
  calculateIncome,
  calculateExpenses,
  calculateBalance,
  calculateRemainingPercentage,
  getBudgetStatus,
  getExpensesByCategory,
  canAddExpense,
  canApplyMovementChange,
  filterMovementsByMonth,
  sortMovementsByDate,
  generateId,
  BUDGET_STATUS,
} from '../utils/financeRules';
import { getMonthYearFromDate, getTodayISO } from '../utils/formatCurrency';
import {
  DEFAULT_PREFERENCES,
  DEMO_MOVEMENTS,
  EMPTY_MOVEMENTS,
  EMPTY_CRITICAL_NOTIFIED,
} from '../utils/constants';

const FinanceContext = createContext(null);

function readNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

export function FinanceProvider({ children }) {
  const { user } = useAuth();
  const storageSuffix = user?.userId ?? 'guest';
  const preferencesDefault = useMemo(
    () => ({
      ...DEFAULT_PREFERENCES,
      name: user?.name || DEFAULT_PREFERENCES.name,
    }),
    [user?.name]
  );

  // TODO Compañera: persistir movimientos y preferencias en tablas Supabase
  // (movements / preferences) con RLS por user_id, en lugar de localStorage.
  const [movements, setMovements] = useLocalStorage(
    `cf_movements_${storageSuffix}`,
    EMPTY_MOVEMENTS
  );
  const [preferences, setPreferences] = useLocalStorage(
    `cf_preferences_${storageSuffix}`,
    preferencesDefault
  );
  const [_criticalNotified, setCriticalNotified] = useLocalStorage(
    `cf_critical_notified_${storageSuffix}`,
    EMPTY_CRITICAL_NOTIFIED
  );

  const [notificationPermission, setNotificationPermission] = useState(readNotificationPermission);
  const osNotifySentRef = useRef({});

  useEffect(() => {
    if (!user?.name) return;
    if (preferences.name === DEFAULT_PREFERENCES.name && user.name !== DEFAULT_PREFERENCES.name) {
      setPreferences((prev) => ({ ...prev, name: user.name }));
    }
  }, [user?.name, preferences.name, setPreferences]);

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

  const monthMovements = useMemo(
    () => sortMovementsByDate(filterMovementsByMonth(movements, activeMonth, activeYear)),
    [movements, activeMonth, activeYear]
  );

  const sendCriticalOsNotification = useCallback(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return false;
    try {
      new Notification('Presupuesto crítico', {
        body: 'Te queda menos del 10% de tu presupuesto mensual.',
        icon: '/vite.svg',
      });
      return true;
    } catch {
      return false;
    }
  }, []);

  // Intento de Notification API solo si ya hay permiso (sin pedir al montar).
  useEffect(() => {
    if (budgetStatus !== BUDGET_STATUS.CRITICAL) return;
    if (readNotificationPermission() !== 'granted') return;
    if (osNotifySentRef.current[monthKey]) return;

    setCriticalNotified((prev) => {
      if (prev[monthKey]) {
        osNotifySentRef.current[monthKey] = true;
        return prev;
      }
      sendCriticalOsNotification();
      osNotifySentRef.current[monthKey] = true;
      return { ...prev, [monthKey]: true };
    });
  }, [budgetStatus, monthKey, setCriticalNotified, sendCriticalOsNotification]);

  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      setNotificationPermission('unsupported');
      return { granted: false, supported: false };
    }
    if (Notification.permission === 'granted') {
      setNotificationPermission('granted');
      return { granted: true, supported: true };
    }
    if (Notification.permission === 'denied') {
      setNotificationPermission('denied');
      return { granted: false, supported: true, denied: true };
    }

    const result = await Notification.requestPermission();
    setNotificationPermission(result);

    if (result === 'granted' && budgetStatus === BUDGET_STATUS.CRITICAL) {
      setCriticalNotified((prev) => {
        if (prev[monthKey]) return prev;
        sendCriticalOsNotification();
        osNotifySentRef.current[monthKey] = true;
        return { ...prev, [monthKey]: true };
      });
    }

    return { granted: result === 'granted', supported: true, denied: result === 'denied' };
  }, [budgetStatus, monthKey, sendCriticalOsNotification, setCriticalNotified]);

  const addMovement = useCallback(
    (movement) => {
      const newMovement = { ...movement, id: generateId() };

      if (movement.type === 'expense') {
        const { month, year } = getMonthYearFromDate(movement.date);
        const validation = canAddExpense(movements, month, year, movement.amount);
        if (!validation.allowed) {
          return { success: false, ...validation };
        }
      }

      setMovements((prev) => [...prev, newMovement]);
      return { success: true, movement: newMovement };
    },
    [movements, setMovements]
  );

  const updateMovement = useCallback(
    (id, updates) => {
      const existing = movements.find((m) => m.id === id);
      if (!existing) return { success: false, reason: 'not_found' };

      if (existing.type === 'expense' || updates.type === 'expense') {
        const amount = updates.amount ?? existing.amount;
        const date = updates.date ?? existing.date;
        const { month, year } = getMonthYearFromDate(date);
        const validation = canAddExpense(movements, month, year, amount, id);
        if (!validation.allowed) {
          return { success: false, ...validation };
        }
      }

      if (existing.type === 'income') {
        const next = movements.map((m) => (m.id === id ? { ...m, ...updates } : m));
        const balanceCheck = canApplyMovementChange(next, [existing.date, updates.date ?? existing.date]);
        if (!balanceCheck.allowed) {
          return { success: false, ...balanceCheck };
        }
      }

      setMovements((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
      );
      return { success: true };
    },
    [movements, setMovements]
  );

  const deleteMovement = useCallback(
    (id) => {
      const existing = movements.find((m) => m.id === id);
      if (!existing) return { success: false, reason: 'not_found' };

      if (existing.type === 'income') {
        const next = movements.filter((m) => m.id !== id);
        const balanceCheck = canApplyMovementChange(next, [existing.date]);
        if (!balanceCheck.allowed) {
          return { success: false, ...balanceCheck };
        }
      }

      setMovements((prev) => prev.filter((m) => m.id !== id));
      return { success: true };
    },
    [movements, setMovements]
  );

  const updatePreferences = useCallback(
    (updates) => {
      setPreferences((prev) => ({ ...prev, ...updates }));
    },
    [setPreferences]
  );

  const loadDemoData = useCallback(() => {
    const today = getTodayISO();
    setMovements(DEMO_MOVEMENTS.map((m) => ({ ...m, id: generateId(), date: today })));
  }, [setMovements]);

  const clearAllData = useCallback(() => {
    setMovements([]);
    setCriticalNotified({});
    osNotifySentRef.current = {};
  }, [setMovements, setCriticalNotified]);

  const validateExpense = useCallback(
    (amount, excludeId = null, dateStr) => {
      const { month, year } = dateStr
        ? getMonthYearFromDate(dateStr)
        : { month: activeMonth, year: activeYear };
      return canAddExpense(movements, month, year, amount, excludeId);
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
      monthKey,
      notificationPermission,
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
      monthKey,
      notificationPermission,
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
