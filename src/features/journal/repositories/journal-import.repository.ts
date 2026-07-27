import { getSupabaseClient } from '../../../lib/supabase/client'

export type AtomicJournalImportRow = {
  requestId: string
  excelRow: number
  entryDate: string
  projectId: string
  type: 'income' | 'expense'
  categoryAccountId: string
  description: string
  contractor: string
  paymentAccountId: string
  amount: number
  notes: string
}

export async function importJournalEntriesAtomic(
  rows: AtomicJournalImportRow[],
): Promise<string[]> {
  const { data, error } = await getSupabaseClient().rpc('import_journal_entries_atomic', {
    p_rows: rows.map((row) => ({
      request_id: row.requestId,
      excel_row: row.excelRow,
      entry_date: row.entryDate,
      project_id: row.projectId,
      entry_type: row.type,
      category_account_id: row.categoryAccountId,
      description: row.description,
      contractor_name: row.contractor,
      payment_account_id: row.paymentAccountId,
      amount: row.amount,
      notes: row.notes,
    })),
  })

  if (error) throw error
  if (!Array.isArray(data) || !data.every((value) => typeof value === 'string')) {
    throw new Error('Supabase did not return the imported entry identifiers.')
  }

  return data
}
