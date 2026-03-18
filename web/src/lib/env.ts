export function getOptionalEnvVar(key: string): string | null {
  const value = import.meta.env[key as keyof ImportMetaEnv] as string | undefined;
  return value && value.trim() ? value.trim() : null;
}

export const SUPABASE_URL = getOptionalEnvVar('VITE_SUPABASE_URL');
export const SUPABASE_ANON_KEY = getOptionalEnvVar('VITE_SUPABASE_ANON_KEY');
export const SUPABASE_CONFIG_OK = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/** E-mail do admin (acesso a /admin/diagnostico). Definir em .env como VITE_ADMIN_EMAIL ou usa o padrão. */
export const ADMIN_EMAIL =
  getOptionalEnvVar('VITE_ADMIN_EMAIL') ?? 'servicosguedz@gmail.com';

export function isAdminEmail(email: string | undefined): boolean {
  return Boolean(email && email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
}


