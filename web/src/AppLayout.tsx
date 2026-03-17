import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useWedding } from '../../context/WeddingContext';

/* ── SVG Icon components ─────────────────────────────────── */
const HomeIcon = () => (
  <svg className="nav-svg-icon" viewBox="0 0 24 24" fill="none">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z"/>
    <path d="M9 21V12h6v9"/>
  </svg>
);
const CheckIcon = () => (
  <svg className="nav-svg-icon" viewBox="0 0 24 24" fill="none">
    <path d="M9 11l3 3L22 4"/>
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
  </svg>
);
const UsersIcon = () => (
  <svg className="nav-svg-icon" viewBox="0 0 24 24" fill="none">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const BudgetIcon = () => (
  <svg className="nav-svg-icon" viewBox="0 0 24 24" fill="none">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);
const ImageIcon = () => (
  <svg className="nav-svg-icon" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
);
const ChartIcon = () => (
  <svg className="nav-svg-icon" viewBox="0 0 24 24" fill="none">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);
const SettingsIcon = () => (
  <svg className="nav-svg-icon" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);
const LogoutIcon = () => (
  <svg className="nav-svg-icon" viewBox="0 0 24 24" fill="none">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const MenuIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

/* Ring logo SVG */
const RingLogo = ({ size = 28, color = '#c9a55a' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <circle cx="12" cy="16" r="7.5" stroke={color} strokeWidth="1.8" fill="none"/>
    <circle cx="20" cy="16" r="7.5" stroke={color} strokeWidth="1.8" fill="none" opacity=".75"/>
    <ellipse cx="16" cy="16" rx="2" ry="7.5" stroke="none" fill="none"/>
  </svg>
);

/* ── Navigation pages ───────────────────────────────────── */
const PAGES = [
  { path: '/',          Icon: HomeIcon,   label: 'Início',        group: 'principal' },
  { path: '/checklist', Icon: CheckIcon,  label: 'Checklist',     group: 'principal' },
  { path: '/guests',    Icon: UsersIcon,  label: 'Convidados',    group: 'principal' },
  { path: '/budget',    Icon: BudgetIcon, label: 'Orçamento',     group: 'planejamento' },
  { path: '/moodboard', Icon: ImageIcon,  label: 'Moodboard',     group: 'planejamento' },
  { path: '/reports',   Icon: ChartIcon,  label: 'Relatórios',    group: 'planejamento' },
];

/* ── Petal particles — SVG hearts ──────────────────────── */
type Particle = {
  id: number;
  x: number;
  duration: number;
  delay: number;
  size: number;
  type: 'heart' | 'diamond' | 'circle';
  color: string;
};

const PETAL_COLORS = [
  'rgba(201,120,130,.55)',
  'rgba(201,165,90,.45)',
  'rgba(154,170,144,.5)',
  'rgba(233,176,184,.6)',
  'rgba(240,224,200,.55)',
];

function spawnPetals(count = 5): Particle[] {
  const types: Particle['type'][] = ['heart', 'diamond', 'circle'];
  return Array.from({ length: count }, (_, i) => ({
    id: Date.now() + i,
    x: Math.random() * 100,
    duration: 5 + Math.random() * 6,
    delay: Math.random() * 2.5,
    size: 6 + Math.random() * 8,
    type: types[Math.floor(Math.random() * types.length)],
    color: PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)],
  }));
}

function PetalSvg({ type, size, color }: { type: Particle['type']; size: number; color: string }) {
  if (type === 'heart') {
    return (
      <svg width={size} height={size} viewBox="0 0 20 18" fill={color}>
        <path d="M10 16S2 10.5 2 5.5C2 3 4 1 6.5 1c1.5 0 2.8.8 3.5 2C10.7 1.8 12 1 13.5 1 16 1 18 3 18 5.5 18 10.5 10 16 10 16z"/>
      </svg>
    );
  }
  if (type === 'diamond') {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill={color}>
        <polygon points="8,1 15,8 8,15 1,8"/>
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="7" fill={color}/>
    </svg>
  );
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
  const petalTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const cd = useCountdown(wedding?.wedding_date);

  /* Periodic petal shower */
  const rainPetals = useCallback(() => {
    setPetals(p => [...p.slice(-14), ...spawnPetals(4)]);
    petalTimerRef.current = setTimeout(rainPetals, 9000 + Math.random() * 9000);
  }, []);
  useEffect(() => {
    petalTimerRef.current = setTimeout(rainPetals, 2500);
    return () => clearTimeout(petalTimerRef.current);
  }, [rainPetals]);

  useEffect(() => {
    const id = setInterval(() => setPetals(p => p.slice(-20)), 18000);
    return () => clearInterval(id);
  }, []);

  /* Close sidebar on route change (mobile) */
  useEffect(() => setSidebarOpen(false), [location.pathname]);

  const currentPage = PAGES.find(p => p.path === location.pathname);
  const mobileNavPages = PAGES.slice(0, 5);

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
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            }}
          >
            <PetalSvg type={p.type} size={p.size} color={p.color} />
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
            <div className="sidebar-ring-icon">
              <RingLogo size={36} color="#c9a55a" />
            </div>
            {wedding ? (
              <div className="sidebar-names">{wedding.name_1} & {wedding.name_2}</div>
            ) : (
              <div className="sidebar-names">Wedding Fofinho</div>
            )}
            {wedding?.wedding_date && (
              <div className="sidebar-date">
                {new Date(wedding.wedding_date).toLocaleDateString('pt-BR', {
                  day: '2-digit', month: 'long', year: 'numeric',
                })}
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
          <nav style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
            {Object.entries(grouped).map(([group, pages]) => (
              <div key={group}>
                <div className="nav-group-label">{groupLabels[group] ?? group}</div>
                {pages.map(page => (
                  <NavLink
                    key={page.path}
                    to={page.path}
                    className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                  >
                    <page.Icon />
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
              <SettingsIcon />
              <span>Configurações</span>
            </button>
            <button
              type="button"
              className="nav-item"
              onClick={() => signOut()}
              style={{ color: 'rgba(255,255,255,.3)' }}
            >
              <LogoutIcon />
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
                <MenuIcon />
              </button>

              {/* Logo */}
              <button
                type="button"
                className="topbar-logo"
                onClick={() => navigate('/')}
                aria-label="Ir para início"
              >
                <RingLogo size={18} color="rgba(255,255,255,.85)" />
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

          {/* Page content */}
          <main className="app-content" id="main-content">
            <div className="page-enter" key={location.pathname}>
              {children}
            </div>
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
                  <page.Icon />
                  <span className="bottom-nav-label">{page.label}</span>
                </button>
              );
            })}
            <button
              type="button"
              className={`bottom-nav-item${location.pathname === '/settings' ? ' active' : ''}`}
              onClick={() => navigate('/settings')}
            >
              <SettingsIcon />
              <span className="bottom-nav-label">Config</span>
            </button>
          </nav>
        </div>
      </div>
    </>
  );
}
