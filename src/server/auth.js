import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { getCookie } from './cookies.js';
import { sendJson } from './http.js';

const COOKIE_NAME = 'cf_auth';
const TOKEN_MAX_AGE = 60 * 60 * 24 * 7;
const BCRYPT_ROUNDS = 10;

function jwtSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('Falta JWT_SECRET (mínimo 16 caracteres) en el entorno del servidor.');
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

export async function signAuthToken(user) {
  return new SignJWT({ email: user.email, name: user.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.userId)
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_MAX_AGE}s`)
    .sign(jwtSecretKey());
}

export async function verifyAuthToken(token) {
  const { payload } = await jwtVerify(token, jwtSecretKey());
  return {
    userId: String(payload.sub || ''),
    email: String(payload.email || ''),
    name: String(payload.name || ''),
  };
}

function cookieSecure() {
  return process.env.VERCEL === '1';
}

function serializeAuthCookie(value, maxAge) {
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(value)}`,
    'HttpOnly',
    'Path=/',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ];
  if (cookieSecure()) parts.push('Secure');
  return parts.join('; ');
}

export function setAuthCookie(res, token) {
  res.setHeader('Set-Cookie', serializeAuthCookie(token, TOKEN_MAX_AGE));
}

export function clearAuthCookie(res) {
  res.setHeader('Set-Cookie', serializeAuthCookie('', 0));
}

export function readAuthToken(req) {
  if (req.cookies?.[COOKIE_NAME]) return String(req.cookies[COOKIE_NAME]);
  return getCookie(req, COOKIE_NAME);
}

export function toPublicUser(user) {
  return { userId: user.userId, email: user.email, name: user.name };
}

/** Extrae el usuario del JWT o responde 401. */
export async function requireUser(req, res) {
  const token = readAuthToken(req);
  if (!token) {
    sendJson(res, 401, { error: 'No hay sesión. Inicia sesión de nuevo.' });
    return null;
  }
  try {
    const user = await verifyAuthToken(token);
    if (!user.userId) {
      sendJson(res, 401, { error: 'Sesión inválida. Inicia sesión de nuevo.' });
      return null;
    }
    return user;
  } catch {
    sendJson(res, 401, { error: 'Sesión expirada. Inicia sesión de nuevo.' });
    return null;
  }
}
