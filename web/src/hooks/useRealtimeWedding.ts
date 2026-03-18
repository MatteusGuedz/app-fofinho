import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { log } from '../lib/logger';

type UseRealtimeWeddingOpts = {
  weddingId: string | null | undefined;
  tables: string[];
  onChange: (evt: { table: string; eventType: string }) => void;
};

export function useRealtimeWedding({ weddingId, tables, onChange }: UseRealtimeWeddingOpts) {
  const effectRunCount = useRef(0);

  useEffect(() => {
    effectRunCount.current += 1;
    const runId = effectRunCount.current;
    // #region agent log
    fetch('http://127.0.0.1:7434/ingest/30ff6121-9aee-4398-81b9-d741fc09375c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'0cbc08'},body:JSON.stringify({sessionId:'0cbc08',location:'useRealtimeWedding.ts:effect',message:'effect ran',data:{runId,weddingId:weddingId??null,tablesLen:tables.length},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
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
      // #region agent log
      fetch('http://127.0.0.1:7434/ingest/30ff6121-9aee-4398-81b9-d741fc09375c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'0cbc08'},body:JSON.stringify({sessionId:'0cbc08',location:'useRealtimeWedding.ts:subscribe',message:'channel status',data:{status,runId},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
      // #endregion
      log('realtime', status === 'SUBSCRIBED' ? 'info' : 'warn', `channel status: ${status}`);
    });

    return () => {
      supabase.removeChannel(channel).catch(() => {});
    };
  }, [onChange, tables, weddingId]);
}

