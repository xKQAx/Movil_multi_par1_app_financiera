import { parseJsonBody, publicErrorPayload, sendJson } from './http.js';

const METHODS_WITHOUT_BODY = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Adapter Vercel Node: normaliza req.body (string | objeto | stream)
 * antes de la ruta compartida. DRY para todos los archivos de /api.
 */
export function asVercelHandler(handler) {
  return async function vercelHandler(req, res) {
    try {
      if (!METHODS_WITHOUT_BODY.has(req.method || '')) {
        req.body = await parseJsonBody(req);
      }
      await handler(req, res);
    } catch (error) {
      const payload = publicErrorPayload(error);
      console.error(error?.message || error);
      if (!res.headersSent) {
        sendJson(res, payload.status, { error: payload.error });
      }
    }
  };
}
