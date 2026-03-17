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
import { WeddingProvider, useWedding } from './context/WeddingContext';
import { SUPABASE_CONFIG_OK } from './lib/env';

/* ── Spectacular loader ─────────────────────────────────── */
function AppLoader({ names }: { names?: string }) {
  return (
    <div id="app-loader">
      <div className="loader-ring">
        <div/><div/><div/>
        <div>💍</div>
      </div>
      {names ? (
        <div className="loader-names">{names}</div>
      ) : (
        <div className="loader-names">Wedding Fofinho</div>
      )}
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

  if (loading || !shown) return <AppLoader names={wedding ? `${wedding.name_1} & ${wedding.name_2}` : undefined} />;

  return (
    <Routes>
      <Route path="/" element={wedding ? <DashboardPage /> : <Navigate to="/onboarding/create-wedding" replace />} />
      <Route path="/onboarding/create-wedding" element={<OnboardingCreateWeddingPage />} />
      <Route path="/checklist" element={wedding ? <ChecklistPage /> : <Navigate to="/onboarding/create-wedding" replace />} />
      <Route path="/guests"    element={wedding ? <GuestsPage />   : <Navigate to="/onboarding/create-wedding" replace />} />
      <Route path="/budget"    element={wedding ? <BudgetPage />   : <Navigate to="/onboarding/create-wedding" replace />} />
      <Route path="/moodboard" element={wedding ? <MoodboardPage />: <Navigate to="/onboarding/create-wedding" replace />} />
      <Route path="/reports"   element={wedding ? <ReportsPage />  : <Navigate to="/onboarding/create-wedding" replace />} />
      <Route path="/settings"  element={<SettingsPage />} />
      <Route path="*"          element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function ProtectedApp() {
  const { user, loading } = useAuth();

  if (loading) return <AppLoader />;
  if (!user)   return <Navigate to="/login" replace />;

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
  if (user)    return <Navigate to="/" replace />;
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
        <div style={{ fontSize: '2rem', marginBottom: 12 }}>⚙️</div>
        <div className="auth-title" style={{ fontSize: '1.6rem', marginBottom: 8 }}>Configuração necessária</div>
        <div className="auth-sub" style={{ marginBottom: 16 }}>Supabase ainda não foi configurado</div>
        <div style={{ background: 'rgba(0,0,0,.3)', borderRadius: 10, padding: 14, textAlign: 'left', marginBottom: 16 }}>
          <p style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.5)', marginBottom: 8 }}>
            Crie o arquivo <code style={{ color: 'rgba(201,168,76,.8)' }}>web/.env</code> com:
          </p>
          <pre style={{ fontSize: '.72rem', color: 'rgba(201,168,76,.8)', lineHeight: 1.6 }}>
{`VITE_SUPABASE_URL=https://...supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key`}
          </pre>
        </div>
        <button type="button" className="auth-btn" onClick={() => location.reload()}>
          Já configurei → Recarregar
        </button>
      </div>
    </div>
  );
}

/* ── Root ───────────────────────────────────────────────── */
export default function App() {
  const { user } = useAuth();
  if (!SUPABASE_CONFIG_OK) return <ConfigWarning />;
  return user ? <ProtectedApp /> : <PublicApp />;
}
