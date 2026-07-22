import { getSupabaseClient } from '../../../lib/supabase/client'
import { subscribeToTableChanges } from '../../../lib/supabase/realtime'
import type {
  JournalPostingAccountOption,
  JournalPostingOptions,
  JournalPostingProjectOption,
  SingleLineJournalInput,
} from '../types/journal-entry.types'

export type JournalEntryRecord = {
  id: string
  seq: number | null
  entry_date: string
  type: string
  category: string | null
  description: string | null
  contractor: string | null
  payment_method: string | null
  amount: number | string
  project: { name: string } | { name: string }[] | null
}

export type JournalEntriesQuery = {
  offset: number
  limit: number
  query: string
  type: 'all' | 'income' | 'expense'
}

export type JournalEntriesResult = {
  records: JournalEntryRecord[]
  totalCount: number
}

export type JournalDetailsRecord = {
  id: string
  journal_number: number | string
  journal_date: string
  description: string
  status: string
  created_at: string
  posted_at: string | null
  project: { name: string } | { name: string }[] | null
  lines:
    | {
        id: string
        line_number: number
        description: string | null
        debit: number | string
        credit: number | string
        account: { code: string; name_ar: string } | { code: string; name_ar: string }[] | null
      }[]
    | null
}

type PostingProjectRecord = JournalPostingProjectOption

type PostingAccountRecord = {
  id: string
  code: string
  name_ar: string
  account_type: JournalPostingAccountOption['accountType']
}

function normalizeSearch(value: string): string {
  return value
    .replace(/[(),%_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function findJournalEntries(query: JournalEntriesQuery): Promise<JournalEntriesResult> {
  let request = getSupabaseClient()
    .from('entries')
    .select(
      `
      id,
      seq:entry_number,
      entry_date,
      type:entry_type,
      category,
      description,
      contractor:contractor_name,
      payment_method,
      amount,
        project:projects(name)
      `,
      { count: 'exact' },
    )
    .order('entry_date', { ascending: false })
    .order('entry_number', { ascending: false })
    .range(query.offset, query.offset + query.limit - 1)

  if (query.type !== 'all') request = request.eq('entry_type', query.type)

  const search = normalizeSearch(query.query)
  if (search) {
    const pattern = `%${search}%`
    request = request.or(
      `description.ilike.${pattern},category.ilike.${pattern},contractor_name.ilike.${pattern},payment_method.ilike.${pattern},entry_code.ilike.${pattern}`,
    )
  }

  const { data, error, count } = await request

  if (error) throw error
  return {
    records: (data ?? []) as JournalEntryRecord[],
    totalCount: count ?? 0,
  }
}

export async function findJournalDetails(entryId: string): Promise<JournalDetailsRecord | null> {
  const { data, error } = await getSupabaseClient()
    .from('journals')
    .select(
      `
      id,
      journal_number,
      journal_date,
      description,
      status,
      created_at,
      posted_at,
      project:projects(name),
      lines:journal_lines(
        id,
        line_number,
        description,
        debit,
        credit,
        account:accounts(code,name_ar)
      )
      `,
    )
    .eq('source_type', 'single_line_entry')
    .eq('source_id', entryId)
    .order('line_number', { referencedTable: 'journal_lines', ascending: true })
    .maybeSingle()

  if (error) throw error
  return data as unknown as JournalDetailsRecord | null
}

export async function postSingleLineEntry(input: SingleLineJournalInput): Promise<string> {
  const { data, error } = await getSupabaseClient().rpc('post_single_line_entry', {
    p_client_request_id: input.requestId,
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
  if (typeof data !== 'string') {
    throw new Error('Supabase did not return the posted entry identifier.')
  }

  return data
}

export async function findJournalPostingOptions(): Promise<JournalPostingOptions> {
  const client = getSupabaseClient()
  const [projectsResult, accountsResult] = await Promise.all([
    client.from('projects').select('id,name').eq('is_archived', false).order('name'),
    client
      .from('accounts')
      .select('id,code,name_ar,account_type')
      .eq('is_active', true)
      .eq('is_postable', true)
      .in('account_type', ['asset', 'revenue', 'expense'])
      .order('code'),
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
