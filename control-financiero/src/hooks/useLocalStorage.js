import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook reutilizable para persistir estado en localStorage.
 * initialValue se captura una sola vez (useRef) para evitar bucles
 * cuando se pasa un objeto/array inline en cada render.
 */
export function useLocalStorage(key, initialValue) {
  const initialValueRef = useRef(initialValue);

  const readValue = useCallback(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        return JSON.parse(item);
      }
      return initialValueRef.current;
    } catch {
      return initialValueRef.current;
    }
  }, [key]);

  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        return JSON.parse(item);
      }
      return initialValueRef.current;
    } catch {
      return initialValueRef.current;
    }
  });

  // Re-sincronizar solo cuando cambia la clave de almacenamiento
  useEffect(() => {
    setStoredValue(readValue());
  }, [key, readValue]);

  // Sincronizar cambios desde otras pestañas
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key !== key || event.newValue === null) return;
      try {
        setStoredValue(JSON.parse(event.newValue));
      } catch {
        setStoredValue(initialValueRef.current);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  const setValue = useCallback(
    (value) => {
      try {
        setStoredValue((prev) => {
          const valueToStore = value instanceof Function ? value(prev) : value;
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
          return valueToStore;
        });
      } catch (error) {
        console.error(`Error guardando en localStorage [${key}]:`, error);
      }
    },
    [key]
  );

  return [storedValue, setValue];
}
