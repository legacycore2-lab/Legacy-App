import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getSupabaseClient } from '../../../lib/supabase/client'
import { ensureSingleLineCashBankMovement } from './journal.repository'
import type { JournalCashBankMovementPayload } from '../types/journal-entry.types'

vi.mock('../../../lib/supabase/client', () => ({
  getSupabaseClient: vi.fn(),
}))

const payload: JournalCashBankMovementPayload = {
  clientRequestId: 'request-1',
  transactionDate: '2026-08-16',
  transactionType: 'withdrawal',
  sourceAccountId: 'cash-1',
  destinationAccountId: null,
  amount: 1250,
  description: 'Project expense',
  referenceNumber: 'entry-55',
  journalId: 'journal-55',
}

function createSelectResult(result: { data: unknown; error: unknown }) {
  const builder = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue(result),
  }
  builder.select.mockReturnValue(builder)
  builder.eq.mockReturnValue(builder)
  return builder
}

describe('ensureSingleLineCashBankMovement', () => {
  beforeEach(() => vi.clearAllMocks())

  it('does not insert when the request already has a movement', async () => {
    const select = createSelectResult({ data: { id: 'movement-1' }, error: null })
    const insert = vi.fn()
    vi.mocked(getSupabaseClient).mockReturnValue({
      from: vi.fn().mockReturnValue({ ...select, insert }),
    } as never)

    await ensureSingleLineCashBankMovement(payload)

    expect(insert).not.toHaveBeenCalled()
  })

  it('uses insert instead of an incompatible partial-index upsert', async () => {
    const select = createSelectResult({ data: null, error: null })
    const insert = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(getSupabaseClient).mockReturnValue({
      from: vi.fn().mockReturnValue({ ...select, insert }),
    } as never)

    await ensureSingleLineCashBankMovement(payload)

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        client_request_id: 'request-1',
        transaction_type: 'withdrawal',
        source_account_id: 'cash-1',
        journal_id: 'journal-55',
      }),
    )
  })

  it('accepts a concurrent retry only after finding its inserted movement', async () => {
    const select = createSelectResult({ data: null, error: null })
    select.maybeSingle
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: { id: 'movement-1' }, error: null })
    const insert = vi.fn().mockResolvedValue({ error: { code: '23505' } })
    vi.mocked(getSupabaseClient).mockReturnValue({
      from: vi.fn().mockReturnValue({ ...select, insert }),
    } as never)

    await expect(ensureSingleLineCashBankMovement(payload)).resolves.toBeUndefined()
    expect(select.maybeSingle).toHaveBeenCalledTimes(2)
  })

  it('propagates non-duplicate insert failures', async () => {
    const select = createSelectResult({ data: null, error: null })
    const failure = { code: '42501', message: 'permission denied' }
    const insert = vi.fn().mockResolvedValue({ error: failure })
    vi.mocked(getSupabaseClient).mockReturnValue({
      from: vi.fn().mockReturnValue({ ...select, insert }),
    } as never)

    await expect(ensureSingleLineCashBankMovement(payload)).rejects.toBe(failure)
  })
})
