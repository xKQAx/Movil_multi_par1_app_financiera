import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook reutilizable para persistir estado en localStorage.
 * Si cambia `key` (p. ej. otro usuario), relee en el mismo render para no
 * mostrar datos del usuario anterior.
 */
export function useLocalStorage(key, initialValue) {
  const initialValueRef = useRef(initialValue);
  initialValueRef.current = initialValue;

  const readForKey = (storageKey) => {
    try {
      const item = window.localStorage.getItem(storageKey);
      if (item !== null) {
        return JSON.parse(item);
      }
      return initialValueRef.current;
    } catch {
      return initialValueRef.current;
    }
  };

  const [state, setState] = useState(() => ({
    key,
    value: readForKey(key),
  }));

  if (state.key !== key) {
    setState({ key, value: readForKey(key) });
  }

  const storedValue = state.key === key ? state.value : readForKey(key);

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key !== key || event.newValue === null) return;
      try {
        setState({ key, value: JSON.parse(event.newValue) });
      } catch {
        setState({ key, value: initialValueRef.current });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  const setValue = useCallback(
    (value) => {
      try {
        setState((prev) => {
          const current = prev.key === key ? prev.value : readForKey(key);
          const valueToStore = value instanceof Function ? value(current) : value;
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
          return { key, value: valueToStore };
        });
      } catch (error) {
        console.error(`Error guardando en localStorage [${key}]:`, error);
      }
    },
    [key]
  );

  return [storedValue, setValue];
}
