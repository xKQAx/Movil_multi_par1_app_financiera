import { isJwtConfigured } from '../auth.js';
import { pingDatabase } from '../db.js';
import { allowMethods, sendJson, withErrorBoundary } from '../http.js';

/** Diagnóstico de entorno. No incluye URLs, secretos ni filas. */
export async function handleHealth(req, res) {
  if (!allowMethods(req, res, ['GET'])) return;
  await withErrorBoundary(res, async () => {
    const db = await pingDatabase();
    sendJson(res, 200, {
      db,
      jwtConfigured: isJwtConfigured(),
    });
  });
}
