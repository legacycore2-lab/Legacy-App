import { getSupabaseClient } from '../../../lib/supabase/client'

export type ProjectRecord = {
  id: string
  name: string
  start_date: string | null
  close_date: string | null
  is_archived: boolean | null
}

export async function findProjects(): Promise<ProjectRecord[]> {
  const { data, error } = await getSupabaseClient()
    .from('projects')
    .select('id, name, start_date, close_date, is_archived')
    .order('name', { ascending: true })

  if (error) throw error
  return (data ?? []) as ProjectRecord[]
}
