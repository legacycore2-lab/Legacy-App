import { Route, Routes } from 'react-router-dom'
import {
  ProtectedRoute,
  PublicOnlyRoute,
  RequireRouteAccess,
} from '../features/auth/components/ProtectedRoute'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { DashboardPage } from '../features/dashboard/pages/DashboardPage'
import { JournalPage } from '../features/journal/pages/JournalPage'
import { ProjectsPage } from '../features/projects/pages/ProjectsPage'
import { PlaceholderPage } from '../pages/PlaceholderPage'
import { AppLayoutRoute } from './AppLayoutRoute'

function secured(path: string, page: React.ReactNode) {
  return <RequireRouteAccess path={path}>{page}</RequireRouteAccess>
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayoutRoute />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/projects" element={secured('/projects', <ProjectsPage />)} />
          <Route path="/journal" element={secured('/journal', <JournalPage />)} />
          <Route
            path="/banks"
            element={secured(
              '/banks',
              <PlaceholderPage
                title="الخزنة والبنوك"
                description="إدارة الحسابات والتحويلات والحركات البنكية."
              />,
            )}
          />
          <Route
            path="/advances"
            element={secured(
              '/advances',
              <PlaceholderPage title="العهد" description="متابعة العهد المفتوحة والمصروف والمتبقي." />,
            )}
          />
          <Route
            path="/reports"
            element={secured(
              '/reports',
              <PlaceholderPage
                title="التقارير"
                description="التقارير المالية وتقارير المشاريع والمقاولين."
              />,
            )}
          />
          <Route
            path="/users"
            element={secured(
              '/users',
              <PlaceholderPage title="المستخدمون" description="إدارة المستخدمين والصلاحيات." />,
            )}
          />
          <Route
            path="/settings"
            element={secured(
              '/settings',
              <PlaceholderPage title="الإعدادات" description="إعدادات النظام والهوية والتكاملات." />,
            )}
          />
        </Route>
      </Route>
    </Routes>
  )
}
