import { Route, Routes } from 'react-router-dom'
import { AccountsPage } from '../features/accounts/pages/AccountsPage'
import { AdvancesPage } from '../features/advances/pages/AdvancesPage'
import {
  ProtectedRoute,
  PublicOnlyRoute,
  RequireRouteAccess,
} from '../features/auth/components/ProtectedRoute'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { CashBanksPage } from '../features/cash-banks/pages/CashBanksPage'
import { DashboardPage } from '../features/dashboard/pages/DashboardPage'
import { JournalPage } from '../features/journal/pages/JournalPage'
import { ProjectDetailsPage } from '../features/projects/pages/ProjectDetailsPage'
import { ContractorsPage } from '../features/contractors/pages/ContractorsPage'
import { ProjectsPage } from '../features/projects/pages/ProjectsPage'
import { ReportsPage } from '../features/reports/pages/ReportsPage'
import { UsersPage } from '../features/users/pages/UsersPage'
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
          <Route path="/projects/:id" element={secured('/projects', <ProjectDetailsPage />)} />
          <Route path="/journal" element={secured('/journal', <JournalPage />)} />
          <Route path="/accounts" element={secured('/accounts', <AccountsPage />)} />
          <Route path="/banks" element={secured('/banks', <CashBanksPage />)} />
          <Route path="/advances" element={secured('/advances', <AdvancesPage />)} />
          <Route path="/contractors" element={secured('/contractors', <ContractorsPage />)} />
          <Route path="/reports" element={secured('/reports', <ReportsPage />)} />
          <Route path="/users" element={secured('/users', <UsersPage />)} />
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
