import { DashboardHeader } from '../features/dashboard/components/DashboardHeader'
import { KpiGrid } from '../features/dashboard/components/KpiGrid'
import { QuickActions } from '../features/dashboard/components/QuickActions'
import { RecentEntries } from '../features/dashboard/components/RecentEntries'
import { RecentProjects } from '../features/dashboard/components/RecentProjects'
import '../features/dashboard/dashboard.css'

export function DashboardPage() {
  return (
    <section className="dashboard-details">
      <DashboardHeader />
      <KpiGrid />

      <div className="dashboard-details-grid">
        <RecentProjects />
        <div className="dashboard-side-stack">
          <RecentEntries />
          <QuickActions />
        </div>
      </div>
    </section>
  )
}
