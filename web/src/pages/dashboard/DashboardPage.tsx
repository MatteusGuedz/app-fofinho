import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useWedding } from '../../context/WeddingContext';
import { useUi } from '../../context/UiContext';
import { supabase } from '../../lib/supabase';
import { log } from '../../lib/logger';
import { formatBRL, formatDateBR } from '../../lib/format';
import { useNavigate } from 'react-router-dom';
import { useRealtimeWedding } from '../../hooks/useRealtimeWedding';

type Task = { id: string; title: string; done: boolean; priority: string | null; due_date: string | null };
type Guest = { id: string; rsvp: string | null };
type BudgetItem = { id: string; eco: number | null; mid: number | null; prem: number | null; qty: number | null };

export function DashboardPage() {
  const { wedding, refresh } = useWedding();
  const { toastError } = useUi();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);

  const loadSummary = useCallback(async () => {
    if (!wedding) return;
    setLoading(true);
    const t0 = performance.now();
    const [tRes, gRes, bRes] = await Promise.all([
      supabase
        .from('tasks')
        .select('id,title,done,priority,due_date')
        .eq('wedding_id', wedding.id)
        .order('due_date', { ascending: true })
        .limit(6),
      supabase.from('guests').select('id,rsvp').eq('wedding_id', wedding.id),
      supabase.from('budget_items').select('id,eco,mid,prem,qty').eq('wedding_id', wedding.id),
    ]);
    const ms = Math.round(performance.now() - t0);

    log('dashboard.load', 'info', `load summary in ${ms}ms`, {
      tasksErr: tRes.error?.message,
      guestsErr: gRes.error?.message,
      budgetErr: bRes.error?.message,
    });

    if (tRes.error || gRes.error || bRes.error) {
      toastError('Erro ao carregar dados do dashboard. Verifique o Supabase.');
    }
    setTasks((tRes.data as Task[]) ?? []);
    setGuests((gRes.data as Guest[]) ?? []);
    setBudgetItems((bRes.data as BudgetItem[]) ?? []);
    setLoading(false);
  }, [toastError, wedding]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    loadSummary();
  }, [loadSummary]);

  useRealtimeWedding({
    weddingId: wedding?.id,
    tables: ['tasks', 'guests', 'budget_items'],
    onChange: () => loadSummary(),
  });

  const countdown = useMemo(() => {
    if (!wedding?.wedding_date) return null;
    const now = new Date();
    const target = new Date(`${wedding.wedding_date}T10:00:00`);
    const diff = target.getTime() - now.getTime();
    if (Number.isNaN(diff)) return null;
    if (diff <= 0) return { past: true } as const;
    const d = Math.floor(diff / 864e5);
    const h = Math.floor((diff % 864e5) / 36e5);
    const m = Math.floor((diff % 36e5) / 6e4);
    return { d, h, m, past: false } as const;
  }, [wedding?.wedding_date]);

  const doneTasks = tasks.filter((t) => t.done).length;
  const pendingTasks = tasks.filter((t) => !t.done);
  const rsvpYes = guests.filter((g) => g.rsvp === 'confirmado').length;
  const rsvpNo = guests.filter((g) => g.rsvp === 'recusado').length;
  const rsvpPending = guests.length - rsvpYes - rsvpNo;

  const tier = wedding?.tier ?? 'mid';
  const spent = budgetItems.reduce((acc, b) => {
    const qty = b.qty ?? 1;
    const v = tier === 'eco' ? b.eco ?? 0 : tier === 'prem' ? b.prem ?? 0 : b.mid ?? 0;
    return acc + v * qty;
  }, 0);

  const budgetTotal = wedding?.budget_total ?? 0;
  const pct = budgetTotal > 0 ? Math.min(100, Math.round((spent / budgetTotal) * 100)) : 0;

  if (!wedding) return null;

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Card title="💕 Seu resumo" subtitle={formatDateBR(wedding.wedding_date)}>
        <div className="card-grid">
          <div className="card">
            <div className="muted">👥 Convidados</div>
            <div style={{ fontFamily: 'var(--heading)', fontSize: '1.5rem', color: 'var(--rose-deep)' }}>
              {loading ? '…' : guests.length}
            </div>
            <div className="muted" style={{ marginTop: 6 }}>
              ✅ {rsvpYes} · ⏳ {rsvpPending} · ❌ {rsvpNo}
            </div>
          </div>
          <div className="card">
            <div className="muted">✅ Tarefas</div>
            <div style={{ fontFamily: 'var(--heading)', fontSize: '1.5rem', color: 'var(--rose-deep)' }}>
              {loading ? '…' : `${doneTasks}/${tasks.length}`}
            </div>
            <div className="muted" style={{ marginTop: 6 }}>
              Pendentes: {loading ? '…' : pendingTasks.length}
            </div>
          </div>
          <div className="card">
            <div className="muted">💰 Orçamento ({tier})</div>
            <div style={{ fontFamily: 'var(--heading)', fontSize: '1.5rem', color: 'var(--rose-deep)' }}>
              {loading ? '…' : formatBRL(spent)}
            </div>
            <div className="muted" style={{ marginTop: 6 }}>
              {budgetTotal ? `${pct}% do total ${formatBRL(budgetTotal)}` : 'Defina o orçamento em Configurações'}
            </div>
          </div>
          <div className="card">
            <div className="muted">⏳ Contagem</div>
            <div style={{ fontFamily: 'var(--heading)', fontSize: '1.5rem', color: 'var(--rose-deep)' }}>
              {!countdown
                ? '—'
                : countdown.past
                  ? '🎉 Chegou!'
                  : `${countdown.d}d ${countdown.h}h ${countdown.m}m`}
            </div>
            <div className="muted" style={{ marginTop: 6 }}>
              {wedding.venue_name ? `📍 ${wedding.venue_name}` : 'Configure o local'}
            </div>
          </div>
        </div>
      </Card>

      <Card title="✅ Próximas tarefas" subtitle="Sem precisar de F5: atualiza ao salvar">
        {loading ? (
          <div className="muted">Carregando…</div>
        ) : pendingTasks.length ? (
          <div style={{ display: 'grid', gap: 8 }}>
            {pendingTasks.slice(0, 5).map((t) => (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'center',
                  padding: '8px 10px',
                  borderRadius: 14,
                  border: '1px solid rgba(232,180,184,.35)',
                  background: 'rgba(255,255,255,.7)',
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>📝</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.title}
                  </div>
                  <div className="muted">
                    {t.due_date ? `📅 ${formatDateBR(t.due_date)}` : 'Sem prazo'}
                  </div>
                </div>
                <Button variant="outline" onClick={() => navigate('/checklist')}>
                  Abrir
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="muted">🎉 Nenhuma pendência por agora.</div>
        )}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
          <Button variant="ghost" onClick={() => refresh()}>
            🔄 Atualizar
          </Button>
          <Button onClick={() => navigate('/checklist')}>Ver checklist</Button>
        </div>
      </Card>
    </div>
  );
}

