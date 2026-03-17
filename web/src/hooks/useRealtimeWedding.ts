import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { log } from '../lib/logger';

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
          log('realtime', 'info', `change on ${table}`, {
            eventType: payload.eventType,
          });
          onChange({ table, eventType: payload.eventType });
        },
      );
    });

    channel.subscribe((status) => {
      log('realtime', status === 'SUBSCRIBED' ? 'info' : 'warn', `channel status: ${status}`);
    });

    return () => {
      supabase.removeChannel(channel).catch(() => {});
    };
  }, [onChange, tables, weddingId]);
}

