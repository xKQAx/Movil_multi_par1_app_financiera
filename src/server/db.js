import { neon } from '@neondatabase/serverless';

let sqlClient;

/** Cliente Neon HTTP (una instancia por isolate). DATABASE_URL nunca sale al bundle de Vite. */
export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('Falta DATABASE_URL en el entorno del servidor.');
  }
  if (!sqlClient) {
    sqlClient = neon(url);
  }
  return sqlClient;
}
