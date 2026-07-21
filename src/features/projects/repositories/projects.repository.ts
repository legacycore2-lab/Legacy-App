import { getSupabaseClient } from '../../../lib/supabase/client'
import type { ProjectRecord } from '../types/project.types'

export async function findProjects(): Promise<ProjectRecord[]> {
  const { data, error } = await getSupabaseClient().from('projects').select('*')

  if (error) throw error

  return (data ?? []) as ProjectRecord[]
}
