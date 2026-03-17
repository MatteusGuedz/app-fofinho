import { useEffect, useMemo, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { TextField } from '../../components/ui/TextField';
import { useWedding } from '../../context/WeddingContext';
import { useUi } from '../../context/UiContext';
import { supabase } from '../../lib/supabase';
import { log } from '../../lib/logger';
import { formatDateBR } from '../../lib/format';
import { useRealtimeWedding } from '../../hooks/useRealtimeWedding';

type Task = {
  id: string;
  title: string;
  done: boolean;
  priority: string | null;
  due_date: string | null;
  notes: string | null;
};

export function ChecklistPage() {
  const { wedding } = useWedding();
  const { toastError, toastSuccess, confirm } = useUi();

  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [due, setDue] = useState('');
  const [priority, setPriority] = useState<'baixa' | 'media' | 'alta'>('media');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!wedding) return;
    setLoading(true);
    const t0 = performance.now();
    const res = await supabase
      .from('tasks')
      .select('id,title,done,priority,due_date,notes')
      .eq('wedding_id', wedding.id)
      .order('done', { ascending: true })
      .order('due_date', { ascending: true });
    const ms = Math.round(performance.now() - t0);
    log('tasks.load', res.error ? 'error' : 'info', `load tasks in ${ms}ms`, {
      error: res.error?.message,
      count: res.data?.length,
    });

    if (res.error) toastError(res.error.message);
    setTasks((res.data as Task[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wedding?.id]);

  useRealtimeWedding({
    weddingId: wedding?.id,
    tables: ['tasks'],
    onChange: () => load(),
  });

  const pct = useMemo(() => {
    if (!tasks.length) return 0;
    const done = tasks.filter((t) => t.done).length;
    return Math.round((done / tasks.length) * 100);
  }, [tasks]);

  const toggle = async (t: Task) => {
    if (!wedding) return;
    const next = !t.done;
    const t0 = performance.now();
    const res = await supabase
      .from('tasks')
      .update({ done: next })
      .eq('id', t.id)
      .eq('wedding_id', wedding.id);
    const ms = Math.round(performance.now() - t0);
    log('tasks.toggle', res.error ? 'error' : 'info', `toggle task in ${ms}ms`, {
      id: t.id,
      next,
      error: res.error?.message,
    });

    if (res.error) return toastError(res.error.message);
    setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, done: next } : x)));
    toastSuccess(next ? 'Concluída! 🎉' : 'Reaberta ✨');
  };

  const remove = async (t: Task) => {
    if (!wedding) return;
    const ok = await confirm({
      title: 'Apagar tarefa?',
      body: `Tem certeza que deseja apagar “${t.title}”?`,
      confirmText: 'Apagar',
      danger: true,
    });
    if (!ok) return;

    const t0 = performance.now();
    const res = await supabase.from('tasks').delete().eq('id', t.id).eq('wedding_id', wedding.id);
    const ms = Math.round(performance.now() - t0);
    log('tasks.delete', res.error ? 'error' : 'info', `delete task in ${ms}ms`, {
      id: t.id,
      error: res.error?.message,
    });

    if (res.error) return toastError(res.error.message);
    setTasks((prev) => prev.filter((x) => x.id !== t.id));
    toastSuccess('Tarefa removida.');
  };

  const create = async () => {
    if (!wedding) return;
    if (!title.trim()) return toastError('Digite o título da tarefa.');
    setSaving(true);
    const payload = {
      wedding_id: wedding.id,
      title: title.trim(),
      done: false,
      priority,
      due_date: due || null,
      notes: notes.trim() || null,
    };

    const t0 = performance.now();
    const res = await supabase.from('tasks').insert(payload).select('id,title,done,priority,due_date,notes').single();
    const ms = Math.round(performance.now() - t0);
    log('tasks.create', res.error ? 'error' : 'info', `create task in ${ms}ms`, {
      payload,
      error: res.error?.message,
    });

    if (res.error) {
      toastError(res.error.message);
      setSaving(false);
      return;
    }

    setTasks((prev) => [res.data as Task, ...prev]);
    setModalOpen(false);
    setTitle('');
    setDue('');
    setNotes('');
    setPriority('media');
    toastSuccess('Tarefa adicionada! 💕');
    setSaving(false);
  };

  if (!wedding) return null;

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Card title="✅ Checklist" subtitle={`${pct}% concluído`}>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div className="muted">Casamento de {wedding.name_1} &amp; {wedding.name_2}</div>
          <Button onClick={() => setModalOpen(true)}>+ Nova tarefa</Button>
        </div>
      </Card>

      <Card title="📋 Tarefas" subtitle="Clique para concluir/reabrir">
        {loading ? (
          <div className="muted">Carregando…</div>
        ) : tasks.length ? (
          <div style={{ display: 'grid', gap: 8 }}>
            {tasks.map((t) => (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'center',
                  padding: '10px 10px',
                  borderRadius: 14,
                  border: '1px solid rgba(232,180,184,.35)',
                  background: 'rgba(255,255,255,.7)',
                }}
              >
                <button
                  type="button"
                  onClick={() => toggle(t)}
                  className="btn-outline"
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 999,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(232,180,184,.9)',
                    background: t.done ? 'linear-gradient(135deg,var(--rose-strong),var(--rose-deep))' : 'transparent',
                    color: t.done ? 'white' : 'var(--rose-deep)',
                    cursor: 'pointer',
                  }}
                  aria-label={t.done ? 'Reabrir tarefa' : 'Concluir tarefa'}
                >
                  {t.done ? '✓' : '○'}
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, textDecoration: t.done ? 'line-through' : 'none' }}>
                    {t.title}
                  </div>
                  <div className="muted">
                    {t.due_date ? `📅 ${formatDateBR(t.due_date)}` : 'Sem prazo'}
                    {t.notes ? ` · 📝 ${t.notes}` : ''}
                  </div>
                </div>
                <Button variant="ghost" onClick={() => remove(t)}>
                  🗑️
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="muted">Nenhuma tarefa. Adicione a primeira 💕</div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
          <Button variant="ghost" onClick={load}>
            🔄 Atualizar
          </Button>
        </div>
      </Card>

      <Modal
        open={modalOpen}
        title="✅ Nova tarefa"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button loading={saving} onClick={create}>
              Salvar
            </Button>
          </>
        }
      >
        <TextField label="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <TextField label="Prazo" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          <div className="field">
            <label className="field-label" htmlFor="pri">
              Prioridade
            </label>
            <select
              id="pri"
              className="field-input"
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
            >
              <option value="baixa">🟢 Baixa</option>
              <option value="media">🟡 Média</option>
              <option value="alta">🔴 Alta</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label className="field-label" htmlFor="notes">
            Observações
          </label>
          <input
            id="notes"
            className="field-input"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: falar com decoradora..."
          />
        </div>
      </Modal>
    </div>
  );
}

