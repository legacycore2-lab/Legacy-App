import { describe, expect, it } from 'vitest'
import type { ProjectDetailsViewModel, ProjectJournalViewModel } from '../types/project.types'
import { exportProjectReportWord } from './project-report-export.service'

const viewModel = {
  project: {
    id: 'p1',
    code: 'P-001',
    name: 'اختبار',
    client: 'عميل',
    manager: 'مدير',
    status: 'active',
    progress: 50,
    contractValue: 1000,
    received: 0,
    spent: 0,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    notes: '',
  },
  summary: { totalIncome: 500, totalExpense: 200, balance: 300, entryCount: 0 },
  progress: 50,
  remaining: 700,
  profitMargin: 30,
  analytics: { recentEntries: [] },
} as unknown as ProjectDetailsViewModel

describe('project report exports', () => {
  it('rejects Word export when the project has no journal entries', () => {
    expect(() =>
      exportProjectReportWord({
        viewModel,
        journalViewModel: { entries: [] } as unknown as ProjectJournalViewModel,
      }),
    ).toThrow('لا توجد قيود متاحة للتصدير.')
  })
})
