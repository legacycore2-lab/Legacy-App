import { CommandCenterPanels } from '../components/CommandCenterPanels'
import { DashboardHeader } from '../components/DashboardHeader'
import { KpiGrid } from '../components/KpiGrid'
import { QuickActions } from '../components/QuickActions'
import { useDashboard } from '../hooks/useDashboard'
import '../dashboard.css'

export function DashboardPage() {
  const { data, isLoading, error } = useDashboard()

  if (isLoading) {
    return (
      <section className="dashboard-details dashboard-state">جاري تجهيز مركز القيادة...</section>
    )
  }

  if (error) {
    return (
      <section className="dashboard-details dashboard-state dashboard-state--error">
        {error}
      </section>
    )
  }

  return (
    <section className="dashboard-details dashboard-command-center">
      <DashboardHeader />
      <KpiGrid kpis={data.kpis} />
      <CommandCenterPanels projects={data.projects} entries={data.entries} />
      <QuickActions actions={data.actions} />
    </section>
  )
}
