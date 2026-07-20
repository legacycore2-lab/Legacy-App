import type { DashboardEntry, DashboardProject } from '../types/dashboard.types'
import { CriticalProjectsPanel } from './CriticalProjectsPanel'
import { DailyPrioritiesPanel } from './DailyPrioritiesPanel'
import { RecentActivityPanel } from './RecentActivityPanel'

type Props = {
  projects: DashboardProject[]
  entries: DashboardEntry[]
}

export function CommandCenterPanels({ projects, entries }: Props) {
  return (
    <div className="command-center-grid">
      <CriticalProjectsPanel projects={projects} />
      <RecentActivityPanel entries={entries} />
      <DailyPrioritiesPanel />
    </div>
  )
}
