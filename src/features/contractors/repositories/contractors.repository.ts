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
 * Paginated to avoid Supabase 1000-row cap. Stable order: entry_number ASC.
 * No normalisation or aggregation — raw rows only.
 */
export async function findContractorEntries(): Promise<ContractorEntryRecord[]> {
  return fetchAllWithPagination<ContractorEntryRecord>((client, from, to) =>
    client
      .from('entries')
      .select(FIELDS)
      .not('contractor_name', 'is', null)
      .order('entry_number', { ascending: true })
      .range(from, to),
  )
}
