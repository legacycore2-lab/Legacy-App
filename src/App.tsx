import { Route, Routes } from 'react-router-dom'
import { AppShell } from './app/AppShell'
import { ProtectedRoute, PublicOnlyRoute, RequireRole } from './features/auth/components/ProtectedRoute'
import { LoginPage } from './features/auth/pages/LoginPage'
import { DashboardPage } from './features/dashboard/pages/DashboardPage'
import { JournalPage } from './features/journal/pages/JournalPage'
import { ProjectsPage } from './features/projects/pages/ProjectsPage'
import { PlaceholderPage } from './pages/PlaceholderPage'

export default function App() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route
          path="/*"
          element={
            <AppShell>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/journal" element={<JournalPage />} />
                <Route
                  path="/banks"
                  element={
                    <PlaceholderPage
                      title="الخزنة والبنوك"
                      description="إدارة الحسابات والتحويلات والحركات البنكية."
                    />
                  }
                />
                <Route
                  path="/advances"
                  element={
                    <PlaceholderPage title="العهد" description="متابعة العهد المفتوحة والمصروف والمتبقي." />
                  }
                />
                <Route
                  path="/reports"
                  element={
                    <PlaceholderPage
                      title="التقارير"
                      description="التقارير المالية وتقارير المشاريع والمقاولين."
                    />
                  }
                />
                <Route
                  path="/users"
                  element={
                    <RequireRole allowed={['admin']}>
                      <PlaceholderPage title="المستخدمون" description="إدارة المستخدمين والصلاحيات." />
                    </RequireRole>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <RequireRole allowed={['admin']}>
                      <PlaceholderPage title="الإعدادات" description="إعدادات النظام والهوية والتكاملات." />
                    </RequireRole>
                  }
                />
              </Routes>
            </AppShell>
          }
        />
      </Route>
    </Routes>
  )
}
