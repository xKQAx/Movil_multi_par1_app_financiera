/**
 * Parseo de body (Vercel), errores públicos y cookie/JWT sin secretos.
 * Ejecutar: node src/server/http.test.js
 */
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { parseJsonBody, publicErrorPayload, withErrorBoundary } from './http.js';
import {
  JwtConfigError,
  isJwtConfigured,
  serializeAuthCookie,
  signAuthToken,
} from './auth.js';

let passed = 0;
let failed = 0;

function test(name, fn) {
  const run = async () => {
    try {
      await fn();
      passed += 1;
      console.log(`ok  ${name}`);
    } catch (error) {
      failed += 1;
      console.error(`FAIL ${name}`);
      console.error(`     ${error.message}`);
    }
  };
  return run();
}

function mockRes() {
  const res = {
    statusCode: 200,
    body: null,
    headers: {},
    setHeader(key, value) {
      this.headers[key] = value;
    },
    end(payload) {
      this.body = payload;
    },
  };
  return res;
}

await test('parseJsonBody: objeto ya parseado', async () => {
  const body = await parseJsonBody({ body: { email: 'a@b.com' } });
  assert.equal(body.email, 'a@b.com');
});

await test('parseJsonBody: string JSON (Vercel)', async () => {
  const body = await parseJsonBody({ body: '{"email":"a@b.com"}' });
  assert.equal(body.email, 'a@b.com');
});

await test('parseJsonBody: Buffer', async () => {
  const body = await parseJsonBody({ body: Buffer.from('{"ok":true}', 'utf8') });
  assert.equal(body.ok, true);
});

await test('parseJsonBody: stream crudo', async () => {
  const req = Readable.from([Buffer.from('{"n":1}', 'utf8')]);
  const body = await parseJsonBody(req);
  assert.equal(body.n, 1);
});

await test('parseJsonBody: {} vacío y stream ya cerrado', async () => {
  const body = await parseJsonBody({ body: {}, readableEnded: true });
  assert.deepEqual(body, {});
});

await test('publicErrorPayload: JWT_SECRET claro, sin stack', () => {
  const payload = publicErrorPayload(new Error('Falta JWT_SECRET (mínimo 16 caracteres)'));
  assert.equal(payload.status, 503);
  assert.equal(payload.error, 'Falta JWT_SECRET en el servidor');
  assert.equal(JSON.stringify(payload).includes('stack'), false);
});

await test('publicErrorPayload: JwtConfigError expuesto', () => {
  const payload = publicErrorPayload(new JwtConfigError());
  assert.equal(payload.status, 503);
  assert.equal(payload.error, 'Falta JWT_SECRET en el servidor');
});

await test('publicErrorPayload: generico sin stack', () => {
  const err = new Error('boom');
  err.stack = 'Error: boom\n    at secret.js:1';
  const payload = publicErrorPayload(err);
  assert.equal(payload.status, 500);
  assert.equal(payload.error.includes('boom'), false);
  assert.equal(payload.error.includes('stack'), false);
  assert.equal(payload.error.includes('secret.js'), false);
});

await test('withErrorBoundary no mete stack en el JSON', async () => {
  const res = mockRes();
  await withErrorBoundary(res, async () => {
    throw new JwtConfigError();
  });
  const parsed = JSON.parse(res.body);
  assert.equal(res.statusCode, 503);
  assert.equal(parsed.error, 'Falta JWT_SECRET en el servidor');
  assert.equal(Object.keys(parsed).join(','), 'error');
});

await test('cookie: Secure + HttpOnly + SameSite=Lax + Path=/ y sin Domain', () => {
  const header = serializeAuthCookie('token-value', 3600, true);
  assert.match(header, /HttpOnly/);
  assert.match(header, /Path=\//);
  assert.match(header, /SameSite=Lax/);
  assert.match(header, /Secure/);
  assert.equal(/Domain=/i.test(header), false);
});

await test('cookie HTTP local no lleva Secure', () => {
  const header = serializeAuthCookie('token-value', 3600, false);
  assert.equal(/Secure/.test(header), false);
});

await test('producción sin JWT_SECRET: signAuthToken no es 500 opaco', async () => {
  const prevSecret = process.env.JWT_SECRET;
  const prevNode = process.env.NODE_ENV;
  const prevVercel = process.env.VERCEL;
  try {
    delete process.env.JWT_SECRET;
    process.env.NODE_ENV = 'production';
    process.env.VERCEL = '1';
    assert.equal(isJwtConfigured(), false);
    await assert.rejects(
      () => signAuthToken({ userId: 'u1', email: 'a@b.com', name: 'A' }),
      (error) => error instanceof JwtConfigError && error.message === 'Falta JWT_SECRET en el servidor'
    );
  } finally {
    if (prevSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = prevSecret;
    if (prevNode === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = prevNode;
    if (prevVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = prevVercel;
  }
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
