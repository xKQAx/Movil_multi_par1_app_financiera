import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { ACCENT_COLORS } from './utils/constants';
import BottomNavigation from './components/BottomNavigation';
import Dashboard from './pages/Dashboard';
import Movements from './pages/Movements';
import AddMovement from './pages/AddMovement';
import Settings from './pages/Settings';
import { useEffect } from 'react';

function AppContent() {
  const { preferences, requestNotificationPermission } = useFinance();

  useEffect(() => {
    const root = document.documentElement;
    const accent = ACCENT_COLORS[preferences.accentColor] || ACCENT_COLORS.blue;

    root.setAttribute('data-theme', preferences.theme);
    root.style.setProperty('--primary-color', accent.primary);
    root.style.setProperty('--primary-dark', accent.primaryDark);
    root.style.setProperty('--primary-light', accent.primaryLight);
  }, [preferences.theme, preferences.accentColor]);

  useEffect(() => {
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  return (
    <div className="app-shell">
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/movimientos" element={<Movements />} />
          <Route path="/agregar/:type" element={<AddMovement />} />
          <Route path="/ajustes" element={<Settings />} />
        </Routes>
      </main>
      <BottomNavigation />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <FinanceProvider>
        <AppContent />
      </FinanceProvider>
    </BrowserRouter>
  );
}
