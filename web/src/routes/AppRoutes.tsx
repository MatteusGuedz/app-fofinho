import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/layout/AppLayout';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { ChecklistPage } from '../pages/checklist/ChecklistPage';
import { GuestsPage } from '../pages/guests/GuestsPage';
import { BudgetPage } from '../pages/budget/BudgetPage';
import { SettingsPage } from '../pages/settings/SettingsPage';
import { OnboardingCreateWeddingPage } from '../pages/onboarding/CreateWeddingPage';
import { ReportsPage } from '../pages/reports/ReportsPage';

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
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<ProtectedApp />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/onboarding/create-wedding" element={<OnboardingCreateWeddingPage />} />
        <Route path="/checklist" element={<ChecklistPage />} />
        <Route path="/guests" element={<GuestsPage />} />
        <Route path="/budget" element={<BudgetPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}

