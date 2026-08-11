import { describe, expect, it, vi, beforeEach } from 'vitest'
import type {
  CashBankMovementsPageRequest,
  CashBankTransactionRow,
  CashBankBalanceRow,
} from '../types/cash-banks.types'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function makeRequest(overrides: Partial<CashBankMovementsPageRequest> = {}): CashBankMovementsPageRequest {
  return {
    page: 1,
    pageSize: 25,
    filters: {
      accountId: '',
      type: 'all',
      dateFrom: '',
      dateTo: '',
      query: '',
    },
    ...overrides,
  }
}

function makeTx(overrides: Partial<CashBankTransactionRow> = {}): CashBankTransactionRow {
  return {
    id: 'tx-1',
    transaction_number: 1,
    transaction_date: '2026-07-31',
    transaction_type: 'deposit',
    source_account_id: null,
    destination_account_id: 'acc-1',
    amount: 1000,
    description: 'إيداع',
    reference_number: null,
    status: 'posted',
    journal_id: 'jrn-1',
    posted_at: '2026-07-31T10:00:00Z',
    voided_at: null,
    created_at: '2026-07-31T10:00:00Z',
    updated_at: '2026-07-31T10:00:00Z',
    reversal_of_transaction_id: null,
    ...overrides,
  }
}

function makeBalance(overrides: Partial<CashBankBalanceRow> = {}): CashBankBalanceRow {
  return {
    id: 'acc-1',
    ledger_account_id: 'ledger-1',
    name: 'الخزنة الرئيسية',
    account_kind: 'cash',
    bank_name: null,
    account_number: null,
    iban: null,
    branch_name: null,
    currency_code: 'EGP',
    is_active: true,
    opening_balance: 0,
    current_balance: 5000,
    ...overrides,
  }
}

// ─── Mock repository ──────────────────────────────────────────────────────────
const mockFindPage = vi.hoisted(() => vi.fn())
const mockFindBalances = vi.hoisted(() => vi.fn())

vi.mock('../repositories/cash-banks.repository', () => ({
  findCashBankTransactionPage: mockFindPage,
  findCashBankBalances: mockFindBalances,
  // other repository functions used by service — no-ops
  findRecentCashBankTransactions: vi.fn().mockResolvedValue([]),
  findCashBankAccountById: vi.fn(),
  checkDuplicateAccountName: vi.fn(),
  createCashBankAccount: vi.fn(),
  updateCashBankAccount: vi.fn(),
  deactivateCashBankAccount: vi.fn(),
  findAvailableLedgerAccounts: vi.fn().mockResolvedValue([]),
  findDepositDestinationAccounts: vi.fn().mockResolvedValue([]),
  findDepositOffsetAccounts: vi.fn().mockResolvedValue([]),
  postCashBankDeposit: vi.fn(),
  findWithdrawalSourceAccounts: vi.fn().mockResolvedValue([]),
  postCashBankWithdrawal: vi.fn(),
  findTransferAccounts: vi.fn().mockResolvedValue([]),
  postCashBankTransfer: vi.fn(),
  postCashBankReversal: vi.fn(),
}))

import { getCashBankMovementsPage, MOVEMENTS_PAGE_SIZE } from './cash-banks.service'

// ─── Pagination params ────────────────────────────────────────────────────────
describe('MOVEMENTS_PAGE_SIZE', () => {
  it('is 25', () => {
    expect(MOVEMENTS_PAGE_SIZE).toBe(25)
  })
})

describe('getCashBankMovementsPage — pagination calculations', () => {
  beforeEach(() => {
    mockFindPage.mockResolvedValue({ records: [], totalCount: 0 })
    mockFindBalances.mockResolvedValue([])
  })

  it('calculates offset = 0 for page 1', async () => {
    await getCashBankMovementsPage(makeRequest({ page: 1, pageSize: 25 }))
    expect(mockFindPage).toHaveBeenCalledWith(expect.objectContaining({ offset: 0, limit: 25 }))
  })

  it('calculates offset = 25 for page 2', async () => {
    await getCashBankMovementsPage(makeRequest({ page: 2, pageSize: 25 }))
    expect(mockFindPage).toHaveBeenCalledWith(expect.objectContaining({ offset: 25, limit: 25 }))
  })

  it('calculates offset = 50 for page 3 with pageSize 25', async () => {
    await getCashBankMovementsPage(makeRequest({ page: 3, pageSize: 25 }))
    expect(mockFindPage).toHaveBeenCalledWith(expect.objectContaining({ offset: 50, limit: 25 }))
  })

  it('clamps pageSize to max 100', async () => {
    await getCashBankMovementsPage(makeRequest({ pageSize: 500 }))
    expect(mockFindPage).toHaveBeenCalledWith(expect.objectContaining({ limit: 100 }))
  })

  it('clamps pageSize to min 1', async () => {
    await getCashBankMovementsPage(makeRequest({ pageSize: 0 }))
    expect(mockFindPage).toHaveBeenCalledWith(expect.objectContaining({ limit: 1 }))
  })

  it('clamps negative pageSize to 1', async () => {
    await getCashBankMovementsPage(makeRequest({ pageSize: -5 }))
    expect(mockFindPage).toHaveBeenCalledWith(expect.objectContaining({ limit: 1 }))
  })

  it('clamps page to min 1', async () => {
    await getCashBankMovementsPage(makeRequest({ page: 0 }))
    expect(mockFindPage).toHaveBeenCalledWith(expect.objectContaining({ offset: 0 }))
  })

  it('returns totalPages = 1 when totalCount is 0', async () => {
    mockFindPage.mockResolvedValue({ records: [], totalCount: 0 })
    const result = await getCashBankMovementsPage(makeRequest())
    expect(result.totalPages).toBe(1)
  })

  it('returns correct totalPages for 51 records with pageSize 25', async () => {
    mockFindPage.mockResolvedValue({ records: [], totalCount: 51 })
    const result = await getCashBankMovementsPage(makeRequest({ pageSize: 25 }))
    expect(result.totalPages).toBe(3)
  })

  it('returns correct totalPages for exactly 50 records with pageSize 25', async () => {
    mockFindPage.mockResolvedValue({ records: [], totalCount: 50 })
    const result = await getCashBankMovementsPage(makeRequest({ pageSize: 25 }))
    expect(result.totalPages).toBe(2)
  })
})

