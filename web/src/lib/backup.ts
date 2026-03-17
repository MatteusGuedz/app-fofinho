import { supabase } from './supabase';
import { log } from './logger';

export type BackupV1 = {
  version: 1;
  exported_at: string;
  wedding: any;
  tasks: any[];
  guests: any[];
  budget_items: any[];
  mood_refs: any[];
};

export async function exportBackup(weddingId: string): Promise<BackupV1> {
  const t0 = performance.now();
  const [w, t, g, b, m] = await Promise.all([
    supabase.from('weddings').select('*').eq('id', weddingId).single(),
    supabase.from('tasks').select('*').eq('wedding_id', weddingId),
    supabase.from('guests').select('*').eq('wedding_id', weddingId),
    supabase.from('budget_items').select('*').eq('wedding_id', weddingId),
    supabase.from('mood_refs').select('*').eq('wedding_id', weddingId),
  ]);
  const ms = Math.round(performance.now() - t0);

  log('backup.export', 'info', `export backup in ${ms}ms`, {
    weddingErr: w.error?.message,
    tasksErr: t.error?.message,
    guestsErr: g.error?.message,
    budgetErr: b.error?.message,
    moodErr: m.error?.message,
  });

  if (w.error) throw w.error;
  if (t.error) throw t.error;
  if (g.error) throw g.error;
  if (b.error) throw b.error;
  if (m.error) throw m.error;

  return {
    version: 1,
    exported_at: new Date().toISOString(),
    wedding: w.data,
    tasks: t.data ?? [],
    guests: g.data ?? [],
    budget_items: b.data ?? [],
    mood_refs: m.data ?? [],
  };
}

export async function importBackup(weddingId: string, backup: BackupV1) {
  const t0 = performance.now();

  // Estratégia segura (MVP): limpar tabelas filhas e inserir novamente.
  // Wedding principal não é sobrescrito por padrão (evita apagar owner_id, flags, etc).
  const del1 = await supabase.from('tasks').delete().eq('wedding_id', weddingId);
  const del2 = await supabase.from('guests').delete().eq('wedding_id', weddingId);
  const del3 = await supabase.from('budget_items').delete().eq('wedding_id', weddingId);
  const del4 = await supabase.from('mood_refs').delete().eq('wedding_id', weddingId);

  if (del1.error) throw del1.error;
  if (del2.error) throw del2.error;
  if (del3.error) throw del3.error;
  if (del4.error) throw del4.error;

  const tasks = (backup.tasks ?? []).map((t) => ({ ...t, wedding_id: weddingId }));
  const guests = (backup.guests ?? []).map((g) => ({ ...g, wedding_id: weddingId }));
  const budget = (backup.budget_items ?? []).map((b) => ({ ...b, wedding_id: weddingId }));
  const mood = (backup.mood_refs ?? []).map((m) => ({ ...m, wedding_id: weddingId }));

  // Remove ids para evitar conflito; o banco pode gerar novos.
  const stripId = (row: any) => {
    const { id, created_at, updated_at, ...rest } = row ?? {};
    return rest;
  };

  const ins1 = tasks.length ? await supabase.from('tasks').insert(tasks.map(stripId)) : { error: null };
  const ins2 = guests.length ? await supabase.from('guests').insert(guests.map(stripId)) : { error: null };
  const ins3 = budget.length ? await supabase.from('budget_items').insert(budget.map(stripId)) : { error: null };
  const ins4 = mood.length ? await supabase.from('mood_refs').insert(mood.map(stripId)) : { error: null };

  if ((ins1 as any).error) throw (ins1 as any).error;
  if ((ins2 as any).error) throw (ins2 as any).error;
  if ((ins3 as any).error) throw (ins3 as any).error;
  if ((ins4 as any).error) throw (ins4 as any).error;

  const ms = Math.round(performance.now() - t0);
  log('backup.import', 'info', `import backup in ${ms}ms`, {
    tasks: tasks.length,
    guests: guests.length,
    budget: budget.length,
    mood: mood.length,
  });
}

