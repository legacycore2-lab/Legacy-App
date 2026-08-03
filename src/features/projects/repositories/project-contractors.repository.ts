import { getSupabaseClient } from '../../../lib/supabase/client'
import { fetchAllWithPagination } from '../../../shared/pagination-helpers'
import type { ProjectContractorRecord } from '../types/project-contractor.types'

const FIELDS = [
  'id',
  'contractor_name',
  'project_id',
  'entry_date',
  'entry_type',
  'amount',
  'description',
  'entry_number',
  'projects(id, name)',
].join(', ')

/**
 * Fetches contractor entries scoped to a single project.
 * Paginated with stable entry_number ASC ordering.
 * No normalisation or aggregation — raw rows only.
 */
export async function findProjectContractorEntries(projectId: string): Promise<ProjectContractorRecord[]> {
  return fetchAllWithPagination<ProjectContractorRecord>((from, to) =>
    getSupabaseClient()
      .from('entries')
      .select(FIELDS)
      .not('contractor_name', 'is', null)
      .eq('project_id', projectId)
      .order('entry_number', { ascending: true })
      .range(from, to),
  )
}
