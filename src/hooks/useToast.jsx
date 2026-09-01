import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Toast from '../components/Toast';

const ToastContext = createContext(null);

/**
 * Toast único a nivel de app: sobrevive a cambios de ruta
 * (p. ej. guardar un movimiento y volver al dashboard).
 */
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timeoutRef = useRef(null);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const showToast = useCallback((message, type = 'success') => {
    if (!message) return;
    clearTimeout(timeoutRef.current);
    setToast({ message, type });
    const duration = type === 'error' ? 4500 : 3200;
    timeoutRef.current = setTimeout(() => setToast(null), duration);
  }, []);

  const clearToast = useCallback(() => {
    clearTimeout(timeoutRef.current);
    setToast(null);
  }, []);

  const value = useMemo(
    () => ({ toast, showToast, clearToast }),
    [toast, showToast, clearToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toast toast={toast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe usarse dentro de ToastProvider');
  }
  return context;
}
