import { beforeEach, describe, expect, it, vi } from 'vitest'
import { reverseEntry } from './journal-entry.service'
import {
  ensureJournalCashBankReversal,
  findJournalReversalContext,
  reverseJournalEntry,
} from '../repositories/journal.repository'

vi.mock('../repositories/journal.repository', () => ({
  findJournalPostingOptions: vi.fn().mockResolvedValue({ projects: [], accounts: [] }),
  accountingDeleteJournalEntry: vi.fn().mockResolvedValue(undefined),
  postSingleLineEntry: vi.fn().mockResolvedValue('entry-id'),
  reverseJournalEntry: vi.fn().mockResolvedValue('reversal-entry-id'),
  findJournalReversalContext: vi.fn().mockResolvedValue({
    originalJournalId: 'journal-1',
    originalJournalStatus: 'posted',
    reversalEntryId: null,
    originalMovement: null,
    movementAlreadyReversed: false,
  }),
  findReversalJournalId: vi.fn().mockResolvedValue('reversal-journal-id'),
  ensureJournalCashBankReversal: vi.fn().mockResolvedValue(undefined),
  subscribeToJournalPostingOptionChanges: vi.fn().mockReturnValue(() => {}),
}))

describe('reverseEntry', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects an empty entry id before calling the repository', async () => {
    await expect(reverseEntry('')).rejects.toThrow('معرّف القيد مطلوب.')
    expect(reverseJournalEntry).not.toHaveBeenCalled()
  })

  it('delegates a posted entry to the reversal RPC repository call', async () => {
    await expect(reverseEntry('entry-123')).resolves.toBe('reversal-entry-id')
    expect(reverseJournalEntry).toHaveBeenCalledWith('entry-123')
  })

  it('adds one inverse cash movement to the journal reversal', async () => {
    vi.mocked(findJournalReversalContext).mockResolvedValueOnce({
      originalJournalId: 'journal-1',
      originalJournalStatus: 'posted',
      reversalEntryId: null,
      originalMovement: {
        id: 'movement-1',
        transactionType: 'withdrawal',
        sourceAccountId: 'cash-1',
        destinationAccountId: null,
        amount: 250,
        referenceNumber: 'entry-123',
      },
      movementAlreadyReversed: false,
    })

    await reverseEntry('entry-123')

    expect(ensureJournalCashBankReversal).toHaveBeenCalledWith(
      expect.objectContaining({
        originalMovementId: 'movement-1',
        reversalJournalId: 'reversal-journal-id',
        transactionType: 'deposit',
        sourceAccountId: null,
        destinationAccountId: 'cash-1',
        amount: 250,
      }),
    )
  })

  it('resumes an incomplete reversal without creating another journal reversal', async () => {
    vi.mocked(findJournalReversalContext).mockResolvedValueOnce({
      originalJournalId: 'journal-1',
      originalJournalStatus: 'reversed',
      reversalEntryId: 'existing-reversal-entry',
      originalMovement: {
        id: 'movement-1',
        transactionType: 'deposit',
        sourceAccountId: null,
        destinationAccountId: 'cash-1',
        amount: 250,
        referenceNumber: null,
      },
      movementAlreadyReversed: false,
    })

    await expect(reverseEntry('entry-123')).resolves.toBe('existing-reversal-entry')
    expect(reverseJournalEntry).not.toHaveBeenCalled()
    expect(ensureJournalCashBankReversal).toHaveBeenCalledWith(
      expect.objectContaining({ transactionType: 'withdrawal', sourceAccountId: 'cash-1' }),
    )
  })
})
