import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWedding } from '../../context/WeddingContext';
import { useUi } from '../../context/UiContext';
import { supabase } from '../../lib/supabase';
import { log } from '../../lib/logger';
import { formatBRL, formatDateBR } from '../../lib/format';
import { useRealtimeWedding } from '../../hooks/useRealtimeWedding';

/* ── Types ─────────────────────────────────────────────── */
type Task   = { id: string; title: string; done: boolean; due_date: string | null; priority: string | null };
type Guest  = { id: string; rsvp: string | null };
type Budget = { id: string; eco: number | null; mid: number | null; prem: number | null; qty: number | null };

/* ── Venue Designer types ───────────────────────────────── */
type Env  = 'tenda' | 'salao' | 'jantar';
type ElType = 'round' | 'rect' | 'vip' | 'portal_altar' | 'portal_entrada' | 'buffet_bar' | 'dj_stage' | 'cake';
type VenueEl = { id: string; type: ElType; x: number; y: number; label: string; capacity: number };

const ENV_LABELS: Record<Env, string>    = { tenda: '🏕️ Tenda', salao: '🏛️ Salão', jantar: '🕯️ Jantar' };
const EL_LABELS: Record<ElType, string>  = {
  round: '⭕ Mesa Redonda', rect: '▬ Mesa Ret.', vip: '⭐ Mesa VIP',
  portal_altar: '🌸 Portal Altar', portal_entrada: '🚪 Portal Entrada',
  buffet_bar: '🍽️ Buffet', dj_stage: '🎵 Palco/DJ', cake: '🎂 Bolo',
};

