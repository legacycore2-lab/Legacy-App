import { getSupabaseClient } from '../../../lib/supabase/client'

export type DashboardKpiEntryRecord = {
  type?: 'i' | 'e' | string | null
  amount?: number | string | null
}

type DashboardKpiProjectRecord = {
  is_archived?: boolean | null
}

export type DashboardKpiSource = {
  entries: DashboardKpiEntryRecord[]
  activeProjectsCount: number
}

export async function findDashboardKpiSource(): Promise<DashboardKpiSource> {
  const supabase = getSupabaseClient()
  const [entriesResult, projectsResult] = await Promise.all([
    supabase.from('entries').select('*'),
    supabase.from('projects').select('*'),
  ])

  if (entriesResult.error) throw entriesResult.error
  if (projectsResult.error) throw projectsResult.error

  const projects = (projectsResult.data ?? []) as DashboardKpiProjectRecord[]

  return {
    entries: (entriesResult.data ?? []) as DashboardKpiEntryRecord[],
    activeProjectsCount: projects.filter((project) => project.is_archived !== true).length,
  }
}
