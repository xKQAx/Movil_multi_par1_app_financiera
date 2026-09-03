import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { getCookie } from './cookies.js';
import { sendJson } from './http.js';

const COOKIE_NAME = 'cf_auth';
const TOKEN_MAX_AGE = 60 * 60 * 24 * 7;
const BCRYPT_ROUNDS = 10;
const DEV_JWT_FALLBACK = 'dev-only-local-jwt-secret-change-me';
const JWT_MIN_LENGTH = 16;

export class JwtConfigError extends Error {
  constructor(message = 'Falta JWT_SECRET en el servidor') {
    super(message);
    this.name = 'JwtConfigError';
    this.status = 503;
    this.expose = true;
  }
}

export function isJwtConfigured() {
  const secret = process.env.JWT_SECRET;
  return typeof secret === 'string' && secret.length >= JWT_MIN_LENGTH;
}

function allowDevJwtFallback() {
  return process.env.NODE_ENV !== 'production' && process.env.VERCEL !== '1';
}

function resolveJwtSecret() {
  if (isJwtConfigured()) return process.env.JWT_SECRET;
  if (allowDevJwtFallback()) return DEV_JWT_FALLBACK;
  throw new JwtConfigError('Falta JWT_SECRET en el servidor');
}

function jwtSecretKey() {
  return new TextEncoder().encode(resolveJwtSecret());
}

export function assertJwtReady() {
  resolveJwtSecret();
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

function cookieSecure(req) {
  if (process.env.VERCEL === '1') return true;
  const proto = req?.headers?.['x-forwarded-proto'];
  if (typeof proto === 'string') {
    return proto.split(',')[0].trim() === 'https';
  }
  return false;
}

/** Cookie de sesión: HttpOnly; Path=/; SameSite=Lax; Secure en HTTPS. Sin Domain. */
export function serializeAuthCookie(value, maxAge, secure) {
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(value)}`,
    'HttpOnly',
    'Path=/',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

export function setAuthCookie(res, token, req) {
  res.setHeader('Set-Cookie', serializeAuthCookie(token, TOKEN_MAX_AGE, cookieSecure(req)));
}

export function clearAuthCookie(res, req) {
  res.setHeader('Set-Cookie', serializeAuthCookie('', 0, cookieSecure(req)));
}

export function readAuthToken(req) {
  if (req.cookies?.[COOKIE_NAME]) return String(req.cookies[COOKIE_NAME]);
  return getCookie(req, COOKIE_NAME);
}

export function toPublicUser(user) {
  return { userId: user.userId, email: user.email, name: user.name };
}

/** Extrae el usuario del JWT o responde 401. Sin cookie = 401 (esperado). */
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
  } catch (error) {
    if (error instanceof JwtConfigError || error?.expose) {
      sendJson(res, error.status || 503, { error: error.message || 'Falta JWT_SECRET en el servidor' });
      return null;
    }
    sendJson(res, 401, { error: 'Sesión expirada. Inicia sesión de nuevo.' });
    return null;
  }
}
