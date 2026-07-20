import { DashboardHeader } from '../components/DashboardHeader'
import { KpiGrid } from '../components/KpiGrid'
import { QuickActions } from '../components/QuickActions'
import { RecentEntries } from '../components/RecentEntries'
import { RecentProjects } from '../components/RecentProjects'
import { useDashboard } from '../hooks/useDashboard'
import '../dashboard.css'

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
