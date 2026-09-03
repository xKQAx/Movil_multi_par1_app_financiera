import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useLayoutEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { ToastProvider } from './hooks/useToast';
import { ACCENT_COLORS, ROUTES } from './utils/constants';
import BottomNavigation from './components/BottomNavigation';
import AppSidebar from './components/AppSidebar';
import ProtectedRoute from './components/ProtectedRoute';
import GuestRoute from './components/GuestRoute';
import CriticalBanner from './components/CriticalBanner';
import ErrorBoundary from './components/ErrorBoundary';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Movements from './pages/Movements';
import AddMovement from './pages/AddMovement';
import Settings from './pages/Settings';

/** Aplica tema/acento antes del pintado (evita flash oscuro en landing al cerrar sesión). */
function applyAppearance(isAuthenticated, preferences) {
  const root = document.documentElement;
  const publicView = !isAuthenticated;
  const theme = publicView ? 'light' : preferences.theme;
  const accent = publicView
    ? ACCENT_COLORS.blue
    : ACCENT_COLORS[preferences.accentColor] || ACCENT_COLORS.blue;

  root.setAttribute('data-theme', theme);
  root.style.setProperty('--primary-color', accent.primary);
  root.style.setProperty('--primary-dark', accent.primaryDark);
  root.style.setProperty('--primary-light', accent.primaryLight);
}

function BootScreen({ message, onRetry }) {
  return (
    <div className="page" role="status">
      <p className="text-muted">{message}</p>
      {onRetry && (
        <button type="button" className="btn btn--primary" onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  );
}

function ThemedShell() {
  const { preferences, isLoading, loadError, reload } = useFinance();
  const { isAuthenticated, ready } = useAuth();
  const { theme, accentColor } = preferences;

  useLayoutEffect(() => {
    applyAppearance(isAuthenticated, { theme, accentColor });
  }, [isAuthenticated, theme, accentColor]);

  if (!ready) {
    return <BootScreen message="Comprobando sesión…" />;
  }
  if (isAuthenticated && isLoading) {
    return <BootScreen message="Cargando tus datos…" />;
  }
  if (isAuthenticated && loadError) {
    return <BootScreen message={loadError} onRetry={reload} />;
  }

  return (
    <div className={`app-shell${isAuthenticated ? ' app-shell--auth' : ' app-shell--public'}`}>
      {isAuthenticated && <AppSidebar />}
      <div className="app-body">
        <main className="app-main">
          {isAuthenticated && <CriticalBanner />}
          <ErrorBoundary>
            <Routes>
              <Route
                path={ROUTES.landing}
                element={
                  <GuestRoute>
                    <Landing />
                  </GuestRoute>
                }
              />
              <Route
                path={ROUTES.login}
                element={
                  <GuestRoute>
                    <Login />
                  </GuestRoute>
                }
              />
              <Route
                path={ROUTES.register}
                element={
                  <GuestRoute>
                    <Register />
                  </GuestRoute>
                }
              />
              <Route
                path={ROUTES.dashboard}
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.movements}
                element={
                  <ProtectedRoute>
                    <Movements />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/agregar/:type"
                element={
                  <ProtectedRoute>
                    <AddMovement />
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.settings}
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to={ROUTES.landing} replace />} />
            </Routes>
          </ErrorBoundary>
        </main>
        {isAuthenticated && <BottomNavigation />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FinanceProvider>
          <ToastProvider>
            <ThemedShell />
          </ToastProvider>
        </FinanceProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
