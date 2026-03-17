import { createClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_CONFIG_OK, SUPABASE_URL } from './env';
import { log } from './logger';

// Tipagem mínima; você pode substituir por tipos gerados do Supabase depois.
if (!SUPABASE_CONFIG_OK) {
  log(
    'config',
    'warn',
    'Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env',
  );
}

// Se não houver config, cria um client “dummy” para a UI iniciar e mostrar instruções.
export const supabase = createClient(SUPABASE_URL ?? 'http://localhost', SUPABASE_ANON_KEY ?? 'anon', {
  auth: {
    persistSession: true,
    storageKey: 'wedding_app_auth',
  },
});

