import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { LandingPage, LoginPage, SignUpPage } from './pages/auth/AuthPages';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { ChecklistPage } from './pages/checklist/ChecklistPage';
import { GuestsPage } from './pages/guests/GuestsPage';
import { BudgetPage } from './pages/budget/BudgetPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { OnboardingCreateWeddingPage } from './pages/onboarding/CreateWeddingPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { MoodboardPage } from './pages/moodboard/MoodboardPage';
import { InvitePage } from './pages/invite/InvitePage';
import { DiagnosticoPage } from './pages/admin/DiagnosticoPage';
import { WeddingProvider, useWedding } from './context/WeddingContext';
import { SUPABASE_CONFIG_OK } from './lib/env';

/* ── Ring SVG for loader ────────────────────────────────── */
function LoaderRingSvg() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
      <circle cx="11" cy="16" r="7" stroke="rgba(201,165,90,.9)" strokeWidth="1.8" fill="none"/>
      <circle cx="21" cy="16" r="7" stroke="rgba(201,120,130,.65)" strokeWidth="1.8" fill="none"/>
    </svg>
  );
}

/* ── Elegant loader ─────────────────────────────────────── */
function AppLoader({ names }: { names?: string }) {
  return (
    <div id="app-loader">
      <div className="loader-ring">
        <div/><div/><div/>
        <div><LoaderRingSvg /></div>
      </div>
      <div className="loader-names">
        {names ?? 'Wedding Fofinho'}
      </div>
      <div className="loader-sub">preparando seu momento especial</div>
      <div className="loader-dots">
        <div className="loader-dot"/>
        <div className="loader-dot"/>
        <div className="loader-dot"/>
      </div>
    </div>
  );
}

/* ── Protected routes ───────────────────────────────────── */
function ProtectedRoutes() {
  const { wedding, loading } = useWedding();
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!loading) {
      const id = setTimeout(() => setShown(true), 300);
      return () => clearTimeout(id);
    }
  }, [loading]);

  if (loading || !shown) {
    return (
      <AppLoader
        names={wedding ? `${wedding.name_1} & ${wedding.name_2}` : undefined}
      />
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={wedding ? <DashboardPage /> : <Navigate to="/onboarding/create-wedding" replace />}
      />
      <Route path="/onboarding/create-wedding" element={<OnboardingCreateWeddingPage />} />
      <Route
        path="/checklist"
        element={wedding ? <ChecklistPage /> : <Navigate to="/onboarding/create-wedding" replace />}
      />
      <Route
        path="/guests"
        element={wedding ? <GuestsPage /> : <Navigate to="/onboarding/create-wedding" replace />}
      />
      <Route
        path="/budget"
        element={wedding ? <BudgetPage /> : <Navigate to="/onboarding/create-wedding" replace />}
      />
      <Route
        path="/moodboard"
        element={wedding ? <MoodboardPage /> : <Navigate to="/onboarding/create-wedding" replace />}
      />
      <Route
        path="/reports"
        element={wedding ? <ReportsPage /> : <Navigate to="/onboarding/create-wedding" replace />}
      />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/admin/diagnostico" element={<DiagnosticoPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function ProtectedApp() {
  const { user, loading } = useAuth();
  if (loading) return <AppLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <WeddingProvider>
      <AppLayout>
        <ProtectedRoutes />
      </AppLayout>
    </WeddingProvider>
  );
}

function PublicApp() {
  const { user, loading } = useAuth();
  if (loading) return <AppLoader />;
  if (user) return <Navigate to="/" replace />;
  return (
    <Routes>
      <Route path="/"       element={<LandingPage />} />
      <Route path="/login"  element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="*"       element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/* ── Supabase config warning ────────────────────────────── */
function ConfigWarning() {
  return (
    <div className="auth-screen">
      <div className="auth-box" style={{ textAlign: 'center' }}>
        {/* Settings icon */}
        <div style={{
          width: 56, height: 56,
          margin: '0 auto 16px',
          borderRadius: '50%',
          border: '1px solid rgba(201,165,90,.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
            stroke="rgba(201,165,90,.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </div>
        <div className="auth-title" style={{ fontSize: '1.7rem', marginBottom: 8 }}>
          Configuração
        </div>
        <div className="auth-sub" style={{ marginBottom: 18 }}>
          Supabase não configurado
        </div>
        <div style={{
          background: 'rgba(0,0,0,.35)',
          borderRadius: 12,
          padding: '14px 16px',
          textAlign: 'left',
          marginBottom: 18,
        }}>
          <p style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.35)', marginBottom: 8 }}>
            Crie o arquivo{' '}
            <code style={{ color: 'rgba(201,165,90,.7)', fontFamily: 'monospace' }}>
              web/.env
            </code>{' '}
            com:
          </p>
          <pre style={{ fontSize: '.68rem', color: 'rgba(201,165,90,.7)', lineHeight: 1.7, fontFamily: 'monospace' }}>
{`VITE_SUPABASE_URL=https://...supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key`}
          </pre>
        </div>
        <button type="button" className="auth-btn" onClick={() => location.reload()}>
          Já configurei — Recarregar
        </button>
      </div>
    </div>
  );
}

/* ── Root ───────────────────────────────────────────────── */
export default function App() {
  const { user, loading } = useAuth();
  if (!SUPABASE_CONFIG_OK) return <ConfigWarning />;
  return (
    <Routes>
      <Route path="/invite/:token" element={<InvitePage />} />
      <Route path="*" element={loading ? <AppLoader /> : user ? <ProtectedApp /> : <PublicApp />} />
    </Routes>
  );
}
