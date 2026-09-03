import { neon } from '@neondatabase/serverless';
import { loadLocalEnv } from './loadEnv.mjs';

loadLocalEnv();

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('Falta DATABASE_URL en .env (variable de servidor, nunca VITE_*).');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  const [tables] = await sql`
    SELECT
      to_regclass('public.users')::text AS users,
      to_regclass('public.preferences')::text AS preferences,
      to_regclass('public.movements')::text AS movements,
      to_regclass('public.schema_migrations')::text AS schema_migrations
  `;

  const present = (name) => (name ? 'sí' : 'no');
  console.log('Esquema public (contra tu .env; no se imprime la URL):');
  console.log(`  users: ${present(tables?.users)}`);
  console.log(`  preferences: ${present(tables?.preferences)}`);
  console.log(`  movements: ${present(tables?.movements)}`);
  console.log(`  schema_migrations: ${present(tables?.schema_migrations)}`);

  if (!tables?.users) {
    console.log('No está public.users. Ejecuta npm run migrate contra este mismo .env.');
    process.exit(1);
  }

  const [countRow] = await sql`SELECT count(*)::int AS n FROM users`;
  console.log(`Usuarios registrados: ${countRow?.n ?? 0} (sin listar correos)`);
}

main().catch((error) => {
  console.error('No se pudo listar las tablas.');
  console.error(error?.message || error);
  process.exit(1);
});
