import { DashboardHeader } from '../features/dashboard/components/DashboardHeader'
import { KpiGrid } from '../features/dashboard/components/KpiGrid'
import { QuickActions } from '../features/dashboard/components/QuickActions'
import { RecentEntries } from '../features/dashboard/components/RecentEntries'
import { RecentProjects } from '../features/dashboard/components/RecentProjects'
import { useDashboard } from '../features/dashboard/hooks/useDashboard'
import '../features/dashboard/dashboard.css'

export function DashboardPage() {
  const { data, isLoading, error } = useDashboard()
  if (isLoading) return <section className="dashboard-details">جاري تحميل لوحة التحكم...</section>
  if (error) return <section className="dashboard-details">{error}</section>
  return (
    <section className="dashboard-details">
      <DashboardHeader />
      <KpiGrid kpis={data.kpis} />

      <div className="dashboard-primary-grid">
        <RecentProjects projects={data.projects} />
        <RecentEntries entries={data.entries} />
      </div>

      <QuickActions actions={data.actions} />
    </section>
  )
}
