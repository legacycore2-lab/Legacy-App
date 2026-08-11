import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  filterAdvances,
  mapAdvance,
  mapAdvanceTransaction,
  summarizeAdvances,
  ADVANCES_PAGE_SIZE,
} from './advances.service'
import type { AdvanceRow, AdvanceTransactionRow } from '../types/advances.types'

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const base: AdvanceRow = {
  id: '1',
  advance_number: 7,
  advance_code: 'ADV-0007',
  holder_name: 'أحمد سالم',
  holder_title: 'مهندس موقع',
  project_names: ['مول زايد', 'فيلا التجمع'],
  issue_date: '2026-08-01',
  due_date: '2026-08-30',
  purpose: 'مشتريات مواقع',
  amount: 25000,
  spent_amount: 10000,
  returned_amount: 500,
}

const baseTx: AdvanceTransactionRow = {
  id: 'tx-1',
  advance_id: '1',
  transaction_type: 'expense',
  project_id: 'proj-1',
  transaction_date: '2026-08-05',
  amount: 3000,
  description: 'شراء مواد بناء',
  source_record_id: 'entry-1',
  created_at: '2026-08-05T10:00:00Z',
  project_name: 'مول زايد',
}

// ─── mapAdvance ───────────────────────────────────────────────────────────────
describe('mapAdvance', () => {
  it('calculates remaining correctly', () => {
    const advance = mapAdvance(base, new Date('2026-08-10'))
    expect(advance.remaining).toBe(14500)
    expect(advance.amount).toBe(25000)
    expect(advance.spent).toBe(10000)
    expect(advance.returned).toBe(500)
  })

  it('maps multiple project names', () => {
    expect(mapAdvance(base).projectNames).toEqual(['مول زايد', 'فيلا التجمع'])
  })

  it('uses fallback for null project_names', () => {
    expect(mapAdvance({ ...base, project_names: null }).projectNames).toEqual(['بدون مشروع'])
  })

  it('marks status open when not overdue and remaining > 0', () => {
    expect(mapAdvance(base, new Date('2026-08-10')).status).toBe('open')
  })

  it('marks status overdue past due_date with remaining > 0', () => {
    expect(mapAdvance({ ...base, due_date: '2026-08-01' }, new Date('2026-08-10')).status).toBe('overdue')
  })

  it('marks status settled when remaining = 0', () => {
    expect(mapAdvance({ ...base, spent_amount: 24500 }, new Date('2026-08-10')).status).toBe('settled')
  })

  it('marks settled even if overdue when remaining = 0', () => {
    expect(
      mapAdvance({ ...base, spent_amount: 24500, due_date: '2026-08-01' }, new Date('2026-08-10')).status,
    ).toBe('settled')
  })

  it('clamps remaining to 0 (never negative)', () => {
    // DB constraint prevents this, but service is defensive
    expect(mapAdvance({ ...base, spent_amount: 30000 }).remaining).toBe(0)
  })

  it('calculates progress correctly', () => {
    const advance = mapAdvance(base)
    expect(advance.progress).toBe(42) // (10000+500)/25000 = 42%
  })

  it('uses موظف as fallback for null holder_title', () => {
    expect(mapAdvance({ ...base, holder_title: null }).holderTitle).toBe('موظف')
  })

  it('uses empty string as fallback for null due_date', () => {
    expect(mapAdvance({ ...base, due_date: null }).dueDate).toBe('')
  })
})

// ─── mapAdvanceTransaction ────────────────────────────────────────────────────
describe('mapAdvanceTransaction', () => {
  it('maps expense transaction fields', () => {
    const tx = mapAdvanceTransaction(baseTx)
    expect(tx.id).toBe('tx-1')
    expect(tx.type).toBe('expense')
    expect(tx.date).toBe('2026-08-05')
    expect(tx.projectName).toBe('مول زايد')
    expect(tx.description).toBe('شراء مواد بناء')
    expect(tx.amount).toBe(3000)
    expect(tx.sourceRecordId).toBe('entry-1')
  })

  it('maps return transaction with null project', () => {
    const tx = mapAdvanceTransaction({
      ...baseTx,
      transaction_type: 'return',
      project_id: null,
      project_name: null,
    })
    expect(tx.type).toBe('return')
    expect(tx.projectName).toBeNull()
  })
})

