import type { DashboardAlert, DashboardEntry, DashboardProject } from '../types/dashboard.types'
import { CriticalProjectsPanel } from './CriticalProjectsPanel'
import { DailyPrioritiesPanel } from './DailyPrioritiesPanel'
import { RecentActivityPanel } from './RecentActivityPanel'

type Props = {
  projects: DashboardProject[]
  entries: DashboardEntry[]
  alerts: DashboardAlert[]
}

export function CommandCenterPanels({ projects, entries, alerts }: Props) {
  return (
    <div className="command-center-grid">
      <CriticalProjectsPanel projects={projects} />
      <RecentActivityPanel entries={entries} />
      <DailyPrioritiesPanel alerts={alerts} />
    </div>
  )
}
