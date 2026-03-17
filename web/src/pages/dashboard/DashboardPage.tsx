import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useWedding } from '../../context/WeddingContext';
import { useUi } from '../../context/UiContext';
import { supabase } from '../../lib/supabase';
import { log } from '../../lib/logger';
import { formatBRL, formatDateBR } from '../../lib/format';
import { useRealtimeWedding } from '../../hooks/useRealtimeWedding';
import { FadeIn, StaggerList, StaggerItem, GlassCard, easings } from '../../components/ui/Motion';

/* ── Types ─────────────────────────────────────────────── */
type Task = { id: string; title: string; done: boolean; due_date: string | null; priority: string | null };
type Guest = { id: string; rsvp: string | null };
type Budget = { id: string; eco: number | null; mid: number | null; prem: number | null; qty: number | null };

/* ── Venue Designer types ───────────────────────────────── */
type Env = 'tenda' | 'salao' | 'jantar';
type ElType = 'round' | 'rect' | 'vip' | 'portal_altar' | 'portal_entrada' | 'buffet_bar' | 'dj_stage' | 'cake';
type VenueEl = { id: string; type: ElType; x: number; y: number; label: string; capacity: number };

const ENV_LABELS: Record<Env, string> = { tenda: 'Tenda', salao: 'Salao', jantar: 'Jantar' };
const EL_LABELS: Record<ElType, string> = {
  round: 'Mesa Redonda',
  rect: 'Mesa Ret.',
  vip: 'Mesa VIP',
  portal_altar: 'Portal Altar',
  portal_entrada: 'Portal Entrada',
  buffet_bar: 'Buffet',
  dj_stage: 'Palco/DJ',
  cake: 'Bolo',
};

