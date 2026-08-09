import { AppError } from '../../../shared/errors/app-error'
import { getSupabaseClient } from '../../../lib/supabase/client'
import type { AdvanceRow } from '../types/advances.types'

const ADVANCE_FIELDS =
  'id,advance_number,holder_name,holder_title,project_names,issue_date,due_date,purpose,amount,spent_amount,returned_amount'

export async function findAdvances(): Promise<AdvanceRow[]> {
  const { data, error } = await getSupabaseClient()
    .from('advances_overview')
    .select(ADVANCE_FIELDS)
    .order('issue_date', { ascending: false })

  if (error) throw new AppError(error.message, 'ADVANCES_FETCH_FAILED')
  return (data as AdvanceRow[] | null) ?? []
}
