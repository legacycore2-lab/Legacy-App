import { describe, expect, it } from 'vitest'
import { buildExecutiveViewModel } from './reports.service'
import { buildProfitLossViewModel } from './profit-loss.service'
import { mapContractorReportEntry, buildContractorSummaryRows } from './contractor-reports.service'
import type { ReportProjectRecord } from '../types/report.types'
import type { ContractorReportEntryRecord } from '../types/contractor-reports.types'

const project: ReportProjectRecord = {
  id: 'p1',
  name: 'هايد بارك',
  code: 'P-1',
  client_name: 'عميل',
  status: 'active',
  progress: 0,
  contract_value: 0,
  is_archived: false,
}

describe('reversal-aware report aggregation', () => {
  it('nets original and reversal expense to zero in executive reports', () => {
    const vm = buildExecutiveViewModel([project], [
      { id: 'e58', project_id: 'p1', entry_type: 'expense', amount: 1500, entry_number: 58 },
      { id: 'e60', project_id: 'p1', entry_type: 'expense', amount: -1500, entry_number: 60 },
    ])

    expect(vm.summary.expense).toBe(0)
    expect(vm.summary.net).toBe(0)
    expect(vm.topProjects.lossMaking).toHaveLength(0)
    expect(vm.rows[0]).toMatchObject({ expense: 0, net: 0 })
  })

  it('nets original and reversal expense to zero in profit and loss', () => {
    const vm = buildProfitLossViewModel(
      [project],
      [
        {
          id: 'e58',
          project_id: 'p1',
          entry_type: 'expense',
          amount: 1500,
          entry_number: 58,
          entry_date: '2026-08-20',
        },
        {
          id: 'e60',
          project_id: 'p1',
          entry_type: 'expense',
          amount: -1500,
          entry_number: 60,
          entry_date: '2026-08-20',
        },
      ],
      { projectId: '', dateFrom: '', dateTo: '' },
    )

    expect(vm.summary.totalExpense).toBe(0)
    expect(vm.summary.netProfit).toBe(0)
    expect(vm.topLossProject).toBeNull()
  })

  it('preserves reversal signs in contractor totals', () => {
    const base: ContractorReportEntryRecord = {
      id: 'e58',
      entry_number: 58,
      entry_date: '2026-08-20',
      entry_type: 'expense',
      amount: 1500,
      contractor_name: 'مصباح',
      category: 'تشوينات',
      description: 'شراء',
      payment_method: 'البنك الأهلي',
      project_id: 'p1',
      project: { name: 'هايد بارك' },
    }

    const entries = [
      mapContractorReportEntry(base),
      mapContractorReportEntry({ ...base, id: 'e60', entry_number: 60, amount: -1500, description: 'عكس: شراء' }),
    ]
    const rows = buildContractorSummaryRows(entries)

    expect(rows[0].totalExpense).toBe(0)
    expect(rows[0].netMovement).toBe(0)
  })
})
