import { getSupabaseClient } from '../../../lib/supabase/client'
import type { ProjectFormValues } from '../services/project-form.service'

export type ProjectRecord = {
  id: string
  name: string
  client_name: string | null
  start_date: string | null
  close_date: string | null
  progress: number | null
  is_archived: boolean | null
}

export async function findProjects(): Promise<ProjectRecord[]> {
  const { data, error } = await getSupabaseClient()
    .from('projects')
    .select('id, name, client_name, start_date, close_date, progress, is_archived')
    .order('name', { ascending: true })

  if (error) throw error
  return (data ?? []) as ProjectRecord[]
}

export async function insertProject(values: ProjectFormValues): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('projects')
    .insert({
      name: values.name.trim(),
      client_name: values.clientName.trim() || null,
      start_date: values.startDate || null,
      close_date: values.closeDate || null,
      progress: values.closeDate ? 100 : values.progress,
      is_archived: false,
    })

  if (error) throw error
}
