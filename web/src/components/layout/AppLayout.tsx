import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useWedding } from '../../context/WeddingContext';
import { FadeIn, PageTransition, easings } from '../ui/Motion';

/* ── Navigation pages ───────────────────────────────────── */
const PAGES = [
  { path: '/',          icon: 'home',     label: 'Inicio',        group: 'principal' },
  { path: '/checklist', icon: 'check',    label: 'Checklist',     group: 'principal' },
  { path: '/guests',    icon: 'users',    label: 'Convidados',    group: 'principal' },
  { path: '/budget',    icon: 'wallet',   label: 'Orcamento',     group: 'planejamento' },
  { path: '/moodboard', icon: 'image',    label: 'Moodboard',     group: 'planejamento' },
  { path: '/reports',   icon: 'chart',    label: 'Relatorios',    group: 'planejamento' },
];

/* ── SVG Icons ──────────────────────────────────────────── */
const icons: Record<string, JSX.Element> = {
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4"/>
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  wallet: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
      <path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>
    </svg>
  ),
  image: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  rings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="12" r="6"/>
      <circle cx="15" cy="12" r="6"/>
    </svg>
  ),
  heart: (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
  ),
  menu: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  ),
};

/* ── Petal particles ────────────────────────────────────── */
type Particle = {
  id: number;
  x: number;
  duration: number;
  delay: number;
  size: number;
  symbol: string;
};

const PETALS = ['🌸', '🌺', '💮', '🪷', '✨', '🌹'];

function spawnPetals(count = 5): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: Date.now() + i,
    x: Math.random() * 100,
    duration: 5 + Math.random() * 5,
    delay: Math.random() * 2,
    size: 0.7 + Math.random() * 0.5,
    symbol: PETALS[Math.floor(Math.random() * PETALS.length)],
  }));
}

