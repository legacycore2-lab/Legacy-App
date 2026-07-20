import { getSupabaseClient } from '../../../lib/supabase/client'
import type {
  DashboardEntryRecord,
  DashboardProjectRecord,
  DashboardSummaryRecord,
} from '../types/dashboard.types'

export type DashboardRawData = {
  projects: DashboardProjectRecord[]
  entries: DashboardEntryRecord[]
  summary: DashboardSummaryRecord
}

export async function findDashboardData(): Promise<DashboardRawData> {
  const client = getSupabaseClient()

  const [projectsRes, entriesRes, incomeRes, expenseRes] = await Promise.all([
    // آخر 5 مشاريع نشطة
    client
      .from('projects')
      .select('id, name, client_name, status, progress, received, spent')
      .in('status', ['active', 'paused'])
      .order('created_at', { ascending: false })
      .limit(5),

    // آخر 5 قيود
    client
      .from('entries')
      .select(
        `
        id,
        entry_number,
        entry_date,
        entry_type,
        description,
        amount,
        project:projects(name)
        `,
      )
      .order('entry_date', { ascending: false })
      .order('entry_number', { ascending: false })
      .limit(5),

    // إجمالي الإيرادات
    client
      .from('entries')
      .select('amount')
      .eq('entry_type', 'income'),

    // إجمالي المصروفات
    client
      .from('entries')
      .select('amount')
      .eq('entry_type', 'expense'),
  ])

  if (projectsRes.error) throw projectsRes.error
  if (entriesRes.error)  throw entriesRes.error
  if (incomeRes.error)   throw incomeRes.error
  if (expenseRes.error)  throw expenseRes.error

  const totalIncome  = (incomeRes.data  ?? []).reduce((s, r) => s + Number(r.amount), 0)
  const totalExpense = (expenseRes.data ?? []).reduce((s, r) => s + Number(r.amount), 0)

  return {
    projects: (projectsRes.data ?? []) as DashboardProjectRecord[],
    entries:  (entriesRes.data  ?? []) as DashboardEntryRecord[],
    summary: {
      total_income:         totalIncome,
      total_expense:        totalExpense,
      project_count:        projectsRes.data?.length ?? 0,
      active_project_count: (projectsRes.data ?? []).filter((p) => p.status === 'active').length,
    },
  }
}
