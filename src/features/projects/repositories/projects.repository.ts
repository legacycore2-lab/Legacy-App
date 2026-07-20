import { getSupabaseClient } from '../../../lib/supabase/client'
import type { ProjectRecord } from '../types/project.types'

function normalizeSearch(value: string): string {
  return value
    .replace(/[(),%_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export type ProjectsQuery = {
  query: string
  status: 'all' | 'active' | 'completed' | 'paused' | 'archived'
}

export async function findProjects(params: ProjectsQuery): Promise<ProjectRecord[]> {
  let request = getSupabaseClient()
    .from('projects')
    .select(
      `
      id,
      code,
      name,
      client_name,
      location,
      manager,
      status,
      progress,
      contract_value,
      received,
      spent,
      start_date,
      end_date,
      notes
      `,
    )
    .order('created_at', { ascending: false })

  if (params.status !== 'all') {
    request = request.eq('status', params.status)
  }

  const search = normalizeSearch(params.query)
  if (search) {
    const pattern = `%${search}%`
    request = request.or(
      `name.ilike.${pattern},client_name.ilike.${pattern},location.ilike.${pattern},manager.ilike.${pattern},code.ilike.${pattern}`,
    )
  }

  const { data, error } = await request

  if (error) throw error
  return (data ?? []) as ProjectRecord[]
}
