import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { LandingPage } from './pages/auth/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { SignUpPage } from './pages/auth/SignUpPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { ChecklistPage } from './pages/checklist/ChecklistPage';
import { GuestsPage } from './pages/guests/GuestsPage';
import { BudgetPage } from './pages/budget/BudgetPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { OnboardingCreateWeddingPage } from './pages/onboarding/CreateWeddingPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { MoodboardPage } from './pages/moodboard/MoodboardPage';
import { WeddingProvider } from './context/WeddingContext';
import { useWedding } from './context/WeddingContext';
import { SUPABASE_CONFIG_OK } from './lib/env';
import { Card } from './components/ui/Card';
import { Button } from './components/ui/Button';

function ProtectedApp() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="fullscreen-center">
        <div className="heart-loader" />
        <p className="muted">Carregando seu casamento fofinho...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <WeddingProvider>
      <AppLayout>
        <ProtectedRoutes />
      </AppLayout>
    </WeddingProvider>
  );
}

function ProtectedRoutes() {
  const { wedding, loading } = useWedding();

  if (loading) {
    return (
      <div className="fullscreen-center">
        <div className="heart-loader" />
        <p className="muted">Carregando seu planejamento...</p>
      </div>
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function PublicApp() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="fullscreen-center">
        <div className="heart-loader" />
        <p className="muted">Carregando...</p>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  const { user } = useAuth();
  if (!SUPABASE_CONFIG_OK) {
    return (
      <div className="fullscreen-center" style={{ padding: 18 }}>
        <div style={{ maxWidth: 560, width: '100%' }}>
          <Card title="⚙️ Configuração necessária" subtitle="Supabase ainda não foi configurado no .env">
            <p className="muted" style={{ lineHeight: 1.55 }}>
              Para o app funcionar “só colocar as chaves e bye bye”, crie o arquivo <code>.env</code> em{' '}
              <code>web/</code> com:
            </p>
            <pre
              style={{
                margin: '10px 0 0',
                padding: 12,
                borderRadius: 14,
                background: 'rgba(0,0,0,.06)',
                overflowX: 'auto',
                fontSize: 13,
              }}
            >{`VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key`}</pre>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <Button onClick={() => location.reload()}>Já configurei, recarregar</Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }
  // Encaminha para conjunto de rotas correto
  return user ? <ProtectedApp /> : <PublicApp />;
}