/* ── Icons ──────────────────────────────────────────────── */
const icons = {
  users: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  check: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  wallet: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg>,
  location: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  calendar: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  sparkle: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>,
  layout: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>,
  refresh: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
  arrow: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
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
  const strokeC = isDark ? '#c9a84c' : '#ec7a93';
  const bgFill = isDark ? 'rgba(201,168,76,.12)' : 'rgba(236,122,147,.15)';

  switch (el.type) {
    case 'round':
      return (
        <svg width="88" height="88" viewBox="0 0 88 88">
          <defs>
            <radialGradient id={`rg${el.id.slice(-4)}`} cx="50%" cy="40%">
              <stop offset="0%" stopColor="#fff" />
              <stop offset="100%" stopColor={isDark ? '#2e1e14' : '#fdf2f4'} />
            </radialGradient>
          </defs>
          {Array.from({ length: el.capacity }, (_, i) => {
            const a = (i / el.capacity) * Math.PI * 2 - Math.PI / 2;
            return <circle key={i} cx={44 + Math.cos(a) * 36} cy={44 + Math.sin(a) * 36} r={10} fill={strokeC} stroke="rgba(255,255,255,.4)" strokeWidth="1.5" opacity=".7" />;
          })}
          <circle cx="44" cy="44" r="30" fill={`url(#rg${el.id.slice(-4)})`} stroke={strokeC} strokeWidth="2" />
          <text x="44" y="42" textAnchor="middle" fontSize="9" fill={isDark ? '#c9a84c' : '#a82b4a'} fontFamily="var(--font-script)">{el.label}</text>
          <text x="44" y="54" textAnchor="middle" fontSize="8" fill={isDark ? 'rgba(201,168,76,.6)' : '#9a7880'}>{el.capacity} lug.</text>
        </svg>
      );
    case 'vip':
      return (
        <svg width="96" height="96" viewBox="0 0 96 96">
          <defs>
            <radialGradient id={`vg${el.id.slice(-4)}`} cx="50%" cy="40%">
              <stop offset="0%" stopColor="#fffdf0" />
              <stop offset="100%" stopColor={isDark ? '#2e2010' : '#fef9c3'} />
            </radialGradient>
          </defs>
          {Array.from({ length: el.capacity }, (_, i) => {
            const a = (i / el.capacity) * Math.PI * 2 - Math.PI / 2;
            return <circle key={i} cx={48 + Math.cos(a) * 40} cy={48 + Math.sin(a) * 40} r={11} fill="#c9a55a" stroke="rgba(255,255,255,.3)" strokeWidth="1.5" opacity=".75" />;
          })}
          <circle cx="48" cy="48" r="32" fill={`url(#vg${el.id.slice(-4)})`} stroke="#c9a55a" strokeWidth="2.5" />
          <text x="48" y="46" textAnchor="middle" fontSize="9" fill="#7a5f28" fontFamily="var(--font-script)">{el.label}</text>
          <text x="48" y="58" textAnchor="middle" fontSize="11">{icons.sparkle}</text>
        </svg>
      );
    case 'rect':
      return (
        <svg width="130" height="66" viewBox="0 0 130 66">
          {Array.from({ length: Math.floor(el.capacity / 2) }, (_, i) => {
            const x = 14 + i * (102 / Math.max(1, Math.floor(el.capacity / 2) - 1));
            return <g key={i}><circle cx={x} cy="8" r="9" fill={strokeC} opacity=".7" /><circle cx={x} cy="58" r="9" fill={strokeC} opacity=".7" /></g>;
          })}
          <rect x="10" y="16" width="110" height="34" rx="6" fill={isDark ? 'rgba(42,26,30,.8)' : '#fff'} stroke={isDark ? '#c9a55a' : '#f4a9b8'} strokeWidth="2" />
          <text x="65" y="30" textAnchor="middle" fontSize="9" fill={isDark ? '#c9a55a' : '#a82b4a'} fontFamily="var(--font-script)">{el.label}</text>
          <text x="65" y="42" textAnchor="middle" fontSize="8" fill={isDark ? 'rgba(201,168,76,.5)' : '#9a7880'}>{el.capacity} lug.</text>
        </svg>
      );
    case 'portal_altar':
      return (
        <svg width="130" height="110" viewBox="0 0 130 110">
          <path d="M20,100 L20,45 Q65,5 110,45 L110,100" fill={bgFill} stroke={strokeC} strokeWidth="3" />
          <path d="M30,100 L30,50 Q65,18 100,50 L100,100" fill={bgFill} stroke={strokeC} strokeWidth="1.5" />
          <text x="65" y="70" textAnchor="middle" fontSize="11" fill={isDark ? '#c9a55a' : '#a82b4a'} fontFamily="var(--font-script)">{el.label}</text>
        </svg>
      );
    case 'portal_entrada':
      return (
        <svg width="130" height="110" viewBox="0 0 130 110">
          <rect x="15" y="20" width="100" height="80" rx="50" fill={bgFill} stroke={strokeC} strokeWidth="2.5" />
          <rect x="25" y="28" width="80" height="72" rx="40" fill="none" stroke={strokeC} strokeWidth="1" strokeDasharray="4,3" />
          <line x1="15" y1="99" x2="115" y2="99" stroke={strokeC} strokeWidth="2.5" />
          <text x="65" y="88" textAnchor="middle" fontSize="10" fill={isDark ? '#c9a55a' : '#a82b4a'} fontFamily="var(--font-script)">{el.label}</text>
        </svg>
      );
    case 'buffet_bar':
      return (
        <svg width="135" height="58" viewBox="0 0 135 58">
          <rect x="5" y="14" width="125" height="35" rx="5" fill={isDark ? 'rgba(201,168,76,.15)' : '#fdf2f4'} stroke={isDark ? '#c9a55a' : '#f4a9b8'} strokeWidth="2" />
          {[0, 1, 2].map(i => <rect key={i} x={8 + i * 33} y="16" width="30" height="31" rx="3" fill="rgba(255,255,255,.35)" stroke={isDark ? '#c9a55a' : '#f4a9b8'} strokeWidth="1" />)}
          <text x="67" y="10" textAnchor="middle" fontSize="8" fill={isDark ? '#c9a55a' : '#a82b4a'} fontFamily="var(--font-script)">{el.label}</text>
        </svg>
      );
    case 'dj_stage':
      return (
        <svg width="125" height="62" viewBox="0 0 125 62">
          <rect x="5" y="18" width="115" height="38" rx="6" fill="rgba(180,150,220,.12)" stroke="rgba(180,150,220,.5)" strokeWidth="2" />
          <circle cx="28" cy="37" r="13" fill="rgba(180,150,220,.2)" stroke="rgba(180,150,220,.6)" strokeWidth="1.5" />
          <circle cx="28" cy="37" r="5" fill="rgba(180,150,220,.5)" />
          <circle cx="97" cy="37" r="13" fill="rgba(180,150,220,.2)" stroke="rgba(180,150,220,.6)" strokeWidth="1.5" />
          <circle cx="97" cy="37" r="5" fill="rgba(180,150,220,.5)" />
          <rect x="52" y="25" width="21" height="24" rx="3" fill="rgba(255,255,255,.12)" stroke="rgba(180,150,220,.4)" strokeWidth="1" />
          <text x="62" y="11" textAnchor="middle" fontSize="8" fill="rgba(180,150,220,.9)" fontFamily="var(--font-script)">{el.label}</text>
        </svg>
      );
    case 'cake':
      return (
        <svg width="66" height="66" viewBox="0 0 66 66">
          <ellipse cx="33" cy="50" rx="28" ry="12" fill={isDark ? 'rgba(201,168,76,.15)' : '#fdf2f4'} stroke={strokeC} strokeWidth="2" />
          <rect x="10" y="30" width="46" height="22" rx="4" fill={isDark ? 'rgba(42,26,30,.8)' : '#fff'} stroke={strokeC} strokeWidth="2" />
          <rect x="10" y="20" width="46" height="12" rx="4" fill={isDark ? 'rgba(201,168,76,.2)' : '#fce8eb'} stroke={strokeC} strokeWidth="1.5" />
          <text x="33" y="50" textAnchor="middle" fontSize="8" fill={strokeC} fontFamily="var(--font-script)">{el.label}</text>
        </svg>
      );
    default:
      return <text fontSize="10">{el.label}</text>;
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
    const label = EL_LABELS[type];
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
    <motion.div 
      className="venue-wrap"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="venue-toolbar">
        {(Object.entries(ENV_LABELS) as [Env, string][]).map(([k, v]) => (
          <motion.button
            key={k}
            type="button"
            className={`venue-env-btn${env === k ? ' active' : ''}`}
            onClick={() => setEnv(k)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {v}
          </motion.button>
        ))}
        <AnimatePresence>
          {selected && (
            <motion.button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={removeSelected}
              style={{ marginLeft: 'auto' }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              Remover
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div
        ref={canvasRef}
        className={`venue-canvas env-${env}`}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={e => { if (e.target === canvasRef.current) setSelected(null); }}
      >
        {elements.length === 0 && (
          <div className="empty-state" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.6 }}>
            <span className="empty-state-icon">{icons.layout}</span>
            <p className="empty-state-title">Adicione elementos abaixo</p>
            <p className="empty-state-sub">Arraste para posicionar o espaco do seu casamento</p>
          </div>
        )}
        <AnimatePresence>
          {elements.map(el => (
            <motion.div
              key={el.id}
              className={`venue-element${selected === el.id ? ' selected' : ''}${dragging?.id === el.id ? ' dragging' : ''}`}
              style={{ left: el.x, top: el.y }}
              onPointerDown={e => startDrag(e, el.id)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
            >
              <VenueElementSvg el={el} env={env} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="venue-element-grid">
        {(Object.entries(EL_LABELS) as [ElType, string][]).map(([type, label]) => (
          <motion.button
            key={type}
            type="button"
            className="venue-add-btn"
            onClick={() => addEl(type)}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            {label}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

/* ── Love story quotes ──────────────────────────────────── */
const LOVE_FACTS = [
  'A tradicao do veu vem do Egito Antigo, para proteger a noiva de espiritos!',
  'Jogar flores vem do jardim medieval - quem pegava, logo se casaria!',
  'A alianca no dedo anelar vem da "veia do amor" que vai direto ao coracao!',
  'O bolo de casamento surgiu na Roma Antiga, feito de trigo e sal!',
  '"Lua de mel" vem do costume nordico de beber hidromel por um ciclo lunar!',
  'A valsa dos noivos era a primeira musica onde o casal se tocava em publico!',
];

/* ── Dashboard Page ─────────────────────────────────────── */
export function DashboardPage() {
  const { wedding, refresh } = useWedding();
  const { toastError } = useUi();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [budget, setBudget] = useState<Budget[]>([]);
  const [factIdx, setFactIdx] = useState(0);
  const [showVenue, setShowVenue] = useState(false);

  const countdown = useCountdown(wedding?.wedding_date);

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

  const doneTasks = tasks.filter(t => t.done).length;
  const pendingTasks = tasks.filter(t => !t.done);
  const rsvpYes = guests.filter(g => g.rsvp === 'confirmado').length;
  const rsvpNo = guests.filter(g => g.rsvp === 'recusado').length;
  const rsvpPending = guests.length - rsvpYes - rsvpNo;
  const tier = wedding?.tier ?? 'mid';
  const spent = useMemo(() =>
    budget.reduce((a, b) => a + (b.qty ?? 1) * (tier === 'eco' ? b.eco ?? 0 : tier === 'prem' ? b.prem ?? 0 : b.mid ?? 0), 0),
    [budget, tier]);
  const budgetTotal = wedding?.budget_total ?? 0;
  const budgetPct = budgetTotal > 0 ? Math.min(100, Math.round(spent / budgetTotal * 100)) : 0;
  const taskPct = tasks.length > 0 ? Math.round(doneTasks / tasks.length * 100) : 0;

  if (!wedding) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Hero Banner */}
      <FadeIn direction="up">
        <motion.div
          className="hero-banner"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: easings.smooth }}
        >
          <div className="hero-banner-bg-text" aria-hidden="true">
            {wedding.name_1} & {wedding.name_2}
          </div>
          <div className="hero-banner-content">
            <motion.div
              className="hero-kicker"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <span style={{ color: '#c9a55a' }}>{icons.sparkle}</span>
              Seu casamento fofinho
              <span style={{ color: '#c9a55a' }}>{icons.sparkle}</span>
            </motion.div>
            <motion.div
              className="hero-names"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {wedding.name_1}
              <span className="hero-ampersand"> & </span>
              {wedding.name_2}
            </motion.div>
            {wedding.wedding_date && (
              <motion.div
                className="hero-date"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <span style={{ color: 'rgba(201,165,90,0.8)' }}>{icons.calendar}</span>
                <span>{formatDateBR(wedding.wedding_date)}</span>
                {wedding.venue_name && (
                  <>
                    <span style={{ opacity: 0.4 }}>|</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: 'rgba(201,165,90,0.8)', width: 16, height: 16 }}>{icons.location}</span>
                      {wedding.venue_name}
                    </span>
                  </>
                )}
              </motion.div>
            )}
            {countdown && !countdown.past && (
              <motion.div
                className="hero-countdown"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                {[
                  { n: countdown.d, l: 'dias' },
                  { n: countdown.h, l: 'horas' },
                  { n: countdown.m, l: 'min' },
                  { n: countdown.s, l: 'seg' },
                ].map(({ n, l }, i) => (
                  <motion.div
                    key={l}
                    className="hero-cd-block"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + i * 0.1 }}
                    whileHover={{ y: -4, scale: 1.05 }}
                  >
                    <motion.span
                      className="hero-cd-num"
                      key={n}
                      initial={{ y: -5, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                    >
                      {String(n).padStart(2, '0')}
                    </motion.span>
                    <span className="hero-cd-label">{l}</span>
                  </motion.div>
                ))}
              </motion.div>
            )}
            {countdown?.past && (
              <motion.div
                style={{ marginTop: 16, fontSize: '1.5rem', fontFamily: 'var(--font-script)' }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                O grande dia chegou! Parabens!
              </motion.div>
            )}
          </div>
        </motion.div>
      </FadeIn>

      {/* Love fact banner */}
      <AnimatePresence mode="wait">
        <motion.div
          key={factIdx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4 }}
          style={{
            background: 'var(--glass-blush)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(236,122,147,0.15)',
            borderRadius: 'var(--radius-lg)',
            padding: '14px 20px',
            fontSize: '.85rem',
            color: 'var(--muted-foreground)',
            fontStyle: 'italic',
          }}
        >
          <span style={{ marginRight: 8, color: 'var(--gold-500)' }}>{icons.sparkle}</span>
          {LOVE_FACTS[factIdx]}
        </motion.div>
      </AnimatePresence>

      {/* Stats grid */}
      <StaggerList className="card-grid-4">
        <StaggerItem>
          <GlassCard className="stat-card">
            <span className="stat-icon" style={{ color: 'var(--rose-500)' }}>{icons.users}</span>
            <motion.div
              className="stat-value"
              key={guests.length}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              {loading ? '...' : guests.length}
            </motion.div>
            <div className="stat-label">Convidados</div>
            <div className="stat-sub">
              <span style={{ color: '#22c55e' }}>{rsvpYes}</span> conf. |{' '}
              <span style={{ color: '#f59e0b' }}>{rsvpPending}</span> pend. |{' '}
              <span style={{ color: '#ef4444' }}>{rsvpNo}</span> rec.
            </div>
          </GlassCard>
        </StaggerItem>

        <StaggerItem>
          <GlassCard className="stat-card">
            <span className="stat-icon" style={{ color: 'var(--rose-500)' }}>{icons.check}</span>
            <motion.div
              className="stat-value"
              key={`${doneTasks}/${tasks.length}`}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              {loading ? '...' : `${doneTasks}/${tasks.length}`}
            </motion.div>
            <div className="stat-label">Tarefas</div>
            <div style={{ marginTop: 10 }}>
              <div className="progress-track">
                <motion.div
                  className="progress-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${taskPct}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>
              <div className="stat-sub" style={{ marginTop: 6 }}>{taskPct}% concluido</div>
            </div>
          </GlassCard>
        </StaggerItem>

        <StaggerItem>
          <GlassCard className="stat-card">
            <span className="stat-icon" style={{ color: 'var(--rose-500)' }}>{icons.wallet}</span>
            <motion.div
              className="stat-value"
              style={{ fontSize: '1.4rem' }}
              key={spent}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              {loading ? '...' : formatBRL(spent)}
            </motion.div>
            <div className="stat-label">Orcamento ({tier.toUpperCase()})</div>
            {budgetTotal > 0 && (
              <div style={{ marginTop: 10 }}>
                <div className="progress-track">
                  <motion.div
                    className="progress-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${budgetPct}%` }}
                    transition={{ duration: 1, delay: 0.6 }}
                  />
                </div>
                <div className="stat-sub" style={{ marginTop: 6 }}>{budgetPct}% de {formatBRL(budgetTotal)}</div>
              </div>
            )}
          </GlassCard>
        </StaggerItem>

        <StaggerItem>
          <GlassCard className="stat-card">
            <span className="stat-icon" style={{ color: 'var(--rose-500)' }}>{icons.location}</span>
            <div className="stat-value" style={{ fontSize: '1.1rem', fontFamily: 'var(--font-script)' }}>
              {wedding.venue_name ?? '-'}
            </div>
            <div className="stat-label">Local</div>
            <div className="stat-sub" style={{ marginTop: 6 }}>
              Faixa: <strong>{tier.toUpperCase()}</strong>
            </div>
          </GlassCard>
        </StaggerItem>
      </StaggerList>

      {/* Pending tasks */}
      <FadeIn delay={0.3}>
        <GlassCard className="card">
          <div className="card-header">
            <h2 className="card-title">
              <span style={{ color: 'var(--rose-500)' }}>{icons.check}</span>
              Proximas tarefas
            </h2>
            <motion.button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => navigate('/checklist')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Ver todas {icons.arrow}
            </motion.button>
          </div>
          <div className="card-body">
            {loading ? (
              <div style={{ display: 'grid', gap: 10 }}>
                {[1, 2, 3].map(i => (
                  <motion.div
                    key={i}
                    style={{ height: 56, borderRadius: 'var(--radius-md)', background: 'rgba(236,122,147,0.08)' }}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                ))}
              </div>
            ) : pendingTasks.length > 0 ? (
              <StaggerList style={{ display: 'grid', gap: 10 }}>
                {pendingTasks.slice(0, 5).map(t => (
                  <StaggerItem key={t.id}>
                    <motion.div
                      className="task-row"
                      whileHover={{ x: 4, boxShadow: 'var(--shadow-sm)' }}
                    >
                      <div className="task-check" style={{ color: 'var(--muted-foreground)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /></svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="task-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                        <div className="task-meta">
                          {icons.calendar} {t.due_date ? formatDateBR(t.due_date) : 'Sem prazo'}
                        </div>
                      </div>
                      {t.priority && (
                        <span className={`badge ${t.priority === 'alta' ? 'badge-red' : t.priority === 'media' ? 'badge-gold' : 'badge-gray'}`}>
                          {t.priority}
                        </span>
                      )}
                      <motion.button
                        type="button"
                        className="btn btn-outline btn-xs"
                        onClick={() => navigate('/checklist')}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Abrir
                      </motion.button>
                    </motion.div>
                  </StaggerItem>
                ))}
              </StaggerList>
            ) : (
              <div className="empty-state" style={{ padding: '30px 16px' }}>
                <motion.span
                  style={{ fontSize: '2.5rem', display: 'block', marginBottom: 12 }}
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {icons.sparkle}
                </motion.span>
                <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>Nenhuma pendencia por agora!</p>
              </div>
            )}
          </div>
        </GlassCard>
      </FadeIn>

      {/* Venue Designer */}
      <FadeIn delay={0.4}>
        <GlassCard className="card">
          <div className="card-header">
            <h2 className="card-title">
              <span style={{ color: 'var(--rose-500)' }}>{icons.layout}</span>
              Designer do Espaco
            </h2>
            <motion.button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setShowVenue(v => !v)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {showVenue ? 'Recolher' : 'Abrir designer'}
            </motion.button>
          </div>
          <div className="card-body">
            <p style={{ color: 'var(--muted-foreground)', fontSize: '.9rem' }}>
              Monte visualmente o seu espaco: arraste mesas, altares e elementos decorativos.
            </p>
          </div>
          <AnimatePresence>
            {showVenue && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ padding: '0 20px 20px', overflow: 'hidden' }}
              >
                <VenueDesigner />
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      </FadeIn>

      {/* Quick actions */}
      <FadeIn delay={0.5}>
        <GlassCard className="card">
          <div className="card-header">
            <h2 className="card-title">
              <span style={{ color: 'var(--gold-500)' }}>{icons.sparkle}</span>
              Acoes rapidas
            </h2>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[
              { icon: icons.check, label: 'Nova tarefa', path: '/checklist' },
              { icon: icons.users, label: 'Convidado', path: '/guests' },
              { icon: icons.wallet, label: 'Item orcamento', path: '/budget' },
              { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>, label: 'Moodboard', path: '/moodboard' },
              { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>, label: 'Relatorio', path: '/reports' },
              { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>, label: 'Configuracoes', path: '/settings' },
            ].map((a, i) => (
              <motion.button
                key={a.path}
                type="button"
                className="btn btn-outline"
                onClick={() => navigate(a.path)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                <span style={{ color: 'var(--rose-500)' }}>{a.icon}</span>
                {a.label}
              </motion.button>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <motion.button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => refresh()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {icons.refresh}
              Atualizar dados
            </motion.button>
          </div>
        </GlassCard>
      </FadeIn>
    </div>
  );
}
