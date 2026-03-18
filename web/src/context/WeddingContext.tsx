import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { log } from '../lib/logger';

export type WeddingTier = 'eco' | 'mid' | 'prem';

export type Wedding = {
  id: string;
  name_1: string;
  name_2: string;
  wedding_date: string | null;
  venue_name: string | null;
  budget_total: number | null;
  tier: WeddingTier;
  happened_at: string | null;
  purge_at: string | null;
};

type WeddingContextValue = {
  wedding: Wedding | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const WeddingContext = createContext<WeddingContextValue | undefined>(undefined);

/**
 * MVP do fluxo: 1 usuário tem 1 wedding (owner_id = auth user id).
 * Isso simplifica até você criar a camada couples/invite_token.
 */
export function WeddingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!user) return;
    setLoading(true);

    const t0 = performance.now();
    // 1) Casamento onde sou dono
    let { data, error } = await supabase
      .from('weddings')
      .select(
        'id,name_1,name_2,wedding_date,venue_name,budget_total,tier,happened_at,purge_at',
      )
      .eq('owner_id', user.id)
      .maybeSingle();

    // 2) Se não tenho como dono, busco como parceiro(a) compartilhado
    if (!error && !data) {
      const memberRes = await supabase
        .from('wedding_members')
        .select('wedding_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();
      if (memberRes.data?.wedding_id) {
        const wRes = await supabase
          .from('weddings')
          .select(
            'id,name_1,name_2,wedding_date,venue_name,budget_total,tier,happened_at,purge_at',
          )
          .eq('id', memberRes.data.wedding_id)
          .single();
        data = wRes.data as Wedding | null;
        error = wRes.error;
      }
    }

    const ms = Math.round(performance.now() - t0);
    log('wedding.refresh', error ? 'error' : 'info', `fetch weddings in ${ms}ms`, {
      error,
      hasData: !!data,
    });

    if (error) {
      setWedding(null);
      setLoading(false);
      return;
    }

    setWedding((data as Wedding) ?? null);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) {
      setWedding(null);
      setLoading(false);
      return;
    }
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const value = useMemo(() => ({ wedding, loading, refresh }), [wedding, loading]);

  return <WeddingContext.Provider value={value}>{children}</WeddingContext.Provider>;
}

export function useWedding() {
  const ctx = useContext(WeddingContext);
  if (!ctx) throw new Error('useWedding deve ser usado dentro de WeddingProvider');
  return ctx;
}

