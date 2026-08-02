import { getSupabaseClient } from '../../../lib/supabase/client'
import type { ContractorEntryRecord } from '../types/contractor.types'

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
 * Fetches all entries that have a non-null contractor_name.
 * No normalisation or aggregation — raw rows only.
 */
export async function findContractorEntries(): Promise<ContractorEntryRecord[]> {
  const { data, error } = await getSupabaseClient()
    .from('entries')
    .select(FIELDS)
    .not('contractor_name', 'is', null)
    .order('entry_date', { ascending: false })
    .order('entry_number', { ascending: false })

  if (error) throw error
  return (data ?? []) as unknown as ContractorEntryRecord[]
}

/**
 * Fetches contractor entries scoped to a single project.
 * No normalisation or aggregation — raw rows only.
 */
export async function findContractorEntriesByProject(projectId: string): Promise<ContractorEntryRecord[]> {
  const { data, error } = await getSupabaseClient()
    .from('entries')
    .select(FIELDS)
    .not('contractor_name', 'is', null)
    .eq('project_id', projectId)
    .order('entry_date', { ascending: false })
    .order('entry_number', { ascending: false })

  if (error) throw error
  return (data ?? []) as unknown as ContractorEntryRecord[]
}
