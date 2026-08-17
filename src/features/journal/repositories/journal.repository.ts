import { getSupabaseClient } from '../../../lib/supabase/client'
import { subscribeToTableChanges } from '../../../lib/supabase/realtime'
import type {
  JournalCashBankLink,
  JournalCashBankMovementPayload,
  JournalCashBankReversalPayload,
  JournalReversalContext,
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

type JournalEntriesQuery = {
  offset: number
  limit: number
  query: string
  type: 'all' | 'income' | 'expense'
  dateFrom: string
  dateTo: string
}

type JournalEntriesResult = {
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
  if (query.dateFrom) request = request.gte('entry_date', query.dateFrom)
  if (query.dateTo) request = request.lte('entry_date', query.dateTo)

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

export async function findSingleLineCashBankLink(
  entryId: string,
  paymentAccountId: string,
): Promise<JournalCashBankLink | null> {
  const client = getSupabaseClient()
  const [cashAccountResult, journalResult] = await Promise.all([
    client
      .from('cash_bank_accounts')
      .select('id')
      .eq('ledger_account_id', paymentAccountId)
      .eq('is_active', true)
      .maybeSingle(),
    client
      .from('journals')
      .select('id')
      .eq('source_type', 'single_line_entry')
      .eq('source_id', entryId)
      .maybeSingle(),
  ])

  if (cashAccountResult.error) throw cashAccountResult.error

  // Asset ledger accounts are valid journal counterparts even when they are not
  // configured as operational Cash & Banks accounts.
  const cashAccount = cashAccountResult.data as { id: string } | null
  if (!cashAccount) return null

  if (journalResult.error) throw journalResult.error
  const journal = journalResult.data as { id: string } | null
  if (!journal) throw new Error('The posted journal could not be linked to Cash & Banks.')

  return { cashBankAccountId: cashAccount.id, journalId: journal.id }
}

export async function ensureSingleLineCashBankMovement(
  payload: JournalCashBankMovementPayload,
): Promise<void> {
  const client = getSupabaseClient()
  const findExistingMovement = () =>
    client
      .from('cash_bank_transactions')
      .select('id')
      .eq('client_request_id', payload.clientRequestId)
      .maybeSingle()

  const existingResult = await findExistingMovement()
  if (existingResult.error) throw existingResult.error
  if (existingResult.data) return

  const { error } = await client.from('cash_bank_transactions').insert({
    client_request_id: payload.clientRequestId,
    transaction_date: payload.transactionDate,
    transaction_type: payload.transactionType,
    source_account_id: payload.sourceAccountId,
    destination_account_id: payload.destinationAccountId,
    amount: payload.amount,
    description: payload.description,
    reference_number: payload.referenceNumber,
    status: 'posted',
    journal_id: payload.journalId,
    posted_at: new Date().toISOString(),
  })

  if (!error) return
  if (error.code !== '23505') throw error

  // A concurrent retry can win the insert after the initial lookup. Treat the
  // unique violation as success only when that request now has a movement.
  const retryResult = await findExistingMovement()
  if (retryResult.error) throw retryResult.error
  if (!retryResult.data) throw error
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
  return subscribeToTableChanges('journal', ['entries', 'journals'], onChange)
}

export function subscribeToJournalPostingOptionChanges(onChange: () => void): () => void {
  return subscribeToTableChanges('journal-options', ['projects', 'accounts'], onChange)
}

export async function reverseJournalEntry(entryId: string): Promise<string> {
  const { data, error } = await getSupabaseClient().rpc('reverse_journal_entry', {
    p_source_entry_id: entryId,
  })

  if (error) throw error
  if (typeof data !== 'string') {
    throw new Error('Supabase did not return the reversal entry identifier.')
  }

  return data
}

export async function forceDeleteJournalEntry(entryId: string, reason: string): Promise<void> {
  const { error } = await getSupabaseClient().rpc('force_delete_single_line_entry', {
    p_entry_id: entryId,
    p_reason: reason.trim(),
  })
  if (error) throw error
}

export async function findJournalStatus(
  entryId: string,
): Promise<JournalReversalContext['originalJournalStatus']> {
  const { data, error } = await getSupabaseClient()
    .from('journals')
    .select('status')
    .eq('source_type', 'single_line_entry')
    .eq('source_id', entryId)
    .single()
  if (error) throw error
  return (data as { status: JournalReversalContext['originalJournalStatus'] }).status
}

export async function findJournalReversalContext(entryId: string): Promise<JournalReversalContext> {
  const client = getSupabaseClient()
  const journalResult = await client
    .from('journals')
    .select('id,status')
    .eq('source_type', 'single_line_entry')
    .eq('source_id', entryId)
    .single()

  if (journalResult.error) throw journalResult.error
  const journal = journalResult.data as {
    id: string
    status: JournalReversalContext['originalJournalStatus']
  }
  const [reversalResult, movementResult] = await Promise.all([
    client.from('journals').select('source_id').eq('reversal_of', journal.id).maybeSingle(),
    client
      .from('cash_bank_transactions')
      .select('id,transaction_type,source_account_id,destination_account_id,amount,reference_number')
      .eq('journal_id', journal.id)
      .maybeSingle(),
  ])
  if (reversalResult.error) throw reversalResult.error
  if (movementResult.error) throw movementResult.error

  const reversal = reversalResult.data as { source_id: string } | null
  const movement = movementResult.data as {
    id: string
    transaction_type: 'deposit' | 'withdrawal'
    source_account_id: string | null
    destination_account_id: string | null
    amount: number | string
    reference_number: string | null
  } | null
  let movementAlreadyReversed = false

  if (movement) {
    const existingResult = await client
      .from('cash_bank_transactions')
      .select('id')
      .eq('reversal_of_transaction_id', movement.id)
      .maybeSingle()
    if (existingResult.error) throw existingResult.error
    movementAlreadyReversed = Boolean(existingResult.data)
  }

  return {
    originalJournalId: journal.id,
    originalJournalStatus: journal.status,
    reversalEntryId: reversal?.source_id ?? null,
    originalMovement: movement
      ? {
          id: movement.id,
          transactionType: movement.transaction_type,
          sourceAccountId: movement.source_account_id,
          destinationAccountId: movement.destination_account_id,
          amount: Number(movement.amount),
          referenceNumber: movement.reference_number,
        }
      : null,
    movementAlreadyReversed,
  }
}

export async function findReversalJournalId(reversalEntryId: string): Promise<string> {
  const { data, error } = await getSupabaseClient()
    .from('journals')
    .select('id')
    .eq('source_type', 'single_line_entry')
    .eq('source_id', reversalEntryId)
    .single()
  if (error) throw error
  return (data as { id: string }).id
}

export async function ensureJournalCashBankReversal(payload: JournalCashBankReversalPayload): Promise<void> {
  const client = getSupabaseClient()
  const findExisting = () =>
    client
      .from('cash_bank_transactions')
      .select('id')
      .eq('reversal_of_transaction_id', payload.originalMovementId)
      .maybeSingle()
  const existing = await findExisting()
  if (existing.error) throw existing.error
  if (existing.data) return

  const { error } = await client.from('cash_bank_transactions').insert({
    client_request_id: crypto.randomUUID(),
    transaction_date: payload.transactionDate,
    transaction_type: payload.transactionType,
    source_account_id: payload.sourceAccountId,
    destination_account_id: payload.destinationAccountId,
    amount: payload.amount,
    description: 'Journal entry reversal',
    reference_number: payload.referenceNumber,
    status: 'posted',
    journal_id: payload.reversalJournalId,
    posted_at: new Date().toISOString(),
    reversal_of_transaction_id: payload.originalMovementId,
  })
  if (!error) return
  if (error.code !== '23505') throw error
  const retry = await findExisting()
  if (retry.error) throw retry.error
  if (!retry.data) throw error
}