/* ── Countdown hook ─────────────────────────────────────── */
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
  const petalTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const cd = useCountdown(wedding?.wedding_date);

  /* Periodic petal shower */
  const rainPetals = useCallback(() => {
    setPetals(p => [...p.slice(-15), ...spawnPetals(4)]);
    petalTimerRef.current = setTimeout(rainPetals, 10000 + Math.random() * 8000);
  }, []);

  useEffect(() => {
    petalTimerRef.current = setTimeout(rainPetals, 4000);
    return () => clearTimeout(petalTimerRef.current);
  }, [rainPetals]);

  /* Remove stale petals */
  useEffect(() => {
    const id = setInterval(() => setPetals(p => p.slice(-20)), 15000);
    return () => clearInterval(id);
  }, []);

  /* Close sidebar on route change */
  useEffect(() => setSidebarOpen(false), [location.pathname]);

  const currentPage = PAGES.find(p => p.path === location.pathname);
  const mobileNavPages = PAGES.slice(0, 5);

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
        <AnimatePresence>
          {petals.map(p => (
            <motion.span
              key={p.id}
              className="petal"
              initial={{ opacity: 0, y: -20, x: 0, rotate: 0 }}
              animate={{ 
                opacity: [0, 0.7, 0.7, 0],
                y: ['0vh', '105vh'],
                x: [0, 50],
                rotate: [0, 720]
              }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: p.duration, 
                delay: p.delay,
                ease: 'linear'
              }}
              style={{
                left: `${p.x}%`,
                fontSize: `${p.size}rem`,
              }}
            >
              {p.symbol}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      {/* ── App shell ── */}
      <div className="app-shell">

        {/* ── Sidebar overlay (mobile) ── */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              className="sidebar-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              style={{ opacity: 1, pointerEvents: 'auto' }}
              aria-hidden="true"
            />
          )}
        </AnimatePresence>

        {/* ── Sidebar ── */}
        <motion.aside 
          className={`sidebar${sidebarOpen ? ' open' : ''}`}
          initial={false}
          animate={sidebarOpen ? { x: 0 } : undefined}
          aria-label="Navegacao"
        >
          <div className="sidebar-content">
            {/* Brand */}
            <div className="sidebar-brand">
              <motion.div 
                className="sidebar-ring-icon"
                animate={{ y: [-3, 3, -3], rotate: [-3, 3, -3] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#c9a55a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 2px 10px rgba(201, 165, 90, 0.5))' }}>
                  <circle cx="9" cy="12" r="5"/>
                  <circle cx="15" cy="12" r="5"/>
                </svg>
              </motion.div>
              
              {wedding ? (
                <motion.div 
                  className="sidebar-names"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {wedding.name_1} & {wedding.name_2}
                </motion.div>
              ) : (
                <div className="sidebar-names">Wedding Fofinho</div>
              )}
              
              {wedding?.wedding_date && (
                <motion.div 
                  className="sidebar-date"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {new Date(wedding.wedding_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </motion.div>
              )}
              
              {cd && (
                <motion.div 
                  className="sidebar-countdown"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {[
                    { value: cd.d, label: 'dias' },
                    { value: cd.h, label: 'hrs' },
                    { value: cd.m, label: 'min' },
                    { value: cd.s, label: 'seg' },
                  ].map(({ value, label }) => (
                    <div key={label} className="cd-block">
                      <motion.div 
                        className="cd-num"
                        key={value}
                        initial={{ y: -5, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        {String(value).padStart(2, '0')}
                      </motion.div>
                      <div className="cd-label">{label}</div>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Navigation */}
            <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
              {Object.entries(grouped).map(([group, pages], gi) => (
                <motion.div 
                  key={group}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * gi }}
                >
                  <div className="nav-group-label">{groupLabels[group] ?? group}</div>
                  {pages.map((page, pi) => (
                    <motion.div
                      key={page.path}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * pi + 0.1 * gi }}
                    >
                      <NavLink
                        to={page.path}
                        className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                      >
                        <span className="nav-icon" style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {icons[page.icon]}
                        </span>
                        <span>{page.label}</span>
                      </NavLink>
                    </motion.div>
                  ))}
                </motion.div>
              ))}
            </nav>

            {/* Footer */}
            <div className="sidebar-footer">
              <motion.button
                type="button"
                className="nav-item"
                onClick={() => navigate('/settings')}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="nav-icon" style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {icons.settings}
                </span>
                <span>Configuracoes</span>
              </motion.button>
              <motion.button
                type="button"
                className="nav-item"
                onClick={() => signOut()}
                style={{ color: 'rgba(255,255,255,0.4)' }}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="nav-icon" style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {icons.logout}
                </span>
                <span>Sair</span>
              </motion.button>
            </div>
          </div>
        </motion.aside>

        {/* ── Main area ── */}
        <div className="app-main">

          {/* Topbar */}
          <motion.header 
            className="topbar"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: easings.smooth }}
          >
            <div className="topbar-left">
              {/* Hamburger (mobile only) */}
              <button
                type="button"
                className="menu-toggle"
                aria-label="Abrir menu"
                onClick={() => setSidebarOpen(o => !o)}
              >
                <span style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {icons.menu}
                </span>
              </button>

              {/* Logo / title */}
              <motion.button
                type="button"
                className="topbar-logo"
                onClick={() => navigate('/')}
                aria-label="Ir para inicio"
                whileHover={{ scale: 1.08, rotate: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <span style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  {icons.heart}
                </span>
              </motion.button>

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
              <motion.div 
                className="sync-pill live" 
                aria-live="polite"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="sync-dot" />
                <span className="sync-label">Conectado</span>
              </motion.div>
            </div>
          </motion.header>

          {/* Page content */}
          <main className="app-content" id="main-content">
            <AnimatePresence mode="wait">
              <PageTransition key={location.pathname}>
                {children}
              </PageTransition>
            </AnimatePresence>
          </main>

          {/* Bottom nav (mobile) */}
          <nav className="bottom-nav" aria-label="Navegacao mobile">
            {mobileNavPages.map((page, i) => {
              const isActive = location.pathname === page.path;
              return (
                <motion.button
                  key={page.path}
                  type="button"
                  className={`bottom-nav-item${isActive ? ' active' : ''}`}
                  onClick={() => navigate(page.path)}
                  aria-current={isActive ? 'page' : undefined}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                  whileTap={{ scale: 0.9 }}
                >
                  <span className="nav-icon" style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {icons[page.icon]}
                  </span>
                  <span className="bottom-nav-label">{page.label}</span>
                </motion.button>
              );
            })}
            <motion.button
              type="button"
              className={`bottom-nav-item${location.pathname === '/settings' ? ' active' : ''}`}
              onClick={() => navigate('/settings')}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              whileTap={{ scale: 0.9 }}
            >
              <span className="nav-icon" style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {icons.settings}
              </span>
              <span className="bottom-nav-label">Config</span>
            </motion.button>
          </nav>
        </div>
      </div>
    </>
  );
}
