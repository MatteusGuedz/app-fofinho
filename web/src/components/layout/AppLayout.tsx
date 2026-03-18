import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useWedding } from '../../context/WeddingContext';
import { AnimatePresence, PageTransition } from '../ui/Motion';

/* ── Navigation pages ───────────────────────────────────── */
const PAGES = [
  { path: '/',          icon: '🏠', label: 'Início',        group: 'principal' },
  { path: '/checklist', icon: '✅', label: 'Checklist',     group: 'principal' },
  { path: '/guests',    icon: '👥', label: 'Convidados',    group: 'principal' },
  { path: '/budget',    icon: '💰', label: 'Orçamento',     group: 'planejamento' },
  { path: '/moodboard', icon: '🖼️', label: 'Moodboard',    group: 'planejamento' },
  { path: '/reports',   icon: '📊', label: 'Relatórios',    group: 'planejamento' },
];

/* ── Petal / heart particles ────────────────────────────── */
type Particle = {
  id: number;
  x: number;
  duration: number;
  delay: number;
  size: number;
  emoji: string;
};
const PETALS = ['🌸', '🌺', '💮', '🌹', '✨', '🪷', '💐'];
function spawnPetals(count = 6): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: Date.now() + i,
    x: Math.random() * 100,
    duration: 4 + Math.random() * 4,
    delay: Math.random() * 2,
    size: .7 + Math.random() * .6,
    emoji: PETALS[Math.floor(Math.random() * PETALS.length)],
  }));
}

