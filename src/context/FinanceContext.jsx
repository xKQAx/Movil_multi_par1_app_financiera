import { createContext, useContext, useMemo, useEffect, useCallback, useRef, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useAuth } from './AuthContext';
import { apiFetch, toResultError } from '../lib/apiClient';
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
  BUDGET_STATUS,
} from '../utils/financeRules';
import { getMonthYearFromDate } from '../utils/formatCurrency';
import {
  DEFAULT_PREFERENCES,
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

  const [movements, setMovements] = useState(EMPTY_MOVEMENTS);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [hydratedUserId, setHydratedUserId] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const [_criticalNotified, setCriticalNotified] = useLocalStorage(
    `cf_critical_notified_${storageSuffix}`,
    EMPTY_CRITICAL_NOTIFIED
  );

  const [notificationPermission, setNotificationPermission] = useState(readNotificationPermission);
  const osNotifySentRef = useRef({});
  const persistPrefTimer = useRef(null);

  useEffect(() => () => clearTimeout(persistPrefTimer.current), []);

  const reload = useCallback(() => {
    setHydratedUserId(null);
    setLoadError('');
    setReloadKey((key) => key + 1);
  }, []);

  useEffect(() => {
    if (!user?.userId) {
      setMovements(EMPTY_MOVEMENTS);
      setPreferences(DEFAULT_PREFERENCES);
      setHydratedUserId(null);
      setLoadError('');
      return undefined;
    }

    let cancelled = false;
    setLoadError('');

    (async () => {
      try {
        const [movData, prefData] = await Promise.all([
          apiFetch('/api/movements'),
          apiFetch('/api/preferences'),
        ]);
        if (cancelled) return;
        setMovements(Array.isArray(movData.movements) ? movData.movements : EMPTY_MOVEMENTS);
        setPreferences(prefData.preferences || DEFAULT_PREFERENCES);
        setHydratedUserId(user.userId);
        setLoadError('');
      } catch (error) {
        if (!cancelled) {
          setLoadError(error.message || 'No se pudieron cargar tus datos.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.userId, reloadKey]);

  const isLoading = Boolean(user?.userId) && hydratedUserId !== user.userId && !loadError;

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
    async (movement) => {
      if (movement.type === 'expense') {
        const { month, year } = getMonthYearFromDate(movement.date);
        const validation = canAddExpense(movements, month, year, movement.amount);
        if (!validation.allowed) {
          return { success: false, ...validation };
        }
      }

      try {
        const data = await apiFetch('/api/movements', {
          method: 'POST',
          body: JSON.stringify(movement),
        });
        setMovements((prev) => [...prev, data.movement]);
        return { success: true, movement: data.movement };
      } catch (error) {
        return toResultError(error);
      }
    },
    [movements]
  );

  const updateMovement = useCallback(
    async (id, updates) => {
      const existing = movements.find((item) => item.id === id);
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
        const next = movements.map((item) => (item.id === id ? { ...item, ...updates } : item));
        const balanceCheck = canApplyMovementChange(next, [existing.date, updates.date ?? existing.date]);
        if (!balanceCheck.allowed) {
          return { success: false, ...balanceCheck };
        }
      }

      try {
        const data = await apiFetch(`/api/movements/${encodeURIComponent(id)}`, {
          method: 'PUT',
          body: JSON.stringify({ ...existing, ...updates }),
        });
        setMovements((prev) => prev.map((item) => (item.id === id ? data.movement : item)));
        return { success: true };
      } catch (error) {
        return toResultError(error);
      }
    },
    [movements]
  );

  const deleteMovement = useCallback(
    async (id) => {
      const existing = movements.find((item) => item.id === id);
      if (!existing) return { success: false, reason: 'not_found' };

      if (existing.type === 'income') {
        const next = movements.filter((item) => item.id !== id);
        const balanceCheck = canApplyMovementChange(next, [existing.date]);
        if (!balanceCheck.allowed) {
          return { success: false, ...balanceCheck };
        }
      }

      try {
        await apiFetch(`/api/movements/${encodeURIComponent(id)}`, { method: 'DELETE' });
        setMovements((prev) => prev.filter((item) => item.id !== id));
        return { success: true };
      } catch (error) {
        return toResultError(error);
      }
    },
    [movements]
  );

  const updatePreferences = useCallback((updates) => {
    setPreferences((prev) => {
      const next = { ...prev, ...updates };
      clearTimeout(persistPrefTimer.current);
      persistPrefTimer.current = setTimeout(() => {
        apiFetch('/api/preferences', {
          method: 'PUT',
          body: JSON.stringify(next),
        }).catch(() => {});
      }, 400);
      return next;
    });
  }, []);

  const loadDemoData = useCallback(async () => {
    try {
      const data = await apiFetch('/api/movements/demo', { method: 'POST' });
      setMovements(Array.isArray(data.movements) ? data.movements : EMPTY_MOVEMENTS);
      return { success: true };
    } catch (error) {
      return toResultError(error);
    }
  }, []);

  const clearAllData = useCallback(async () => {
    try {
      await apiFetch('/api/movements', { method: 'DELETE' });
      setMovements(EMPTY_MOVEMENTS);
      setCriticalNotified({});
      osNotifySentRef.current = {};
      return { success: true };
    } catch (error) {
      return toResultError(error);
    }
  }, [setCriticalNotified]);

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
      isLoading,
      loadError,
      reload,
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
      isLoading,
      loadError,
      reload,
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