/* ── Countdown hook ─────────────────────────────────────── */
function useCountdown(dateIso: string | null | undefined) {
  const [val, setVal] = useState<{ d: number; h: number; m: number; s: number; past: boolean } | null>(null);
  useEffect(() => {
    if (!dateIso) return;
    const tick = () => {
      const diff = new Date(`${dateIso}T10:00:00`).getTime() - Date.now();
      if (diff <= 0) { setVal({ d: 0, h: 0, m: 0, s: 0, past: true }); return; }
      setVal({
        d: Math.floor(diff / 864e5),
        h: Math.floor((diff % 864e5) / 36e5),
        m: Math.floor((diff % 36e5) / 6e4),
        s: Math.floor((diff % 6e4) / 1e3),
        past: false,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [dateIso]);
  return val;
}

/* ── SVG drawer for venue elements ──────────────────────── */
function VenueElementSvg({ el, env }: { el: VenueEl; env: Env }) {
  const isDark = env === 'jantar';
  const strokeC = isDark ? '#c9a84c' : '#d4878d';
  const bgFill  = isDark ? 'rgba(201,168,76,.12)' : 'rgba(232,180,184,.18)';

  switch (el.type) {
    case 'round': return (
      <svg width="88" height="88" viewBox="0 0 88 88">
        <defs>
          <radialGradient id={`rg${el.id.slice(-4)}`} cx="50%" cy="40%">
            <stop offset="0%" stopColor="#fff"/>
            <stop offset="100%" stopColor={isDark ? '#2e1e14' : '#fdf0f1'}/>
          </radialGradient>
        </defs>
        {Array.from({ length: el.capacity }, (_, i) => {
          const a = (i / el.capacity) * Math.PI * 2 - Math.PI / 2;
          return <circle key={i} cx={44 + Math.cos(a) * 36} cy={44 + Math.sin(a) * 36} r={10} fill={strokeC} stroke="rgba(255,255,255,.4)" strokeWidth="1.5" opacity=".7"/>;
        })}
        <circle cx="44" cy="44" r="30" fill={`url(#rg${el.id.slice(-4)})`} stroke={strokeC} strokeWidth="2"/>
        <text x="44" y="42" textAnchor="middle" fontSize="9" fill={isDark ? '#c9a84c' : '#b8545c'} fontFamily="Dancing Script, cursive">{el.label}</text>
        <text x="44" y="54" textAnchor="middle" fontSize="8" fill={isDark ? 'rgba(201,168,76,.6)' : 'var(--text-muted, #9a7a80)'}>{el.capacity} lug.</text>
      </svg>
    );
    case 'vip': return (
      <svg width="96" height="96" viewBox="0 0 96 96">
        <defs>
          <radialGradient id={`vg${el.id.slice(-4)}`} cx="50%" cy="40%">
            <stop offset="0%" stopColor="#fffdf0"/>
            <stop offset="100%" stopColor={isDark ? '#2e2010' : '#f5e6d3'}/>
          </radialGradient>
        </defs>
        {Array.from({ length: el.capacity }, (_, i) => {
          const a = (i / el.capacity) * Math.PI * 2 - Math.PI / 2;
          return <circle key={i} cx={48 + Math.cos(a) * 40} cy={48 + Math.sin(a) * 40} r={11} fill="#c9a84c" stroke="rgba(255,255,255,.3)" strokeWidth="1.5" opacity=".75"/>;
        })}
        <circle cx="48" cy="48" r="32" fill={`url(#vg${el.id.slice(-4)})`} stroke="#c9a84c" strokeWidth="2.5"/>
        <text x="48" y="46" textAnchor="middle" fontSize="9" fill="#a8873a" fontFamily="Dancing Script, cursive">{el.label}</text>
        <text x="48" y="58" textAnchor="middle" fontSize="9">⭐</text>
      </svg>
    );
    case 'rect': return (
      <svg width="130" height="66" viewBox="0 0 130 66">
        {Array.from({ length: Math.floor(el.capacity / 2) }, (_, i) => {
          const x = 14 + i * (102 / Math.max(1, Math.floor(el.capacity/2) - 1));
          return <g key={i}><circle cx={x} cy="8" r="9" fill={strokeC} opacity=".7"/><circle cx={x} cy="58" r="9" fill={strokeC} opacity=".7"/></g>;
        })}
        <rect x="10" y="16" width="110" height="34" rx="6" fill={isDark ? 'rgba(42,26,30,.8)' : '#fff'} stroke={isDark ? '#c9a84c' : '#e8d0b0'} strokeWidth="2"/>
        <text x="65" y="30" textAnchor="middle" fontSize="9" fill={isDark ? '#c9a84c' : '#b8545c'} fontFamily="Dancing Script, cursive">{el.label}</text>
        <text x="65" y="42" textAnchor="middle" fontSize="8" fill={isDark ? 'rgba(201,168,76,.5)' : '#9a7a80'}>{el.capacity} lug.</text>
      </svg>
    );
    case 'portal_altar': return (
      <svg width="130" height="110" viewBox="0 0 130 110">
        <path d="M20,100 L20,45 Q65,5 110,45 L110,100" fill={bgFill} stroke={strokeC} strokeWidth="3"/>
        <path d="M30,100 L30,50 Q65,18 100,50 L100,100" fill={bgFill} stroke={strokeC} strokeWidth="1.5"/>
        <text x="5" y="18" fontSize="15">🌸</text><text x="105" y="18" fontSize="15">🌸</text>
        <text x="15" y="35" fontSize="12">🌺</text><text x="100" y="35" fontSize="12">🌺</text>
        <text x="65" y="70" textAnchor="middle" fontSize="11" fill={isDark ? '#c9a84c' : '#b8545c'} fontFamily="Dancing Script, cursive">{el.label}</text>
      </svg>
    );
    case 'portal_entrada': return (
      <svg width="130" height="110" viewBox="0 0 130 110">
        <rect x="15" y="20" width="100" height="80" rx="50 50 0 0 / 40 40 0 0" fill={bgFill} stroke={strokeC} strokeWidth="2.5"/>
        <rect x="25" y="28" width="80" height="72" rx="40 40 0 0 / 34 34 0 0" fill="none" stroke={strokeC} strokeWidth="1" strokeDasharray="4,3"/>
        <line x1="15" y1="99" x2="115" y2="99" stroke={strokeC} strokeWidth="2.5"/>
        <text x="30" y="12" fontSize="11">🌿🌸🌿</text>
        <text x="65" y="70" textAnchor="middle" fontSize="18">🚪</text>
        <text x="65" y="88" textAnchor="middle" fontSize="10" fill={isDark ? '#c9a84c' : '#b8545c'} fontFamily="Dancing Script, cursive">{el.label}</text>
      </svg>
    );
    case 'buffet_bar': return (
      <svg width="135" height="58" viewBox="0 0 135 58">
        <rect x="5" y="14" width="125" height="35" rx="5" fill={isDark ? 'rgba(201,168,76,.15)' : '#fdf0f1'} stroke={isDark ? '#c9a84c' : '#e8d0b0'} strokeWidth="2"/>
        {[0,1,2].map(i => <rect key={i} x={8 + i*33} y="16" width="30" height="31" rx="3" fill="rgba(255,255,255,.35)" stroke={isDark ? '#c9a84c' : '#e8d0b0'} strokeWidth="1"/>)}
        <text x="12" y="38" fontSize="16">🍖</text><text x="45" y="38" fontSize="16">🥗</text><text x="78" y="38" fontSize="16">🥩</text>
        <text x="67" y="10" textAnchor="middle" fontSize="8" fill={isDark ? '#c9a84c' : '#b8545c'} fontFamily="Dancing Script, cursive">{el.label}</text>
      </svg>
    );
    case 'dj_stage': return (
      <svg width="125" height="62" viewBox="0 0 125 62">
        <rect x="5" y="18" width="115" height="38" rx="6" fill="rgba(180,150,220,.12)" stroke="rgba(180,150,220,.5)" strokeWidth="2"/>
        <circle cx="28" cy="37" r="13" fill="rgba(180,150,220,.2)" stroke="rgba(180,150,220,.6)" strokeWidth="1.5"/>
        <circle cx="28" cy="37" r="5" fill="rgba(180,150,220,.5)"/>
        <circle cx="97" cy="37" r="13" fill="rgba(180,150,220,.2)" stroke="rgba(180,150,220,.6)" strokeWidth="1.5"/>
        <circle cx="97" cy="37" r="5" fill="rgba(180,150,220,.5)"/>
        <rect x="52" y="25" width="21" height="24" rx="3" fill="rgba(255,255,255,.12)" stroke="rgba(180,150,220,.4)" strokeWidth="1"/>
        <text x="62" y="11" textAnchor="middle" fontSize="8" fill="rgba(180,150,220,.9)" fontFamily="Dancing Script, cursive">{el.label}</text>
        <text x="57" y="42" fontSize="12">🎵</text>
      </svg>
    );
    case 'cake': return (
      <svg width="66" height="66" viewBox="0 0 66 66">
        <ellipse cx="33" cy="50" rx="28" ry="12" fill={isDark ? 'rgba(201,168,76,.15)' : '#fdf0f1'} stroke={strokeC} strokeWidth="2"/>
        <rect x="10" y="30" width="46" height="22" rx="4" fill={isDark ? 'rgba(42,26,30,.8)' : '#fff'} stroke={strokeC} strokeWidth="2"/>
        <rect x="10" y="20" width="46" height="12" rx="4" fill={isDark ? 'rgba(201,168,76,.2)' : '#fce8ea'} stroke={strokeC} strokeWidth="1.5"/>
        <text x="33" y="34" textAnchor="middle" fontSize="18">🎂</text>
        <text x="33" y="50" textAnchor="middle" fontSize="8" fill={strokeC} fontFamily="Dancing Script, cursive">{el.label}</text>
      </svg>
    );
    default: return <text fontSize="10">{el.label}</text>;
  }
}

/* ── Venue Designer component ───────────────────────────── */
function VenueDesigner() {
  const [env, setEnv] = useState<Env>('tenda');
  const [elements, setElements] = useState<VenueEl[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ id: string; ox: number; oy: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const uid = () => Math.random().toString(36).slice(2, 9);

  const addEl = (type: ElType) => {
    const cap = type === 'round' ? 8 : type === 'rect' ? 10 : type === 'vip' ? 4 : 0;
    const label = EL_LABELS[type].replace(/^[^ ]+ /, '');
    setElements(e => [...e, { id: uid(), type, x: 60 + Math.random() * 200, y: 60 + Math.random() * 200, label, capacity: cap }]);
  };

  const startDrag = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    setSelected(id);
    setDragging({ id, ox: e.clientX, oy: e.clientY });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setElements(els => els.map(el => {
      if (el.id !== dragging.id) return el;
      const nx = el.x + (e.clientX - dragging.ox);
      const ny = el.y + (e.clientY - dragging.oy);
      return { ...el, x: Math.max(0, Math.min(rect.width - 140, nx)), y: Math.max(0, Math.min(rect.height - 120, ny)) };
    }));
    setDragging(d => d ? { ...d, ox: e.clientX, oy: e.clientY } : null);
  };

  const onPointerUp = () => setDragging(null);

  const removeSelected = () => {
    if (!selected) return;
    setElements(e => e.filter(el => el.id !== selected));
    setSelected(null);
  };

  return (
    <div className="venue-wrap">
      {/* Environment selector */}
      <div className="venue-toolbar">
        {(Object.entries(ENV_LABELS) as [Env, string][]).map(([k, v]) => (
          <button key={k} type="button" className={`venue-env-btn${env === k ? ' active' : ''}`} onClick={() => setEnv(k)}>
            {v}
          </button>
        ))}
        {selected && (
          <button type="button" className="btn btn-danger btn-sm" onClick={removeSelected} style={{ marginLeft: 'auto' }}>
            🗑️ Remover
          </button>
        )}
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className={`venue-canvas env-${env}`}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={e => { if (e.target === canvasRef.current) setSelected(null); }}
      >
        {elements.length === 0 && (
          <div className="empty-state" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: .6 }}>
            <span className="empty-state-icon">🏛️</span>
            <p className="empty-state-title">Adicione elementos abaixo</p>
            <p className="empty-state-sub">Arraste para posicionar o espaço do seu casamento</p>
          </div>
        )}
        {elements.map(el => (
          <div
            key={el.id}
            className={`venue-element${selected === el.id ? ' selected' : ''}${dragging?.id === el.id ? ' dragging' : ''}`}
            style={{ left: el.x, top: el.y }}
            onPointerDown={e => startDrag(e, el.id)}
          >
            <VenueElementSvg el={el} env={env} />
          </div>
        ))}
      </div>

      {/* Add element buttons */}
      <div className="venue-element-grid">
        {(Object.entries(EL_LABELS) as [ElType, string][]).map(([type, label]) => (
          <button key={type} type="button" className="venue-add-btn" onClick={() => addEl(type)}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Love story quotes ──────────────────────────────────── */
const LOVE_FACTS = [
  '💡 A tradição do véu vem do Egito Antigo, para proteger a noiva de espíritos!',
  '💡 Jogar flores vem do jardim medieval — quem pegava, logo se casaria!',
  '💡 A aliança no dedo anelar vem da "veia do amor" que vai direto ao coração!',
  '💡 O bolo de casamento surgiu na Roma Antiga, feito de trigo e sal!',
  '💡 "Lua de mel" vem do costume nórdico de beber hidromel por um ciclo lunar!',
  '💡 A valsa dos noivos era a primeira música onde o casal se tocava em público!',
];

/* ── Dashboard Page ─────────────────────────────────────── */
export function DashboardPage() {
  const { wedding, refresh } = useWedding();
  const { toastError }       = useUi();
  const navigate             = useNavigate();

  const [loading, setLoading]     = useState(true);
  const [tasks,   setTasks]       = useState<Task[]>([]);
  const [guests,  setGuests]      = useState<Guest[]>([]);
  const [budget,  setBudget]      = useState<Budget[]>([]);
  const [factIdx, setFactIdx]     = useState(0);
  const [showVenue, setShowVenue] = useState(false);

  const countdown = useCountdown(wedding?.wedding_date);

  /* Rotate love facts */
  useEffect(() => {
    const id = setInterval(() => setFactIdx(i => (i + 1) % LOVE_FACTS.length), 8000);
    return () => clearInterval(id);
  }, []);

  const loadSummary = useCallback(async () => {
    if (!wedding) return;
    setLoading(true);
    const t0 = performance.now();
    const [tRes, gRes, bRes] = await Promise.all([
      supabase.from('tasks').select('id,title,done,priority,due_date').eq('wedding_id', wedding.id).order('due_date', { ascending: true }).limit(8),
      supabase.from('guests').select('id,rsvp').eq('wedding_id', wedding.id),
      supabase.from('budget_items').select('id,eco,mid,prem,qty').eq('wedding_id', wedding.id),
    ]);
    const ms = Math.round(performance.now() - t0);
    log('dashboard.load', 'info', `load summary in ${ms}ms`);
    if (tRes.error || gRes.error || bRes.error) toastError('Erro ao carregar dados.');
    setTasks((tRes.data as Task[]) ?? []);
    setGuests((gRes.data as Guest[]) ?? []);
    setBudget((bRes.data as Budget[]) ?? []);
    setLoading(false);
  }, [wedding, toastError]);

  useEffect(() => { loadSummary(); }, [loadSummary]);

  useRealtimeWedding({
    weddingId: wedding?.id,
    tables: ['tasks', 'guests', 'budget_items'],
    onChange: () => loadSummary(),
  });

  /* Derived stats */
  const doneTasks    = tasks.filter(t => t.done).length;
  const pendingTasks = tasks.filter(t => !t.done);
  const rsvpYes      = guests.filter(g => g.rsvp === 'confirmado').length;
  const rsvpNo       = guests.filter(g => g.rsvp === 'recusado').length;
  const rsvpPending  = guests.length - rsvpYes - rsvpNo;
  const tier         = wedding?.tier ?? 'mid';
  const spent        = useMemo(() =>
    budget.reduce((a, b) => a + (b.qty ?? 1) * (tier === 'eco' ? b.eco ?? 0 : tier === 'prem' ? b.prem ?? 0 : b.mid ?? 0), 0),
    [budget, tier]);
  const budgetTotal = wedding?.budget_total ?? 0;
  const budgetPct   = budgetTotal > 0 ? Math.min(100, Math.round(spent / budgetTotal * 100)) : 0;
  const taskPct     = tasks.length > 0 ? Math.round(doneTasks / tasks.length * 100) : 0;

  if (!wedding) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Hero banner ── */}
      <div className="hero-banner fade-in-up">
        <div className="hero-banner-bg-text" aria-hidden="true">
          {wedding.name_1} & {wedding.name_2}
        </div>
        <div className="hero-banner-content">
          <div className="hero-kicker">Seu casamento fofinho ✨</div>
          <div className="hero-names">
            {wedding.name_1}
            <span className="hero-ampersand"> & </span>
            {wedding.name_2}
          </div>
          {wedding.wedding_date && (
            <div className="hero-date">
              <span>📅</span>
              <span>{formatDateBR(wedding.wedding_date)}</span>
              {wedding.venue_name && <><span>·</span><span>📍 {wedding.venue_name}</span></>}
            </div>
          )}
          {countdown && !countdown.past && (
            <div className="hero-countdown">
              {[
                { n: countdown.d, l: 'dias' },
                { n: countdown.h, l: 'horas' },
                { n: countdown.m, l: 'min' },
                { n: countdown.s, l: 'seg' },
              ].map(({ n, l }) => (
                <div key={l} className="hero-cd-block">
                  <span className="hero-cd-num">{String(n).padStart(2, '0')}</span>
                  <span className="hero-cd-label">{l}</span>
                </div>
              ))}
            </div>
          )}
          {countdown?.past && (
            <div style={{ marginTop: 14, fontSize: '1.4rem', fontFamily: 'var(--font-script)' }}>
              🎉 O grande dia chegou! Parabéns!
            </div>
          )}
        </div>
      </div>

      {/* ── Love fact banner ── */}
      <div
        style={{
          background: 'linear-gradient(90deg, rgba(253,240,241,.85), rgba(245,230,211,.85))',
          border: '1px solid rgba(232,180,184,.3)',
          borderRadius: 'var(--r-md)',
          padding: '10px 16px',
          fontSize: '.8rem',
          color: 'var(--text-soft)',
          fontStyle: 'italic',
          transition: 'opacity .5s',
          animation: 'fadeSlideUp .4s var(--ease-out)',
        }}
        key={factIdx}
      >
        {LOVE_FACTS[factIdx]}
      </div>

      {/* ── Stats grid ── */}
      <div className="card-grid-4 fade-in-up stagger-1">
        <div className="stat-card">
          <span className="stat-icon">👥</span>
          <div className="stat-value">{loading ? '…' : guests.length}</div>
          <div className="stat-label">Convidados</div>
          <div className="stat-sub">✅ {rsvpYes} · ⏳ {rsvpPending} · ❌ {rsvpNo}</div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">✅</span>
          <div className="stat-value">{loading ? '…' : `${doneTasks}/${tasks.length}`}</div>
          <div className="stat-label">Tarefas</div>
          <div style={{ marginTop: 8 }}>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${taskPct}%` }} />
            </div>
            <div className="stat-sub" style={{ marginTop: 4 }}>{taskPct}% concluído</div>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">💰</span>
          <div className="stat-value" style={{ fontSize: '1.3rem' }}>{loading ? '…' : formatBRL(spent)}</div>
          <div className="stat-label">Orçamento ({tier.toUpperCase()})</div>
          {budgetTotal > 0 && (
            <div style={{ marginTop: 8 }}>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${budgetPct}%` }} />
              </div>
              <div className="stat-sub" style={{ marginTop: 4 }}>{budgetPct}% de {formatBRL(budgetTotal)}</div>
            </div>
          )}
        </div>
        <div className="stat-card">
          <span className="stat-icon">📸</span>
          <div className="stat-value" style={{ fontSize: '1.1rem', fontFamily: 'var(--font-script)' }}>
            {wedding.venue_name ?? '—'}
          </div>
          <div className="stat-label">Local</div>
          <div className="stat-sub" style={{ marginTop: 4 }}>
            Faixa: <strong>{tier.toUpperCase()}</strong>
          </div>
        </div>
      </div>

      {/* ── Pending tasks ── */}
      <div className="card fade-in-up stagger-2">
        <div className="card-header">
          <h2 className="card-title">✅ Próximas tarefas</h2>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate('/checklist')}>
            Ver todas
          </button>
        </div>
        <div className="card-body">
          {loading ? (
            <div style={{ display: 'grid', gap: 8 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 52, borderRadius: 'var(--r-md)' }} />)}
            </div>
          ) : pendingTasks.length > 0 ? (
            <div style={{ display: 'grid', gap: 8 }}>
              {pendingTasks.slice(0, 5).map((t, idx) => (
                <div
                  key={t.id}
                  className="task-row fade-in-up"
                  style={{ animationDelay: `${idx * .05}s` }}
                >
                  <div className="task-check">○</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="task-title truncate">{t.title}</div>
                    <div className="task-meta">{t.due_date ? `📅 ${formatDateBR(t.due_date)}` : 'Sem prazo'}</div>
                  </div>
                  {t.priority && (
                    <span className={`badge ${t.priority === 'alta' ? 'badge-red' : t.priority === 'media' ? 'badge-gold' : 'badge-sage'}`}>
                      {t.priority}
                    </span>
                  )}
                  <button type="button" className="btn btn-outline btn-xs" onClick={() => navigate('/checklist')}>
                    Abrir →
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '24px 10px' }}>
              <span style={{ fontSize: '2rem' }}>🎉</span>
              <p style={{ marginTop: 8, fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>Nenhuma pendência por agora!</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Venue Designer ── */}
      <div className="card fade-in-up stagger-3">
        <div className="card-header">
          <h2 className="card-title">🏛️ Designer do Espaço</h2>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setShowVenue(v => !v)}
          >
            {showVenue ? '▲ Recolher' : '▼ Abrir designer'}
          </button>
        </div>
        <div className="card-body">
          <p className="muted">Monte visualmente o seu espaço: arraste mesas, altares e elementos decorativos.</p>
        </div>
        {showVenue && (
          <div style={{ padding: '0 20px 20px' }}>
            <VenueDesigner />
          </div>
        )}
      </div>

      {/* ── Quick actions ── */}
      <div className="card fade-in-up stagger-4">
        <div className="card-header">
          <h2 className="card-title">⚡ Ações rápidas</h2>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { icon: '✅', label: 'Nova tarefa', path: '/checklist' },
            { icon: '👥', label: 'Convidado', path: '/guests' },
            { icon: '💰', label: 'Item orçamento', path: '/budget' },
            { icon: '🖼️', label: 'Moodboard', path: '/moodboard' },
            { icon: '📊', label: 'Relatório', path: '/reports' },
            { icon: '⚙️', label: 'Configurações', path: '/settings' },
          ].map(a => (
            <button
              key={a.path}
              type="button"
              className="btn btn-outline"
              onClick={() => navigate(a.path)}
            >
              {a.icon} {a.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => refresh()}>
            🔄 Atualizar dados
          </button>
        </div>
      </div>
    </div>
  );
}
