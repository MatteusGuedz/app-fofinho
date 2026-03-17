import { useCallback, useEffect, useMemo, useState } from 'react';
import { useWedding } from '../../context/WeddingContext';
import { useUi } from '../../context/UiContext';
import { supabase } from '../../lib/supabase';
import { formatBRL, formatDateBR } from '../../lib/format';
import { log } from '../../lib/logger';

type Task   = { id: string; title: string; done: boolean; priority: string | null; due_date: string | null; category: string | null };
type Guest  = { id: string; name: string; rsvp: string | null; group: string | null; table_name: string | null };
type Budget = { id: string; name: string; category: string | null; eco: number | null; mid: number | null; prem: number | null; qty: number | null; status: string | null; vendor_name: string | null };

const CAT_ICONS: Record<string, string> = {
  local:'🏛️', decoracao:'🌸', buffet:'🍽️', vestuario:'👗', foto:'📸', musica:'🎵', papelaria:'💌', outro:'📌',
};

export function ReportsPage() {
  const { wedding } = useWedding();
  const { toastSuccess } = useUi();

  const [tasks,  setTasks]  = useState<Task[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [budget, setBudget] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'all' | 'tasks' | 'guests' | 'budget'>('all');

  const load = useCallback(async () => {
    if (!wedding) return;
    setLoading(true);
    const [t, g, b] = await Promise.all([
      supabase.from('tasks').select('id,title,done,priority,due_date,category').eq('wedding_id', wedding.id).order('done').order('due_date'),
      supabase.from('guests').select('id,name,rsvp,group,table_name').eq('wedding_id', wedding.id).order('name'),
      supabase.from('budget_items').select('id,name,category,eco,mid,prem,qty,status,vendor_name').eq('wedding_id', wedding.id).order('name'),
    ]);
    log('reports.load', 'info', 'loaded report data');
    setTasks((t.data as Task[]) ?? []);
    setGuests((g.data as Guest[]) ?? []);
    setBudget((b.data as Budget[]) ?? []);
    setLoading(false);
  }, [wedding]);

  useEffect(() => { load(); }, [load]);

  const tier = wedding?.tier ?? 'mid';
  const spent = useMemo(() =>
    budget.reduce((a, b) => a + (b.qty ?? 1) * (tier === 'eco' ? b.eco ?? 0 : tier === 'prem' ? b.prem ?? 0 : b.mid ?? 0), 0),
    [budget, tier]);
  const budgetTotal  = wedding?.budget_total ?? 0;
  const budgetPct    = budgetTotal > 0 ? Math.min(100, Math.round(spent / budgetTotal * 100)) : 0;
  const doneTasks    = tasks.filter(t => t.done).length;
  const taskPct      = tasks.length > 0 ? Math.round(doneTasks / tasks.length * 100) : 0;
  const rsvpYes      = guests.filter(g => g.rsvp === 'confirmado').length;
  const rsvpPending  = guests.filter(g => g.rsvp === 'pendente').length;
  const rsvpNo       = guests.filter(g => g.rsvp === 'recusado').length;

  /* Budget by category */
  const budgetByCat = useMemo(() => {
    const m: Record<string, number> = {};
    budget.forEach(b => {
      const cat = b.category ?? 'outro';
      const v = (b.qty ?? 1) * (tier === 'eco' ? b.eco ?? 0 : tier === 'prem' ? b.prem ?? 0 : b.mid ?? 0);
      m[cat] = (m[cat] ?? 0) + v;
    });
    return Object.entries(m).sort(([, a], [, b]) => b - a);
  }, [budget, tier]);

  const doPrint = () => { toastSuccess('Abrindo janela de impressão…'); window.print(); };

  if (!wedding) return null;

  const show = (section: string) => activeSection === 'all' || activeSection === section;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Controls (screen only) ── */}
      <div className="card fade-in-up" style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h2 className="card-title">📊 Relatório do Casamento</h2>
            <p className="muted" style={{ marginTop: 2 }}>Versão A4 — linda para imprimir ou salvar como PDF</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <div className="tabs" style={{ margin: 0 }}>
              {(['all','tasks','guests','budget'] as const).map(s => (
                <button key={s} type="button" className={`tab${activeSection === s ? ' active' : ''}`} onClick={() => setActiveSection(s)}>
                  {{ all: '📋 Tudo', tasks: '✅ Tarefas', guests: '👥 Convidados', budget: '💰 Orçamento' }[s]}
                </button>
              ))}
            </div>
            <button type="button" className="btn btn-primary" onClick={doPrint}>
              🖨️ Imprimir / PDF
            </button>
          </div>
        </div>
      </div>

      {/* ── A4 Document ── */}
      {loading ? (
        <div style={{ display: 'grid', gap: 12 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 'var(--r-lg)' }}/>)}
        </div>
      ) : (
        <div className="a4-wrapper fade-in-up stagger-1">
          <div className="a4-paper-bg" aria-hidden="true"/>

          {/* Cover */}
          <div className="a4-cover">
            <div className="a4-cover-kicker">Wedding Fofinho · Relatório Oficial</div>
            <div className="a4-cover-names">
              {wedding.name_1} & {wedding.name_2}
            </div>
            {wedding.wedding_date && (
              <div className="a4-cover-date">
                📅 {formatDateBR(wedding.wedding_date)}
                {wedding.venue_name ? ` · 📍 ${wedding.venue_name}` : ''}
              </div>
            )}
            <div className="a4-divider">💍</div>

            {/* Summary stats */}
            <div className="a4-grid-2">
              <div className="a4-stat-box">
                <div className="a4-stat-label">Convidados</div>
                <div className="a4-stat-value">{guests.length}</div>
                <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  ✅ {rsvpYes} conf. · ⏳ {rsvpPending} pend. · ❌ {rsvpNo} rec.
                </div>
              </div>
              <div className="a4-stat-box">
                <div className="a4-stat-label">Checklist</div>
                <div className="a4-stat-value">{doneTasks}/{tasks.length}</div>
                <div style={{ marginTop: 6 }}>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${taskPct}%` }}/>
                  </div>
                  <div style={{ fontSize: '.68rem', color: 'var(--text-muted)', marginTop: 3 }}>{taskPct}% concluído</div>
                </div>
              </div>
              <div className="a4-stat-box">
                <div className="a4-stat-label">Orçamento estimado ({tier.toUpperCase()})</div>
                <div className="a4-stat-value">{formatBRL(spent)}</div>
                {budgetTotal > 0 && (
                  <>
                    <div style={{ marginTop: 6 }}>
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${budgetPct}%` }}/>
                      </div>
                    </div>
                    <div style={{ fontSize: '.68rem', color: 'var(--text-muted)', marginTop: 3 }}>
                      {budgetPct}% de {formatBRL(budgetTotal)}
                    </div>
                  </>
                )}
              </div>
              <div className="a4-stat-box">
                <div className="a4-stat-label">Itens no orçamento</div>
                <div className="a4-stat-value">{budget.length}</div>
                <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  {budgetByCat.length} categoria{budgetByCat.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </div>

          {/* ── Budget by category ── */}
          {show('budget') && budgetByCat.length > 0 && (
            <div className="a4-section">
              <div className="a4-section-title">💰 Orçamento por categoria</div>
              <div style={{ display: 'grid', gap: 6 }}>
                {budgetByCat.map(([cat, val]) => (
                  <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1rem', width: 22, textAlign: 'center' }}>{CAT_ICONS[cat] ?? '📌'}</span>
                    <span style={{ flex: 1, fontSize: '.82rem', color: 'var(--text-soft)', textTransform: 'capitalize' }}>{cat}</span>
                    <div style={{ flex: 2, background: 'var(--blush)', borderRadius: 'var(--r-pill)', overflow: 'hidden', height: 7 }}>
                      <div style={{ width: `${spent > 0 ? Math.round(val/spent*100) : 0}%`, height: '100%', background: 'linear-gradient(90deg, var(--rose), var(--rose-deep))', borderRadius: 'var(--r-pill)' }}/>
                    </div>
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: '.95rem', fontWeight: 700, color: 'var(--rose-deep)', minWidth: 90, textAlign: 'right' }}>
                      {formatBRL(val)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Budget detail table */}
              {budget.length > 0 && (
                <>
                  <div className="a4-divider" style={{ margin: '14px 0 10px' }}>·</div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.75rem' }}>
                      <thead>
                        <tr style={{ background: 'linear-gradient(135deg, var(--blush), var(--champagne))' }}>
                          {['Item', 'Categoria', 'Fornecedor', 'Qtd', 'Valor', 'Status'].map(h => (
                            <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontSize: '.6rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-soft)', fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {budget.map(b => {
                          const val = (b.qty ?? 1) * (tier === 'eco' ? b.eco ?? 0 : tier === 'prem' ? b.prem ?? 0 : b.mid ?? 0);
                          return (
                            <tr key={b.id} style={{ borderBottom: '1px solid rgba(232,180,184,.1)' }}>
                              <td style={{ padding: '7px 10px', color: 'var(--text)' }}>{b.name}</td>
                              <td style={{ padding: '7px 10px', color: 'var(--text-muted)' }}>{CAT_ICONS[b.category ?? ''] ?? '📌'} {b.category}</td>
                              <td style={{ padding: '7px 10px', color: 'var(--text-muted)' }}>{b.vendor_name ?? '—'}</td>
                              <td style={{ padding: '7px 10px', color: 'var(--text-muted)', textAlign: 'center' }}>{b.qty ?? 1}</td>
                              <td style={{ padding: '7px 10px', fontFamily: 'var(--font-serif)', fontWeight: 700, color: 'var(--rose-deep)', whiteSpace: 'nowrap' }}>{formatBRL(val)}</td>
                              <td style={{ padding: '7px 10px' }}>
                                <span className={`badge ${b.status === 'pago' ? 'badge-green' : b.status === 'aprovado' ? 'badge-sage' : b.status === 'orcado' ? 'badge-gold' : 'badge-gray'}`}>
                                  {b.status ?? 'pesquisando'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                        <tr style={{ background: 'linear-gradient(135deg, var(--blush), var(--champagne))', fontWeight: 700 }}>
                          <td colSpan={4} style={{ padding: '8px 10px', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>Total estimado</td>
                          <td style={{ padding: '8px 10px', fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: '1rem', color: 'var(--rose-deep)' }}>{formatBRL(spent)}</td>
                          <td/>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Guests list ── */}
          {show('guests') && guests.length > 0 && (
            <div className="a4-section">
              <div className="a4-divider">💌</div>
              <div className="a4-section-title">👥 Lista de convidados</div>

              {/* RSVP summary */}
              <div className="a4-grid-2" style={{ marginBottom: 14 }}>
                {[
                  { label: 'Confirmados', val: rsvpYes,     color: '#388e3c' },
                  { label: 'Pendentes',   val: rsvpPending, color: 'var(--gold-deep)' },
                  { label: 'Recusados',   val: rsvpNo,      color: '#c62828' },
                  { label: 'Total',       val: guests.length, color: 'var(--rose-deep)' },
                ].map(s => (
                  <div key={s.label} className="a4-stat-box" style={{ textAlign: 'center' }}>
                    <div className="a4-stat-label">{s.label}</div>
                    <div className="a4-stat-value" style={{ color: s.color }}>{s.val}</div>
                  </div>
                ))}
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.75rem' }}>
                  <thead>
                    <tr style={{ background: 'linear-gradient(135deg, var(--blush), var(--champagne))' }}>
                      {['Nome', 'Grupo', 'Mesa', 'RSVP'].map(h => (
                        <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontSize: '.6rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-soft)', fontWeight: 700 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {guests.map(g => (
                      <tr key={g.id} style={{ borderBottom: '1px solid rgba(232,180,184,.08)' }}>
                        <td style={{ padding: '7px 10px', fontWeight: 600 }}>{g.name}</td>
                        <td style={{ padding: '7px 10px', color: 'var(--text-muted)', fontSize: '.72rem' }}>{g.group}</td>
                        <td style={{ padding: '7px 10px', color: 'var(--text-muted)', fontSize: '.72rem' }}>{g.table_name ?? '—'}</td>
                        <td style={{ padding: '7px 10px' }}>
                          <span className={`badge ${g.rsvp === 'confirmado' ? 'badge-green' : g.rsvp === 'recusado' ? 'badge-red' : 'badge-gold'}`}>
                            {g.rsvp === 'confirmado' ? '✅ Conf.' : g.rsvp === 'recusado' ? '❌ Rec.' : '⏳ Pend.'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Checklist ── */}
          {show('tasks') && tasks.length > 0 && (
            <div className="a4-section">
              <div className="a4-divider">✅</div>
              <div className="a4-section-title">✅ Checklist</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div className="progress-track" style={{ height: 10 }}>
                    <div className="progress-fill" style={{ width: `${taskPct}%` }}/>
                  </div>
                </div>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', color: 'var(--rose-deep)', fontWeight: 700 }}>
                  {doneTasks}/{tasks.length} ({taskPct}%)
                </span>
              </div>

              <div style={{ display: 'grid', gap: 4 }}>
                {tasks.map(t => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', borderRadius: 8, background: t.done ? 'rgba(168,184,154,.1)' : 'rgba(253,240,241,.5)', borderLeft: `3px solid ${t.done ? '#a8b89a' : (t.priority === 'alta' ? '#e53935' : t.priority === 'media' ? '#c9a84c' : '#a8b89a')}` }}>
                    <span style={{ fontSize: '.9rem' }}>{t.done ? '✅' : '○'}</span>
                    <span style={{ flex: 1, fontSize: '.8rem', fontWeight: 500, color: t.done ? 'var(--text-muted)' : 'var(--text)', textDecoration: t.done ? 'line-through' : 'none' }}>
                      {t.title}
                    </span>
                    {t.due_date && <span style={{ fontSize: '.68rem', color: 'var(--text-muted)' }}>📅 {formatDateBR(t.due_date)}</span>}
                    {t.priority && !t.done && (
                      <span className={`badge ${t.priority === 'alta' ? 'badge-red' : t.priority === 'media' ? 'badge-gold' : 'badge-sage'}`}>
                        {t.priority}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Footer ── */}
          <div className="a4-footer">
            <div>
              Gerado em {new Date().toLocaleString('pt-BR')} · Wedding Fofinho
            </div>
            <div style={{ fontFamily: 'var(--font-script)', fontSize: '1.2rem', color: 'var(--rose)' }}>
              {wedding.name_1} & {wedding.name_2} 💕
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
