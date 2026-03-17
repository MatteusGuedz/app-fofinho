export function getOptionalEnvVar(key: string): string | null {
  const value = import.meta.env[key as keyof ImportMetaEnv] as string | undefined;
  return value && value.trim() ? value.trim() : null;
}

export const SUPABASE_URL = getOptionalEnvVar('VITE_SUPABASE_URL');
export const SUPABASE_ANON_KEY = getOptionalEnvVar('VITE_SUPABASE_ANON_KEY');
export const SUPABASE_CONFIG_OK = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);


