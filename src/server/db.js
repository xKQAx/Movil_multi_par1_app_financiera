import { neon } from '@neondatabase/serverless';

let sqlClient;

export class DatabaseConfigError extends Error {
  constructor(message = 'Falta DATABASE_URL en el servidor') {
    super(message);
    this.name = 'DatabaseConfigError';
    this.status = 503;
    this.expose = true;
  }
}

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

/** Cliente Neon HTTP (una instancia por isolate). DATABASE_URL nunca sale al bundle de Vite. */
export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new DatabaseConfigError();
  }
  if (!sqlClient) {
    sqlClient = neon(url);
  }
  return sqlClient;
}

/** Ping sin exponer la URL ni filas. */
export async function pingDatabase() {
  if (!isDatabaseConfigured()) return false;
  try {
    const sql = getSql();
    const rows = await sql`SELECT 1 AS ok`;
    return Number(rows?.[0]?.ok) === 1;
  } catch {
    return false;
  }
}
