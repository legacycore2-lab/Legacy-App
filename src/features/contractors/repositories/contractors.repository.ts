import { getSupabaseClient } from '../../../lib/supabase/client'
import { fetchAllWithPagination } from '../../../shared/pagination-helpers'
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
 * Paginated to avoid Supabase 1000-row cap. Stable order: newest first.
 * No normalisation or aggregation — raw rows only.
 */
export async function findContractorEntries(): Promise<ContractorEntryRecord[]> {
  return fetchAllWithPagination<ContractorEntryRecord>((from, to) =>
    getSupabaseClient()
      .from('entries')
      .select(FIELDS)
      .not('contractor_name', 'is', null)
      .order('entry_date', { ascending: false })
      .order('entry_number', { ascending: false })
      .range(from, to),
  )
}
