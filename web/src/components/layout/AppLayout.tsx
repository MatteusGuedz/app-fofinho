import type { ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useWedding } from '../../context/WeddingContext';

const pages = [
  { path: '/', icon: '🏠', label: 'Início' },
  { path: '/checklist', icon: '✅', label: 'Lista' },
  { path: '/guests', icon: '👥', label: 'Convidados' },
  { path: '/budget', icon: '💰', label: 'Orçamento' },
  { path: '/moodboard', icon: '🖼️', label: 'Moodboard' },
  { path: '/reports', icon: '📊', label: 'Relatórios' },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { signOut } = useAuth();
  const { wedding } = useWedding();
  const location = useLocation();
  const navigate = useNavigate();

  const activeTitle =
    pages.find((p) => p.path === location.pathname)?.label ?? 'Casamento';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">💍</div>
          <div className="sidebar-title">
            <span>Wedding</span>
            <strong>Fofinho</strong>
          </div>
        </div>
        <nav className="sidebar-nav">
          {pages.map((page) => (
            <NavLink
              key={page.path}
              to={page.path}
              className={({ isActive }) =>
                'nav-item' + (isActive ? ' nav-item-active' : '')
              }
            >
              <span className="nav-icon">{page.icon}</span>
              <span className="nav-label">{page.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button
            type="button"
            className="btn-outline w-full"
            onClick={() => navigate('/settings')}
          >
            ⚙️ Configurações
          </button>
          <button
            type="button"
            className="btn-ghost w-full mt-2"
            onClick={() => signOut()}
          >
            🚪 Sair
          </button>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="topbar-logo"
              onClick={() => navigate('/')}
            >
              💒
            </button>
            <div className="topbar-title">
              {activeTitle}
              {wedding ? (
                <span style={{ marginLeft: 8, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {wedding.name_1} & {wedding.name_2}
                </span>
              ) : null}
            </div>
          </div>
          <div className="topbar-right">
            <div className="sync-indicator" aria-label="Estado de sincronização">
              <span className="sync-dot" />
              <span className="sync-text">Conectado</span>
            </div>
          </div>
        </header>

        <main className="app-content">{children}</main>

        <nav className="bottom-nav">
          {pages.map((page) => {
            const isActive = location.pathname === page.path;
            return (
              <button
                key={page.path}
                type="button"
                className={'bottom-nav-item' + (isActive ? ' active' : '')}
                onClick={() => navigate(page.path)}
              >
                <span className="bottom-nav-icon">{page.icon}</span>
                <span className="bottom-nav-label">{page.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

