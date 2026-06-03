
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { LoginPage } from "./pages/LoginPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { SignupPage } from "./pages/SignupPage";
import { DashboardPage } from "./pages/DashboardPage";
import { HistoryPage } from "./pages/HistoryPage";
import { AlertsPage } from "./pages/AlertsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { AIAnalysisPage } from "./pages/AIAnalysisPage";
import { VitalBPPage } from "./pages/vitals/VitalBPPage";
import { VitalHeartRatePage } from "./pages/vitals/VitalHeartRatePage";
import { VitalOxygenPage } from "./pages/vitals/VitalOxygenPage";
import { VitalGlucosePage } from "./pages/vitals/VitalGlucosePage";
import { LoadingSpinner } from "./components/ui/LoadingSpinner";
import { useApp } from "./contexts/AppContext";
import { getAuthToken } from "./lib/api";

function RequireAuth({ children }: { children: React.ReactNode }) {
  return getAuthToken() ? <>{children}</> : <Navigate to="/login" replace />;
}


function RequireGuest({ children }: { children: React.ReactNode }) {
  return getAuthToken() ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

function AppPages() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/ai-analysis" element={<AIAnalysisPage />} />
        <Route path="/vitals/bp" element={<VitalBPPage />} />
        <Route path="/vitals/heart-rate" element={<VitalHeartRatePage />} />
        <Route path="/vitals/oxygen" element={<VitalOxygenPage />} />
        <Route path="/vitals/glucose" element={<VitalGlucosePage />} />
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppLayout>
  );
}

function AppInner() {
  const { isLoading } = useApp();

  if (isLoading) {
    return <LoadingSpinner fullscreen />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<RequireGuest><LoginPage /></RequireGuest>} />
        <Route path="/reset-password" element={<RequireGuest><ForgotPasswordPage /></RequireGuest>} />
        <Route path="/signup" element={<RequireGuest><SignupPage /></RequireGuest>} />
        
        <Route path="/*" element={<RequireAuth><AppPages /></RequireAuth>} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return <AppInner />;
}