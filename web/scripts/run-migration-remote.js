#!/usr/bin/env node
/**
 * Abre o SQL Editor do Supabase no navegador e mostra instruções
 * para colar a migração 20250317_wedding_sharing.sql
 *
 * Uso: node scripts/run-migration-remote.js
 * (Ou: npm run db:migrate:dashboard)
 *
 * Requer que VITE_SUPABASE_URL esteja no .env (ex: https://XXX.supabase.co)
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function getProjectRef() {
  try {
    const envPath = join(root, '.env');
    const env = readFileSync(envPath, 'utf8');
    const m = env.match(/VITE_SUPABASE_URL=https?:\/\/([^.]+)\.supabase\.co/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

const ref = getProjectRef();
const sqlPath = join(root, 'supabase', 'migrations', '20250317_wedding_sharing.sql');
let sql = '';
try {
  sql = readFileSync(sqlPath, 'utf8');
} catch (e) {
  console.error('Arquivo de migração não encontrado:', sqlPath);
  process.exit(1);
}

const dashboardUrl = ref
  ? `https://supabase.com/dashboard/project/${ref}/sql/new`
  : 'https://supabase.com/dashboard';

console.log('\n=== Rodar migração de compartilhamento (noiva + noivo) ===\n');
console.log('1. Abra o SQL Editor no navegador:');
console.log('   ', dashboardUrl);
console.log('\n2. Cole o conteúdo do arquivo:');
console.log('   web/supabase/migrations/20250317_wedding_sharing.sql');
console.log('\n3. Clique em Run.\n');
console.log('--- Conteúdo da migração (copie e cole no SQL Editor) ---\n');
console.log(sql);
console.log('\n--- Fim da migração ---\n');
