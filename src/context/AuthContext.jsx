import { createContext, useContext, useMemo, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { EMPTY_USERS } from '../utils/constants';
import {
  hashPassword,
  createUserId,
  normalizeEmail,
  isValidEmail,
} from '../utils/authHelpers';
// TODO Compañera: reemplazar este contexto por Supabase Auth (signInWithPassword / signUp)
// y persistir movimientos en Postgres. Ver stub en src/lib/supabase.js.

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [users, setUsers] = useLocalStorage('cf_users', EMPTY_USERS);
  const [session, setSession] = useLocalStorage('cf_session', null);

  const login = useCallback(
    async (email, password) => {
      const normalized = normalizeEmail(email);
      if (!normalized || !password) {
        return { success: false, error: 'Completa correo y contraseña.' };
      }
      if (!isValidEmail(normalized)) {
        return { success: false, error: 'Ingresa un correo válido.' };
      }

      const passwordHash = await hashPassword(password);
      const list = Array.isArray(users) ? users : [];
      const found = list.find(
        (u) => u.email === normalized && u.passwordHash === passwordHash
      );
      if (!found) {
        return { success: false, error: 'Correo o contraseña incorrectos.' };
      }

      setSession({ userId: found.id, email: found.email, name: found.name });
      return { success: true };
    },
    [users, setSession]
  );

  const register = useCallback(
    async ({ name, email, password }) => {
      const trimmedName = name?.trim() || '';
      const normalized = normalizeEmail(email);

      if (!trimmedName || !normalized || !password) {
        return { success: false, error: 'Completa todos los campos.' };
      }
      if (!isValidEmail(normalized)) {
        return { success: false, error: 'Ingresa un correo válido.' };
      }
      const list = Array.isArray(users) ? users : [];
      if (list.some((u) => u.email === normalized)) {
        return { success: false, error: 'Este correo ya está registrado.' };
      }

      const newUser = {
        id: createUserId(),
        name: trimmedName,
        email: normalized,
        passwordHash: await hashPassword(password),
        createdAt: new Date().toISOString(),
      };

      setUsers((prev) => [...(Array.isArray(prev) ? prev : []), newUser]);
      setSession({ userId: newUser.id, email: newUser.email, name: newUser.name });
      return { success: true, user: newUser };
    },
    [users, setUsers, setSession]
  );

  const logout = useCallback(() => {
    setSession(null);
  }, [setSession]);

  const value = useMemo(
    () => ({
      user: session,
      isAuthenticated: Boolean(session?.userId),
      login,
      register,
      logout,
    }),
    [session, login, register, logout]
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