/* ── Countdown helper ───────────────────────────────────── */
function useCountdown(dateIso: string | null | undefined) {
  const [cd, setCd] = useState<{ d: number; h: number; m: number; s: number } | null>(null);
  useEffect(() => {
    if (!dateIso) return;
    const tick = () => {
      const diff = new Date(`${dateIso}T10:00:00`).getTime() - Date.now();
      if (diff <= 0) { setCd(null); return; }
      const d = Math.floor(diff / 864e5);
      const h = Math.floor((diff % 864e5) / 36e5);
      const m = Math.floor((diff % 36e5) / 6e4);
      const s = Math.floor((diff % 6e4) / 1e3);
      setCd({ d, h, m, s });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [dateIso]);
  return cd;
}

/* ── Component ──────────────────────────────────────────── */
export function AppLayout({ children }: { children: ReactNode }) {
  const { signOut } = useAuth();
  const { wedding } = useWedding();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [petals, setPetals] = useState<Particle[]>([]);
  const petalTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const cd = useCountdown(wedding?.wedding_date);

  /* Periodic petal shower */
  const rainPetals = useCallback(() => {
    setPetals(p => [...p.slice(-12), ...spawnPetals(4)]);
    petalTimerRef.current = setTimeout(rainPetals, 8000 + Math.random() * 8000);
  }, []);
  useEffect(() => {
    petalTimerRef.current = setTimeout(rainPetals, 3000);
    return () => clearTimeout(petalTimerRef.current);
  }, [rainPetals]);

  /* Remove stale petals */
  useEffect(() => {
    const id = setInterval(() => setPetals(p => p.slice(-20)), 15000);
    return () => clearInterval(id);
  }, []);

  /* Close sidebar on route change (mobile) */
  useEffect(() => setSidebarOpen(false), [location.pathname]);

  const currentPage = PAGES.find(p => p.path === location.pathname);
  const mobileNavPages = PAGES.slice(0, 5); // only 5 in bottom nav

  /* Grouped nav for sidebar */
  const grouped = useMemo(() => {
    const m: Record<string, typeof PAGES> = {};
    PAGES.forEach(p => { (m[p.group] ||= []).push(p); });
    return m;
  }, []);

  const groupLabels: Record<string, string> = {
    principal: 'Principal',
    planejamento: 'Planejamento',
  };

  return (
    <>
      {/* ── Particle layer ── */}
      <div id="particle-layer" aria-hidden="true">
        {petals.map(p => (
          <span
            key={p.id}
            className="petal"
            style={{
              left: `${p.x}%`,
              fontSize: `${p.size}rem`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            }}
          >
            {p.emoji}
          </span>
        ))}
      </div>

      {/* ── App shell ── */}
      <div className="app-shell">

        {/* ── Sidebar overlay (mobile) ── */}
        <div
          className={`sidebar-overlay${sidebarOpen ? ' visible' : ''}`}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />

        {/* ── Sidebar ── */}
        <aside className={`sidebar${sidebarOpen ? ' open' : ''}`} aria-label="Navegação">
          {/* Brand */}
          <div className="sidebar-brand">
            <span className="sidebar-crown">💍</span>
            {wedding ? (
              <div className="sidebar-names">{wedding.name_1} & {wedding.name_2}</div>
            ) : (
              <div className="sidebar-names">Wedding Fofinho</div>
            )}
            {wedding?.wedding_date && (
              <div className="sidebar-date">
                {new Date(wedding.wedding_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </div>
            )}
            {cd && (
              <div className="sidebar-countdown">
                <div className="cd-block">
                  <div className="cd-num">{cd.d}</div>
                  <div className="cd-label">dias</div>
                </div>
                <div className="cd-block">
                  <div className="cd-num">{String(cd.h).padStart(2,'0')}</div>
                  <div className="cd-label">horas</div>
                </div>
                <div className="cd-block">
                  <div className="cd-num">{String(cd.m).padStart(2,'0')}</div>
                  <div className="cd-label">min</div>
                </div>
                <div className="cd-block">
                  <div className="cd-num">{String(cd.s).padStart(2,'0')}</div>
                  <div className="cd-label">seg</div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
            {Object.entries(grouped).map(([group, pages]) => (
              <div key={group}>
                <div className="nav-group-label">{groupLabels[group] ?? group}</div>
                {pages.map(page => (
                  <NavLink
                    key={page.path}
                    to={page.path}
                    className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                  >
                    <span className="nav-icon">{page.icon}</span>
                    <span>{page.label}</span>
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="sidebar-footer">
            <button
              type="button"
              className="nav-item"
              onClick={() => navigate('/settings')}
            >
              <span className="nav-icon">⚙️</span>
              <span>Configurações</span>
            </button>
            <button
              type="button"
              className="nav-item"
              onClick={() => signOut()}
              style={{ color: 'var(--text-muted)' }}
            >
              <span className="nav-icon">🚪</span>
              <span>Sair</span>
            </button>
          </div>
        </aside>

        {/* ── Main area ── */}
        <div className="app-main">

          {/* Topbar */}
          <header className="topbar">
            <div className="topbar-left">
              {/* Hamburger (mobile only) */}
              <button
                type="button"
                className="menu-toggle"
                aria-label="Abrir menu"
                onClick={() => setSidebarOpen(o => !o)}
              >
                ☰
              </button>

              {/* Logo / title */}
              <button
                type="button"
                className="topbar-logo"
                onClick={() => navigate('/')}
                aria-label="Ir para início"
              >
                💒
              </button>

              <div className="topbar-title">
                {currentPage?.label ?? 'Wedding'}
                {wedding && (
                  <span className="topbar-names" aria-hidden="true">
                    {wedding.name_1} & {wedding.name_2}
                  </span>
                )}
              </div>
            </div>

            <div className="topbar-right">
              <div className="sync-pill live" aria-live="polite">
                <div className="sync-dot" />
                <span className="sync-label">Conectado</span>
              </div>
            </div>
          </header>

          {/* Page content — transição suave entre páginas (animação do secundário) */}
          <main className="app-content" id="main-content">
            <AnimatePresence mode="wait">
              <PageTransition key={location.pathname}>
                {children}
              </PageTransition>
            </AnimatePresence>
          </main>

          {/* Bottom nav (mobile) */}
          <nav className="bottom-nav" aria-label="Navegação mobile">
            {mobileNavPages.map(page => {
              const isActive = location.pathname === page.path;
              return (
                <button
                  key={page.path}
                  type="button"
                  className={`bottom-nav-item${isActive ? ' active' : ''}`}
                  onClick={() => navigate(page.path)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className="nav-icon">{page.icon}</span>
                  <span className="bottom-nav-label">{page.label}</span>
                </button>
              );
            })}
            {/* Settings in mobile nav */}
            <button
              type="button"
              className={`bottom-nav-item${location.pathname === '/settings' ? ' active' : ''}`}
              onClick={() => navigate('/settings')}
            >
              <span className="nav-icon">⚙️</span>
              <span className="bottom-nav-label">Config</span>
            </button>
          </nav>
        </div>
      </div>
    </>
  );
}