// ─── Filter mapping ───────────────────────────────────────────────────────────
describe('getCashBankMovementsPage — filter mapping', () => {
  beforeEach(() => {
    mockFindPage.mockResolvedValue({ records: [], totalCount: 0 })
    mockFindBalances.mockResolvedValue([])
  })

  it('passes accountId to repository when set', async () => {
    await getCashBankMovementsPage(
      makeRequest({ filters: { accountId: 'acc-42', type: 'all', dateFrom: '', dateTo: '', query: '' } }),
    )
    expect(mockFindPage).toHaveBeenCalledWith(expect.objectContaining({ accountId: 'acc-42' }))
  })

  it('passes empty accountId when not set', async () => {
    await getCashBankMovementsPage(makeRequest())
    expect(mockFindPage).toHaveBeenCalledWith(expect.objectContaining({ accountId: '' }))
  })

  it('passes type filter when not all', async () => {
    await getCashBankMovementsPage(
      makeRequest({ filters: { accountId: '', type: 'deposit', dateFrom: '', dateTo: '', query: '' } }),
    )
    expect(mockFindPage).toHaveBeenCalledWith(expect.objectContaining({ type: 'deposit' }))
  })

  it('passes all as type when not filtered', async () => {
    await getCashBankMovementsPage(makeRequest())
    expect(mockFindPage).toHaveBeenCalledWith(expect.objectContaining({ type: 'all' }))
  })

  it('passes dateFrom when set', async () => {
    await getCashBankMovementsPage(
      makeRequest({ filters: { accountId: '', type: 'all', dateFrom: '2026-01-01', dateTo: '', query: '' } }),
    )
    expect(mockFindPage).toHaveBeenCalledWith(expect.objectContaining({ dateFrom: '2026-01-01' }))
  })

  it('passes dateTo when set', async () => {
    await getCashBankMovementsPage(
      makeRequest({ filters: { accountId: '', type: 'all', dateFrom: '', dateTo: '2026-12-31', query: '' } }),
    )
    expect(mockFindPage).toHaveBeenCalledWith(expect.objectContaining({ dateTo: '2026-12-31' }))
  })

  it('passes search query to repository', async () => {
    await getCashBankMovementsPage(
      makeRequest({ filters: { accountId: '', type: 'all', dateFrom: '', dateTo: '', query: 'إيداع' } }),
    )
    expect(mockFindPage).toHaveBeenCalledWith(expect.objectContaining({ query: 'إيداع' }))
  })

  it('passes empty query when not set', async () => {
    await getCashBankMovementsPage(makeRequest())
    expect(mockFindPage).toHaveBeenCalledWith(expect.objectContaining({ query: '' }))
  })
})

// ─── canReverse rules ─────────────────────────────────────────────────────────
describe('getCashBankMovementsPage — canReverse rules', () => {
  beforeEach(() => {
    mockFindBalances.mockResolvedValue([makeBalance()])
  })

  it('canReverse is true for a posted deposit with no reversal', async () => {
    mockFindPage.mockResolvedValue({
      records: [makeTx({ status: 'posted', reversal_of_transaction_id: null })],
      totalCount: 1,
    })
    const result = await getCashBankMovementsPage(makeRequest())
    expect(result.movements[0].canReverse).toBe(true)
  })

  it('canReverse is false for a draft transaction', async () => {
    mockFindPage.mockResolvedValue({
      records: [makeTx({ status: 'draft' })],
      totalCount: 1,
    })
    const result = await getCashBankMovementsPage(makeRequest())
    expect(result.movements[0].canReverse).toBe(false)
  })

  it('canReverse is false for a voided transaction', async () => {
    mockFindPage.mockResolvedValue({
      records: [makeTx({ status: 'void', voided_at: '2026-07-31T12:00:00Z' })],
      totalCount: 1,
    })
    const result = await getCashBankMovementsPage(makeRequest())
    expect(result.movements[0].canReverse).toBe(false)
  })

  it('canReverse is false for a reversal transaction (reversal_of_transaction_id set)', async () => {
    mockFindPage.mockResolvedValue({
      records: [
        makeTx({
          status: 'posted',
          reversal_of_transaction_id: 'original-tx-id',
        }),
      ],
      totalCount: 1,
    })
    const result = await getCashBankMovementsPage(makeRequest())
    expect(result.movements[0].canReverse).toBe(false)
  })

  it('returns page metadata correctly with movements', async () => {
    const tx = makeTx()
    mockFindPage.mockResolvedValue({ records: [tx], totalCount: 100 })
    const result = await getCashBankMovementsPage(makeRequest({ page: 2, pageSize: 25 }))
    expect(result.page).toBe(2)
    expect(result.pageSize).toBe(25)
    expect(result.totalCount).toBe(100)
    expect(result.totalPages).toBe(4)
    expect(result.movements).toHaveLength(1)
  })
})
