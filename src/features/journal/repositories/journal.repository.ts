import { getSupabaseClient } from '../../../shared/supabase/client'
import { subscribeToTableChanges } from '../../../shared/supabase/realtime'
import type { SingleLineJournalInput } from '../types/journal-entry.types'
import type {
  JournalDetailsRecord,
  JournalEntryRecord,
  JournalPageResult,
  JournalPostingOptions,
  PostingAccountRecord,
  PostingProjectRecord,
} from '../types/journal.repository.types'

export async function findJournalEntries(
  query: string,
  type: string,
  page: number,
  pageSize: number,
  projectId?: string,
): Promise<JournalPageResult> {
  const client = getSupabaseClient()
  const offset = (page - 1) * pageSize

  let request = client
    .from('entries')
    .select(
      'id, entry_number, entry_date, entry_type, category, description, contractor_name, payment_method, amount, project_id, projects(name)',
      { count: 'exact' },
    )
    .order('entry_date', { ascending: false })
    .order('entry_number', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (projectId) request = request.eq('project_id', projectId)
  if (type && type !== 'all') request = request.eq('entry_type', type)
  if (query) {
    const normalized = query.trim().replaceAll(',', ' ')
    request = request.or(
      `description.ilike.%${normalized}%,category.ilike.%${normalized}%,contractor_name.ilike.%${normalized}%,payment_method.ilike.%${normalized}%,entry_code.ilike.%${normalized}%`,
    )
  }

  const { data, error, count } = await request
  if (error) throw error

  return {
    records: (data ?? []) as JournalEntryRecord[],
    count: count ?? 0,
  }
}

export async function findJournalDetails(entryId: string): Promise<JournalDetailsRecord | null> {
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('journals')
    .select(
      'id, journal_number, journal_date, description, status, project_id, projects(name), journal_lines(id, line_number, account_id, debit, credit, accounts(code, name_ar))',
    )
    .eq('source_type', 'single_line_entry')
    .eq('source_id', entryId)
    .maybeSingle()

  if (error) throw error
  return data as JournalDetailsRecord | null
}

export async function postSingleLineEntry(input: SingleLineJournalInput): Promise<string> {
  const { data, error } = await getSupabaseClient().rpc('post_single_line_entry', {
    p_entry_date: input.entryDate,
    p_project_id: input.projectId,
    p_entry_type: input.type,
    p_category_account_id: input.categoryAccountId,
    p_description: input.description.trim(),
    p_contractor_name: input.contractor.trim(),
    p_payment_account_id: input.paymentAccountId,
    p_amount: Number(input.amount),
  })
  if (error) throw error
  return data as string
}

export async function findJournalPostingOptions(): Promise<JournalPostingOptions> {
  const client = getSupabaseClient()
  const [projectsResult, accountsResult] = await Promise.all([
    client.from('projects').select('id, name').order('name'),
    client.from('accounts').select('id, code, name_ar, account_type').eq('is_active', true).order('code'),
  ])

  if (projectsResult.error) throw projectsResult.error
  if (accountsResult.error) throw accountsResult.error

  const projects = (projectsResult.data ?? []) as PostingProjectRecord[]
  const accounts = (accountsResult.data ?? []) as PostingAccountRecord[]

  return {
    projects,
    accounts: accounts.map((account) => ({
      id: account.id,
      code: account.code,
      name: account.name_ar,
      accountType: account.account_type,
    })),
  }
}

export function subscribeToJournalChanges(onChange: () => void): () => void {
  return subscribeToTableChanges('journal', ['entries'], onChange)
}

export function subscribeToJournalPostingOptionChanges(onChange: () => void): () => void {
  return subscribeToTableChanges('journal-options', ['projects', 'accounts'], onChange)
}

export async function deleteJournalEntry(entryId: string): Promise<void> {
  const { error } = await getSupabaseClient().rpc('delete_single_line_entry', {
    p_entry_id: entryId,
  })
  if (error) throw error
}

export async function forceDeleteJournalEntry(entryId: string, reason: string): Promise<void> {
  const { error } = await getSupabaseClient().rpc('force_delete_single_line_entry', {
    p_entry_id: entryId,
    p_reason: reason,
  })
  if (error) throw error
}

export async function updateJournalEntry(entryId: string, input: SingleLineJournalInput): Promise<void> {
  const { error } = await getSupabaseClient().rpc('update_single_line_entry', {
    p_entry_id: entryId,
    p_entry_date: input.entryDate,
    p_project_id: input.projectId,
    p_entry_type: input.type,
    p_category_account_id: input.categoryAccountId,
    p_description: input.description.trim(),
    p_contractor_name: input.contractor.trim(),
    p_payment_account_id: input.paymentAccountId,
    p_amount: Number(input.amount),
  })
  if (error) throw error
}
