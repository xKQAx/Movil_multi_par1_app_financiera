/**
 * Stub de cliente Supabase.
 *
 * TODO Compañera: reemplazar Auth local por Supabase Auth (signIn/signUp)
 * y persistir movimientos en Postgres.
 *
 * Pasos esperados:
 * 1. npm install @supabase/supabase-js
 * 2. Crear `.env` con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY (nunca subir secrets)
 * 3. Descomentar createClient y usarlo desde AuthContext / FinanceContext
 * 4. Tablas sugeridas: profiles, movements, preferences — con RLS por auth.uid()
 * 5. (Opcional) PWA + service worker para notificaciones en segundo plano
 */
export function createSupabaseClient() {
  // import { createClient } from '@supabase/supabase-js';
  // return createClient(
  //   import.meta.env.VITE_SUPABASE_URL,
  //   import.meta.env.VITE_SUPABASE_ANON_KEY
  // );
  return null;
}
