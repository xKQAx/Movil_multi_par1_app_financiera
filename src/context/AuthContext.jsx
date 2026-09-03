import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { apiFetch, toResultError } from '../lib/apiClient';
import { normalizeEmail, isValidEmail } from '../utils/authHelpers';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetch('/api/auth/me');
        if (!cancelled) setUser(data.user);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const normalized = normalizeEmail(email);
    if (!normalized || !password) {
      return { success: false, error: 'Completa correo y contraseña.' };
    }
    if (!isValidEmail(normalized)) {
      return { success: false, error: 'Ingresa un correo válido.' };
    }
    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: normalized, password }),
      });
      setUser(data.user);
      return { success: true };
    } catch (error) {
      return toResultError(error);
    }
  }, []);

  const register = useCallback(async ({ name, email, password }) => {
    const trimmedName = name?.trim() || '';
    const normalized = normalizeEmail(email);
    if (!trimmedName || !normalized || !password) {
      return { success: false, error: 'Completa todos los campos.' };
    }
    if (!isValidEmail(normalized)) {
      return { success: false, error: 'Ingresa un correo válido.' };
    }
    try {
      const data = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name: trimmedName, email: normalized, password }),
      });
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (error) {
      return toResultError(error);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // La cookie puede haber caducado; igual cerramos en cliente.
    }
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      ready,
      isAuthenticated: Boolean(user?.userId),
      login,
      register,
      logout,
    }),
    [user, ready, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
