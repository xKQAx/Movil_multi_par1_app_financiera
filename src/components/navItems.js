import { Home, List, Settings } from 'lucide-react';
import { ROUTES } from '../utils/constants';

/** Fuente única de ítems de navegación (bottom nav móvil + sidebar desktop). */
export const NAV_ITEMS = [
  { to: ROUTES.dashboard, icon: Home, label: 'Inicio' },
  { to: ROUTES.movements, icon: List, label: 'Movimientos' },
  { to: ROUTES.settings, icon: Settings, label: 'Ajustes' },
];
