import { getSupabaseClient } from '../../../lib/supabase/client'

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

export async function findJournalEntries(): Promise<JournalEntryRecord[]> {
  const { data, error } = await getSupabaseClient()
    .from('entries')
    .select(
      `
      id,
      seq,
      entry_date,
      type,
      category,
      description,
      contractor,
      payment_method,
      amount,
      project:projects(name)
    `,
    )
    .order('entry_date', { ascending: false })
    .order('seq', { ascending: false })

  if (error) throw error
  return (data ?? []) as JournalEntryRecord[]
}
