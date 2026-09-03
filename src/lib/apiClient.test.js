/**
 * El cliente debe mostrar el `error` del JSON (login 500), no un genérico.
 * Ejecutar: node src/lib/apiClient.test.js
 */
import assert from 'node:assert/strict';
import { apiFetch, toResultError } from './apiClient.js';

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

await test('login 500: usa error del JSON', async () => {
  const prev = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: false,
    status: 500,
    json: async () => ({ error: 'Falta JWT_SECRET en el servidor' }),
  });
  try {
    await assert.rejects(
      () => apiFetch('/api/auth/login', { method: 'POST', body: '{}' }),
      (error) => error.message === 'Falta JWT_SECRET en el servidor' && error.status === 500
    );
  } finally {
    globalThis.fetch = prev;
  }
});

await test('register 409: usa error del JSON', async () => {
  const prev = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: false,
    status: 409,
    json: async () => ({ error: 'Ya existe una cuenta; inicia sesión.' }),
  });
  try {
    await assert.rejects(
      () => apiFetch('/api/auth/register', { method: 'POST', body: '{}' }),
      (error) => error.message === 'Ya existe una cuenta; inicia sesión.' && error.status === 409
    );
    const result = toResultError({
      message: 'Ya existe una cuenta; inicia sesión.',
      data: {},
    });
    assert.equal(result.error, 'Ya existe una cuenta; inicia sesión.');
  } finally {
    globalThis.fetch = prev;
  }
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
