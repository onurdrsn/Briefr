import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { Sidebar } from './components/layout/Sidebar'
import { Login } from './pages/auth/Login'
import { Register } from './pages/auth/Register'
import { VerifyEmailScreen } from './pages/auth/VerifyEmailScreen'
import { OnboardingWizard } from './pages/onboarding/OnboardingWizard'
import { Dashboard } from './pages/dashboard/Dashboard'
import { ProjectDetail } from './pages/project/ProjectDetail'
import { MemorySearch } from './pages/memory/MemorySearch'
import { Integrations } from './pages/settings/Integrations'
import { WorkspaceSettings } from './pages/settings/WorkspaceSettings'
import { AccountSettings } from './pages/settings/AccountSettings'
import { Billing } from './pages/billing/Billing'
import { AIUsagePage } from './pages/AIUsagePage'
import { TermsOfService } from './pages/public/TermsOfService'
import { PrivacyPolicy } from './pages/public/PrivacyPolicy'
import { SupportPage } from './pages/public/SupportPage'
import { SlackLandingPage } from './pages/public/SlackLandingPage'

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user?.emailVerified === false) {
    return <VerifyEmailScreen />
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">{children}</div>
    </div>
  )
}

export function App() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/onboarding" element={<OnboardingWizard />} />
      <Route path="/tos" element={<TermsOfService />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/support" element={<SupportPage />} />
      <Route path="/superserviceco" element={<SlackLandingPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedLayout>
            <Dashboard />
          </ProtectedLayout>
        }
      />
      <Route
        path="/projects/:id"
        element={
          <ProtectedLayout>
            <ProjectDetail />
          </ProtectedLayout>
        }
      />
      <Route
        path="/projects/:id/memory"
        element={
          <ProtectedLayout>
            <MemorySearch />
          </ProtectedLayout>
        }
      />
      <Route
        path="/settings/integrations"
        element={
          <ProtectedLayout>
            <Integrations />
          </ProtectedLayout>
        }
      />
      <Route
        path="/settings/workspace"
        element={
          <ProtectedLayout>
            <WorkspaceSettings />
          </ProtectedLayout>
        }
      />
      <Route
        path="/settings/account"
        element={
          <ProtectedLayout>
            <AccountSettings />
          </ProtectedLayout>
        }
      />
      <Route
        path="/billing"
        element={
          <ProtectedLayout>
            <Billing />
          </ProtectedLayout>
        }
      />
      <Route
        path="/usage"
        element={
          <ProtectedLayout>
            <AIUsagePage />
          </ProtectedLayout>
        }
      />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