// ─── filterAdvances ───────────────────────────────────────────────────────────
describe('filterAdvances', () => {
  const today = new Date('2026-08-10')
  const advances = [
    mapAdvance(base, today),
    mapAdvance(
      { ...base, id: '2', holder_name: 'سارة', project_names: ['مشروع آخر'], spent_amount: 25000 },
      today,
    ),
  ]

  it('returns all when all filters are default', () => {
    expect(
      filterAdvances(advances, { search: '', status: 'all', project: 'all', dateFrom: '', dateTo: '' }),
    ).toHaveLength(2)
  })

  it('filters by status open', () => {
    const result = filterAdvances(advances, {
      search: '',
      status: 'open',
      project: 'all',
      dateFrom: '',
      dateTo: '',
    })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  it('filters by status settled', () => {
    const result = filterAdvances(advances, {
      search: '',
      status: 'settled',
      project: 'all',
      dateFrom: '',
      dateTo: '',
    })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('2')
  })

  it('filters by project name', () => {
    const result = filterAdvances(advances, {
      search: '',
      status: 'all',
      project: 'مول زايد',
      dateFrom: '',
      dateTo: '',
    })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  it('returns empty for non-existent project', () => {
    expect(
      filterAdvances(advances, {
        search: '',
        status: 'all',
        project: 'مشروع وهمي',
        dateFrom: '',
        dateTo: '',
      }),
    ).toHaveLength(0)
  })

  it('search and project filter combined', () => {
    expect(
      filterAdvances(advances, { search: '', status: 'all', project: 'مشروع آخر', dateFrom: '', dateTo: '' }),
    ).toHaveLength(1)
  })
})

// ─── summarizeAdvances ────────────────────────────────────────────────────────
describe('summarizeAdvances', () => {
  it('builds the financial summary', () => {
    const today = new Date('2026-08-10')
    const advances = [
      mapAdvance(base, today),
      mapAdvance({ ...base, id: '2', amount: 1000, spent_amount: 1000, returned_amount: 0 }, today),
    ]
    expect(summarizeAdvances(advances)).toEqual({
      openCount: 1,
      totalSpent: 11000,
      totalRemaining: 14500,
      overdueCount: 0,
    })
  })

  it('counts overdue separately from open', () => {
    const today = new Date('2026-09-01')
    const advances = [mapAdvance(base, today)] // due_date 2026-08-30, today > due
    const summary = summarizeAdvances(advances)
    expect(summary.overdueCount).toBe(1)
    expect(summary.openCount).toBe(1)
  })

  it('returns zeros for empty array', () => {
    expect(summarizeAdvances([])).toEqual({
      openCount: 0,
      totalSpent: 0,
      totalRemaining: 0,
      overdueCount: 0,
    })
  })
})

// ─── ADVANCES_PAGE_SIZE ───────────────────────────────────────────────────────
describe('ADVANCES_PAGE_SIZE', () => {
  it('is 25', () => {
    expect(ADVANCES_PAGE_SIZE).toBe(25)
  })
})

// ─── getAdvancesPage — pagination + filters ───────────────────────────────────
const mockFindAdvancesPage = vi.hoisted(() => vi.fn())
const mockFindAdvances = vi.hoisted(() => vi.fn())
const mockFindAdvanceTransactions = vi.hoisted(() => vi.fn())

vi.mock('../repositories/advances.repository', () => ({
  findAdvances: mockFindAdvances,
  findAdvancesPage: mockFindAdvancesPage,
  findAdvanceTransactions: mockFindAdvanceTransactions,
  findAdvanceOptions: vi
    .fn()
    .mockResolvedValue({ projects: [], cashAccounts: [], ledgerAccounts: [], expenseAccounts: [] }),
  postAdvance: vi.fn(),
  postAdvanceExpense: vi.fn(),
  postAdvanceReturn: vi.fn(),
}))

import { getAdvancesPage, getAdvanceTransactionsPage } from './advances.service'

describe('getAdvancesPage — pagination', () => {
  beforeEach(() => {
    mockFindAdvancesPage.mockResolvedValue({ records: [], totalCount: 0 })
  })

  it('calculates offset = 0 for page 1', async () => {
    await getAdvancesPage({
      page: 1,
      pageSize: 25,
      filters: { search: '', status: 'all', project: 'all', dateFrom: '', dateTo: '' },
    })
    expect(mockFindAdvancesPage).toHaveBeenCalledWith(expect.objectContaining({ offset: 0, limit: 25 }))
  })

  it('calculates offset = 25 for page 2', async () => {
    await getAdvancesPage({
      page: 2,
      pageSize: 25,
      filters: { search: '', status: 'all', project: 'all', dateFrom: '', dateTo: '' },
    })
    expect(mockFindAdvancesPage).toHaveBeenCalledWith(expect.objectContaining({ offset: 25, limit: 25 }))
  })

  it('clamps pageSize to max 100', async () => {
    await getAdvancesPage({
      page: 1,
      pageSize: 500,
      filters: { search: '', status: 'all', project: 'all', dateFrom: '', dateTo: '' },
    })
    expect(mockFindAdvancesPage).toHaveBeenCalledWith(expect.objectContaining({ limit: 100 }))
  })

  it('clamps pageSize to min 1', async () => {
    await getAdvancesPage({
      page: 1,
      pageSize: 0,
      filters: { search: '', status: 'all', project: 'all', dateFrom: '', dateTo: '' },
    })
    expect(mockFindAdvancesPage).toHaveBeenCalledWith(expect.objectContaining({ limit: 1 }))
  })

  it('returns totalPages = 1 when totalCount = 0', async () => {
    mockFindAdvancesPage.mockResolvedValue({ records: [], totalCount: 0 })
    const result = await getAdvancesPage({
      page: 1,
      pageSize: 25,
      filters: { search: '', status: 'all', project: 'all', dateFrom: '', dateTo: '' },
    })
    expect(result.totalPages).toBe(1)
  })

  it('returns correct totalPages for 51 records', async () => {
    mockFindAdvancesPage.mockResolvedValue({ records: [], totalCount: 51 })
    const result = await getAdvancesPage({
      page: 1,
      pageSize: 25,
      filters: { search: '', status: 'all', project: 'all', dateFrom: '', dateTo: '' },
    })
    expect(result.totalPages).toBe(3)
  })

  it('passes search filter to repository', async () => {
    await getAdvancesPage({
      page: 1,
      pageSize: 25,
      filters: { search: 'أحمد', status: 'all', project: 'all', dateFrom: '', dateTo: '' },
    })
    expect(mockFindAdvancesPage).toHaveBeenCalledWith(expect.objectContaining({ search: 'أحمد' }))
  })

  it('passes dateFrom and dateTo to repository', async () => {
    await getAdvancesPage({
      page: 1,
      pageSize: 25,
      filters: { search: '', status: 'all', project: 'all', dateFrom: '2026-01-01', dateTo: '2026-12-31' },
    })
    expect(mockFindAdvancesPage).toHaveBeenCalledWith(
      expect.objectContaining({ dateFrom: '2026-01-01', dateTo: '2026-12-31' }),
    )
  })
})

// ─── getAdvanceTransactionsPage ───────────────────────────────────────────────
describe('getAdvanceTransactionsPage', () => {
  beforeEach(() => {
    mockFindAdvanceTransactions.mockResolvedValue({ records: [], totalCount: 0 })
  })

  it('passes advanceId and offset to repository', async () => {
    await getAdvanceTransactionsPage('adv-1', 2)
    expect(mockFindAdvanceTransactions).toHaveBeenCalledWith(
      expect.objectContaining({ advanceId: 'adv-1', offset: 20 }),
    )
  })

  it('returns totalPages = 1 when totalCount = 0', async () => {
    const result = await getAdvanceTransactionsPage('adv-1', 1)
    expect(result.totalPages).toBe(1)
    expect(result.transactions).toHaveLength(0)
  })

  it('maps transaction rows correctly', async () => {
    mockFindAdvanceTransactions.mockResolvedValue({
      records: [baseTx],
      totalCount: 1,
    })
    const result = await getAdvanceTransactionsPage('adv-1', 1)
    expect(result.transactions[0].type).toBe('expense')
    expect(result.transactions[0].amount).toBe(3000)
    expect(result.transactions[0].projectName).toBe('مول زايد')
  })
})

// ─── createAdvance validation ─────────────────────────────────────────────────
import { createAdvance, recordAdvanceExpense, returnAdvanceAmount } from './advances.service'

describe('createAdvance validation', () => {
  it('rejects empty holderName', async () => {
    await expect(
      createAdvance(
        {
          holderName: ' ',
          holderTitle: '',
          projectIds: ['p1'],
          sourceAccountId: 's1',
          advanceLedgerAccountId: 'l1',
          issueDate: '2026-08-01',
          dueDate: '',
          purpose: 'test',
          amount: '100',
        },
        'req-1',
      ),
    ).rejects.toThrow('اسم حامل العهدة مطلوب.')
  })

  it('rejects empty projectIds', async () => {
    await expect(
      createAdvance(
        {
          holderName: 'أحمد',
          holderTitle: '',
          projectIds: [],
          sourceAccountId: 's1',
          advanceLedgerAccountId: 'l1',
          issueDate: '2026-08-01',
          dueDate: '',
          purpose: 'test',
          amount: '100',
        },
        'req-1',
      ),
    ).rejects.toThrow('اختر مشروعًا واحدًا على الأقل.')
  })

  it('rejects amount = 0', async () => {
    await expect(
      createAdvance(
        {
          holderName: 'أحمد',
          holderTitle: '',
          projectIds: ['p1'],
          sourceAccountId: 's1',
          advanceLedgerAccountId: 'l1',
          issueDate: '2026-08-01',
          dueDate: '',
          purpose: 'test',
          amount: '0',
        },
        'req-1',
      ),
    ).rejects.toThrow('المبلغ يجب أن يكون أكبر من صفر.')
  })

  it('rejects missing clientRequestId', async () => {
    await expect(
      createAdvance(
        {
          holderName: 'أحمد',
          holderTitle: '',
          projectIds: ['p1'],
          sourceAccountId: 's1',
          advanceLedgerAccountId: 'l1',
          issueDate: '2026-08-01',
          dueDate: '',
          purpose: 'test',
          amount: '100',
        },
        '',
      ),
    ).rejects.toThrow('معرّف الطلب مطلوب.')
  })
})

describe('recordAdvanceExpense validation', () => {
  it('rejects expense > remaining', async () => {
    await expect(
      recordAdvanceExpense(
        {
          advanceId: '1',
          projectId: 'p1',
          expenseAccountId: 'e1',
          transactionDate: '2026-08-01',
          description: 'test',
          amount: '1001',
        },
        1000,
        'req-1',
      ),
    ).rejects.toThrow('مبلغ المصروف غير صالح أو أكبر من المتبقي.')
  })

  it('accepts amount exactly equal to remaining', async () => {
    vi.mocked(mockFindAdvancesPage) // already mocked
    // postAdvanceExpense is mocked as vi.fn() - won't throw
    await expect(
      recordAdvanceExpense(
        {
          advanceId: '1',
          projectId: 'p1',
          expenseAccountId: 'e1',
          transactionDate: '2026-08-01',
          description: 'test',
          amount: '1000',
        },
        1000,
        'req-1',
      ),
    ).resolves.not.toThrow()
  })

  it('rejects missing required fields', async () => {
    await expect(
      recordAdvanceExpense(
        {
          advanceId: '1',
          projectId: '',
          expenseAccountId: '',
          transactionDate: '',
          description: ' ',
          amount: '100',
        },
        500,
        'req-1',
      ),
    ).rejects.toThrow('أكمل بيانات المصروف.')
  })
})

describe('returnAdvanceAmount validation', () => {
  it('rejects return > remaining', async () => {
    await expect(
      returnAdvanceAmount(
        {
          advanceId: '1',
          destinationAccountId: 'd1',
          transactionDate: '2026-08-01',
          description: 'test',
          amount: '5001',
        },
        5000,
        'req-1',
      ),
    ).rejects.toThrow('المبلغ المرتجع غير صالح أو أكبر من المتبقي.')
  })

  it('rejects missing required fields', async () => {
    await expect(
      returnAdvanceAmount(
        { advanceId: '1', destinationAccountId: '', transactionDate: '', description: ' ', amount: '100' },
        500,
        'req-1',
      ),
    ).rejects.toThrow('أكمل بيانات رد المبلغ.')
  })
})
