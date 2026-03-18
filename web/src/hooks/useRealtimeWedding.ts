import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

type UseRealtimeWeddingOpts = {
  weddingId: string | null | undefined;
  tables: string[];
  onChange: (evt: { table: string; eventType: string }) => void;
};

export function useRealtimeWedding({ weddingId, tables, onChange }: UseRealtimeWeddingOpts) {
  useEffect(() => {
    if (!weddingId) return;
    if (!tables.length) return;

    const channel = supabase.channel(`wedding:${weddingId}`);

    tables.forEach((table) => {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: `wedding_id=eq.${weddingId}`,
        },
        (payload) => {
          onChange({ table, eventType: payload.eventType });
        },
      );
    });

    channel.subscribe(() => {});

    return () => {
      supabase.removeChannel(channel).catch(() => {});
    };
  }, [onChange, tables, weddingId]);
}

