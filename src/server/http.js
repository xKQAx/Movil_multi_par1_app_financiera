const JSON_TYPE = 'application/json; charset=utf-8';

export function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    res.status(status).json(body);
    return;
  }
  res.statusCode = status;
  res.setHeader('Content-Type', JSON_TYPE);
  res.end(payload);
}

export function allowMethods(req, res, methods) {
  if (methods.includes(req.method)) return true;
  res.setHeader?.('Allow', methods.join(', '));
  sendJson(res, 405, { error: 'Método no permitido.' });
  return false;
}

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

export async function parseJsonBody(req) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'object') return req.body;
    if (typeof req.body === 'string') {
      return req.body ? JSON.parse(req.body) : {};
    }
  }
  const raw = await readRawBody(req);
  if (!raw) return {};
  return JSON.parse(raw);
}

export function requestPath(req) {
  const host = req.headers?.host || 'localhost';
  try {
    return new URL(req.url || '/', `http://${host}`).pathname;
  } catch {
    return String(req.url || '/').split('?')[0];
  }
}

export function movementIdFromReq(req) {
  if (req.query?.id) return String(req.query.id);
  const parts = requestPath(req).split('/').filter(Boolean);
  return decodeURIComponent(parts[parts.length - 1] || '');
}

export async function withErrorBoundary(res, fn) {
  try {
    await fn();
  } catch (error) {
    if (error instanceof SyntaxError) {
      sendJson(res, 400, { error: 'JSON inválido.' });
      return;
    }
    console.error(error?.message || error);
    sendJson(res, 500, { error: 'Error interno del servidor. Inténtalo de nuevo.' });
  }
}
