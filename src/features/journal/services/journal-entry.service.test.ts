import { beforeEach, describe, expect, it, vi } from 'vitest'
import { postSingleLineEntry } from '../repositories/journal.repository'
import type { SingleLineJournalInput } from '../types/journal-entry.types'
import { submitSingleLineEntry } from './journal-entry.service'

vi.mock('../repositories/journal.repository', () => ({
  postSingleLineEntry: vi.fn(),
}))

const validInput: SingleLineJournalInput = {
  requestId: '73000000-0000-0000-0000-000000000001',
  entryDate: '2026-07-22',
  projectId: '71000000-0000-0000-0000-000000000001',
  projectName: 'مشروع اختبار',
  type: 'expense',
  categoryAccountId: '72000000-0000-0000-0000-000000000001',
  category: '5100',
  description: 'شراء خامات',
  contractor: 'مورد',
  paymentAccountId: '72000000-0000-0000-0000-000000000002',
  paymentAccount: '1100',
  amount: '1250.50',
}

describe('single-line journal submission', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('passes a valid user-facing line to the repository', async () => {
    vi.mocked(postSingleLineEntry).mockResolvedValue('entry-id')

    await expect(submitSingleLineEntry(validInput)).resolves.toBe('entry-id')
    expect(postSingleLineEntry).toHaveBeenCalledWith(validInput)
  })

  it('does not call the repository when validation fails', async () => {
    await expect(submitSingleLineEntry({ ...validInput, amount: '0' })).rejects.toThrow(
      'أدخل مبلغًا صحيحًا أكبر من صفر.',
    )
    expect(postSingleLineEntry).not.toHaveBeenCalled()
  })

  it('rejects using the same account for both journal sides', async () => {
    await expect(
      submitSingleLineEntry({
        ...validInput,
        paymentAccountId: validInput.categoryAccountId,
      }),
    ).rejects.toThrow('يجب اختيار حسابين مختلفين لطرفي القيد.')
    expect(postSingleLineEntry).not.toHaveBeenCalled()
  })
})
