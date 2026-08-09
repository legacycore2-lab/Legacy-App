import { findAdvances } from '../repositories/advances.repository'
import type {
  Advance,
  AdvanceFilters,
  AdvanceRow,
  AdvancesSummary,
  AdvancesViewModel,
} from '../types/advances.types'

const normalized = (value: string) => value.trim().toLocaleLowerCase('ar-EG')

export function mapAdvance(row: AdvanceRow, today = new Date()): Advance {
  const amount = Number(row.amount)
  const spent = Number(row.spent_amount)
  const returned = Number(row.returned_amount)
  const remaining = Math.max(0, amount - spent - returned)
  const settled = remaining === 0
  const overdue = !settled && Boolean(row.due_date) && new Date(`${row.due_date}T23:59:59`) < today

  return {
    id: row.id,
    number: `ADV-${String(row.advance_number).padStart(4, '0')}`,
    holderName: row.holder_name,
    holderTitle: row.holder_title ?? 'موظف',
    projectNames: row.project_names?.length ? row.project_names : ['بدون مشروع'],
    issueDate: row.issue_date,
    dueDate: row.due_date ?? '',
    purpose: row.purpose,
    amount,
    spent,
    returned,
    remaining,
    progress: amount > 0 ? Math.min(100, Math.round(((spent + returned) / amount) * 100)) : 0,
    status: settled ? 'settled' : overdue ? 'overdue' : 'open',
  }
}

export function filterAdvances(advances: Advance[], filters: AdvanceFilters): Advance[] {
  const term = normalized(filters.search)
  return advances.filter((advance) => {
    const matchesSearch =
      !term ||
      [advance.holderName, advance.holderTitle, ...advance.projectNames, advance.number, advance.purpose]
        .map(normalized)
        .some((value) => value.includes(term))
    const matchesStatus = filters.status === 'all' || advance.status === filters.status
    const matchesProject = filters.project === 'all' || advance.projectNames.includes(filters.project)
    return matchesSearch && matchesStatus && matchesProject
  })
}

export function summarizeAdvances(advances: Advance[]): AdvancesSummary {
  return advances.reduce<AdvancesSummary>(
    (summary, advance) => ({
      openCount: summary.openCount + (advance.status !== 'settled' ? 1 : 0),
      totalSpent: summary.totalSpent + advance.spent,
      totalRemaining: summary.totalRemaining + advance.remaining,
      overdueCount: summary.overdueCount + (advance.status === 'overdue' ? 1 : 0),
    }),
    { openCount: 0, totalSpent: 0, totalRemaining: 0, overdueCount: 0 },
  )
}

export async function getAdvancesViewModel(filters: AdvanceFilters): Promise<AdvancesViewModel> {
  const advances = (await findAdvances()).map((row) => mapAdvance(row))
  return {
    advances,
    filteredAdvances: filterAdvances(advances, filters),
    projects: [...new Set(advances.flatMap((advance) => advance.projectNames))].sort((a, b) =>
      a.localeCompare(b, 'ar'),
    ),
    summary: summarizeAdvances(advances),
  }
}
