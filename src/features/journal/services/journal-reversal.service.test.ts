import { describe, expect, it, vi } from 'vitest'
import { reverseEntry } from './journal-entry.service'
import { reverseJournalEntry } from '../repositories/journal.repository'

vi.mock('../repositories/journal.repository', () => ({
  findJournalPostingOptions: vi.fn().mockResolvedValue({ projects: [], accounts: [] }),
  forceDeleteJournalEntry: vi.fn().mockResolvedValue(undefined),
  postSingleLineEntry: vi.fn().mockResolvedValue('entry-id'),
  reverseJournalEntry: vi.fn().mockResolvedValue('reversal-entry-id'),
  subscribeToJournalPostingOptionChanges: vi.fn().mockReturnValue(() => {}),
}))

describe('reverseEntry', () => {
  it('rejects an empty entry id before calling the repository', async () => {
    await expect(reverseEntry('')).rejects.toThrow('معرّف القيد مطلوب.')
    expect(reverseJournalEntry).not.toHaveBeenCalled()
  })

  it('delegates the source entry id to the reversal RPC repository call', async () => {
    await expect(reverseEntry('entry-123')).resolves.toBe('reversal-entry-id')
    expect(reverseJournalEntry).toHaveBeenCalledWith('entry-123')
  })
})
