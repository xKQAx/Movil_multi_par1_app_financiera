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

function parseRawJson(raw) {
  const text = String(raw || '').trim();
  if (!text) return {};
  return JSON.parse(text);
}

function isEmptyPlainObject(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Buffer.isBuffer(value) &&
    !Array.isArray(value) &&
    Object.keys(value).length === 0
  );
}

/**
 * Vercel Node puede dejar req.body como objeto, string, Buffer o sin tocar (stream).
 * Un {} vacío no se trata como body final si el stream sigue legible.
 */
export async function parseJsonBody(req) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'string') return parseRawJson(req.body);
    if (Buffer.isBuffer(req.body)) return parseRawJson(req.body.toString('utf8'));
    if (typeof req.body === 'object' && !isEmptyPlainObject(req.body)) return req.body;
    if (typeof req.body === 'object' && (req.readableEnded || req.complete)) return req.body;
  }

  if (req.readableEnded || req.complete) return {};

  const raw = await readRawBody(req);
  return parseRawJson(raw);
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

/** Mensaje JSON seguro: nunca stack ni URLs. */
export function publicErrorPayload(error) {
  if (error instanceof SyntaxError) {
    return { status: 400, error: 'JSON inválido.' };
  }
  if (error?.expose && Number.isInteger(error.status) && error.message) {
    return { status: error.status, error: String(error.message) };
  }
  const msg = String(error?.message || '');
  if (msg.includes('JWT_SECRET')) {
    return { status: 503, error: 'Falta JWT_SECRET en el servidor' };
  }
  if (msg.includes('DATABASE_URL')) {
    return { status: 503, error: 'Falta DATABASE_URL en el servidor' };
  }
  return { status: 500, error: 'Error interno del servidor. Inténtalo de nuevo.' };
}

export async function withErrorBoundary(res, fn) {
  try {
    await fn();
  } catch (error) {
    const payload = publicErrorPayload(error);
    console.error(error?.message || error);
    sendJson(res, payload.status, { error: payload.error });
  }
}
