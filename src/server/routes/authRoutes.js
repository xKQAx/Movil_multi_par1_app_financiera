import { createUserId, isValidEmail, normalizeEmail } from '../../utils/authHelpers.js';
import {
  clearAuthCookie,
  hashPassword,
  requireUser,
  setAuthCookie,
  signAuthToken,
  toPublicUser,
  verifyPassword,
} from '../auth.js';
import { getSql } from '../db.js';
import { allowMethods, parseJsonBody, sendJson, withErrorBoundary } from '../http.js';
import { isUniqueViolation } from '../mappers.js';

const MIN_PASSWORD = 6;

export async function handleRegister(req, res) {
  if (!allowMethods(req, res, ['POST'])) return;
  await withErrorBoundary(res, async () => {
    const body = await parseJsonBody(req);
    const name = String(body?.name || '').trim();
    const email = normalizeEmail(body?.email || '');
    const password = String(body?.password || '');

    if (!name || !email || !password) {
      sendJson(res, 400, { error: 'Completa todos los campos.' });
      return;
    }
    if (!isValidEmail(email)) {
      sendJson(res, 400, { error: 'Ingresa un correo válido.' });
      return;
    }
    if (password.length < MIN_PASSWORD) {
      sendJson(res, 400, { error: 'La contraseña debe tener al menos 6 caracteres.' });
      return;
    }

    const sql = getSql();
    const userId = createUserId();
    const passwordHash = await hashPassword(password);

    try {
      await sql.transaction([
        sql`
          INSERT INTO users (id, name, email, password_hash)
          VALUES (${userId}, ${name}, ${email}, ${passwordHash})
        `,
        sql`
          INSERT INTO preferences (user_id, display_name)
          VALUES (${userId}, ${name})
        `,
      ]);
    } catch (error) {
      if (isUniqueViolation(error)) {
        sendJson(res, 409, { error: 'Ya existe una cuenta; inicia sesión.' });
        return;
      }
      throw error;
    }

    const user = { userId, email, name };
    setAuthCookie(res, await signAuthToken(user), req);
    sendJson(res, 201, { user: toPublicUser(user) });
  });
}

export async function handleLogin(req, res) {
  if (!allowMethods(req, res, ['POST'])) return;
  await withErrorBoundary(res, async () => {
    const body = await parseJsonBody(req);
    const email = normalizeEmail(body?.email || '');
    const password = String(body?.password || '');

    if (!email || !password) {
      sendJson(res, 400, { error: 'Completa correo y contraseña.' });
      return;
    }
    if (!isValidEmail(email)) {
      sendJson(res, 400, { error: 'Ingresa un correo válido.' });
      return;
    }

    const sql = getSql();
    const rows = await sql`
      SELECT id, name, email, password_hash
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `;
    const row = rows[0];
    const passwordOk = row ? await verifyPassword(password, row.password_hash) : false;
    if (!row || !passwordOk) {
      sendJson(res, 401, { error: 'Correo o contraseña incorrectos.' });
      return;
    }

    const user = { userId: row.id, email: row.email, name: row.name };
    setAuthCookie(res, await signAuthToken(user), req);
    sendJson(res, 200, { user: toPublicUser(user) });
  });
}

export async function handleLogout(req, res) {
  if (!allowMethods(req, res, ['POST'])) return;
  clearAuthCookie(res, req);
  sendJson(res, 200, { ok: true });
}

export async function handleMe(req, res) {
  if (!allowMethods(req, res, ['GET'])) return;
  await withErrorBoundary(res, async () => {
    const user = await requireUser(req, res);
    if (!user) return;

    const sql = getSql();
    const rows = await sql`
      SELECT id, name, email
      FROM users
      WHERE id = ${user.userId}
      LIMIT 1
    `;
    if (!rows[0]) {
      clearAuthCookie(res, req);
      sendJson(res, 401, { error: 'La cuenta ya no existe.' });
      return;
    }

    sendJson(res, 200, {
      user: toPublicUser({
        userId: rows[0].id,
        email: rows[0].email,
        name: rows[0].name,
      }),
    });
  });
}
