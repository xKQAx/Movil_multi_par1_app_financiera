import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';
import { loadLocalEnv } from './loadEnv.mjs';

loadLocalEnv();

const MIGRATION_ID = '001_init';

function splitSqlStatements(sqlText) {
  const withoutComments = sqlText
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n');
  return withoutComments
    .split(';')
    .map((chunk) => chunk.trim())
    .filter(Boolean);
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('Falta DATABASE_URL en .env (variable de servidor, nunca VITE_*).');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  const filePath = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'db', 'migrations', '001_init.sql');
  const sqlText = await readFile(filePath, 'utf8');

  console.log('Aplicando migración 001_init…');

  for (const statement of splitSqlStatements(sqlText)) {
    await sql.query(statement);
  }

  await sql`
    INSERT INTO schema_migrations (id)
    VALUES (${MIGRATION_ID})
    ON CONFLICT (id) DO NOTHING
  `;

  console.log('Migración 001_init lista (tablas users, preferences, movements).');
}

main().catch((error) => {
  console.error('No se pudo aplicar la migración.');
  console.error(error?.message || error);
  process.exit(1);
});
