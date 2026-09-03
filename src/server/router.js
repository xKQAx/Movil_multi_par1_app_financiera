import { handleLogin, handleLogout, handleMe, handleRegister } from './routes/authRoutes.js';
import { handleHealth } from './routes/healthRoutes.js';
import {
  handleDemoMovements,
  handleMovementById,
  handleMovementsCollection,
} from './routes/movementRoutes.js';
import { handlePreferences } from './routes/preferenceRoutes.js';
import { sendJson } from './http.js';

const ROUTES = [
  { method: 'GET', path: '/api/health', handler: handleHealth },
  { method: 'POST', path: '/api/auth/register', handler: handleRegister },
  { method: 'POST', path: '/api/auth/login', handler: handleLogin },
  { method: 'POST', path: '/api/auth/logout', handler: handleLogout },
  { method: 'GET', path: '/api/auth/me', handler: handleMe },
  { method: 'GET', path: '/api/movements', handler: handleMovementsCollection },
  { method: 'POST', path: '/api/movements', handler: handleMovementsCollection },
  { method: 'DELETE', path: '/api/movements', handler: handleMovementsCollection },
  { method: 'POST', path: '/api/movements/demo', handler: handleDemoMovements },
  { method: 'PUT', pattern: /^\/api\/movements\/([^/]+)$/, handler: handleMovementById },
  { method: 'DELETE', pattern: /^\/api\/movements\/([^/]+)$/, handler: handleMovementById },
  { method: 'GET', path: '/api/preferences', handler: handlePreferences },
  { method: 'PUT', path: '/api/preferences', handler: handlePreferences },
];

function pathnameOf(req) {
  try {
    return new URL(req.url || '/', 'http://localhost').pathname;
  } catch {
    return String(req.url || '/').split('?')[0];
  }
}

/** Despacha la misma lógica que los archivos de `/api` (DRY para `scripts/dev-api.mjs`). */
export async function handleApiRequest(req, res) {
  const path = pathnameOf(req);
  for (const route of ROUTES) {
    if (route.method !== req.method) continue;
    if (route.path && route.path === path) {
      await route.handler(req, res);
      return;
    }
    if (route.pattern) {
      const match = path.match(route.pattern);
      if (match) {
        req.query = { ...(req.query || {}), id: decodeURIComponent(match[1]) };
        await route.handler(req, res);
        return;
      }
    }
  }
  sendJson(res, 404, { error: 'Ruta no encontrada.' });
}
