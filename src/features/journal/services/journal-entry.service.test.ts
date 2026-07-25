import { describe, expect, it, vi } from 'vitest'
import {
  validateSingleLineEntry,
  buildJournalPreview,
  forceDeleteEntry,
  getLocalDateInputValue,
} from './journal-entry.service'
import type { SingleLineJournalInput } from '../types/journal-entry.types'

// Mock the repository so tests don't hit Supabase
vi.mock('../repositories/journal.repository', () => ({
  forceDeleteJournalEntry: vi.fn().mockResolvedValue(undefined),
  postSingleLineEntry: vi.fn().mockResolvedValue('entry-id-123'),
  findJournalPostingOptions: vi.fn().mockResolvedValue({ projects: [], accounts: [] }),
  subscribeToJournalPostingOptionChanges: vi.fn().mockReturnValue(() => {}),
}))

const validInput: SingleLineJournalInput = {
  requestId: 'req-1',
  entryDate: '2026-07-25',
  projectId: 'proj-1',
  projectName: 'مشروع تجريبي',
  type: 'expense',
  categoryAccountId: 'acc-1',
  category: 'خرسانة',
  description: 'دفعة أعمال',
  contractor: 'محمد أحمد',
  paymentAccountId: 'acc-2',
  paymentAccount: 'البنك',
  amount: '5000',
}

// ---------------------------------------------------------------------------
// getLocalDateInputValue
// ---------------------------------------------------------------------------
describe('getLocalDateInputValue', () => {
  it('formats date as YYYY-MM-DD', () => {
    expect(getLocalDateInputValue(new Date(2026, 6, 25))).toBe('2026-07-25')
  })

  it('pads month and day with zeros', () => {
    expect(getLocalDateInputValue(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

// ---------------------------------------------------------------------------
// validateSingleLineEntry
// ---------------------------------------------------------------------------
describe('validateSingleLineEntry', () => {
  it('returns no errors for a valid input', () => {
    expect(validateSingleLineEntry(validInput)).toHaveLength(0)
  })

  it('requires entryDate', () => {
    const errors = validateSingleLineEntry({ ...validInput, entryDate: '' })
    expect(errors).toContain('التاريخ مطلوب.')
  })

  it('requires projectId', () => {
    const errors = validateSingleLineEntry({ ...validInput, projectId: '' })
    expect(errors).toContain('المشروع مطلوب.')
  })

  it('requires categoryAccountId', () => {
    const errors = validateSingleLineEntry({ ...validInput, categoryAccountId: '' })
    expect(errors).toContain('البند مطلوب.')
  })

  it('requires non-empty description', () => {
    const errors = validateSingleLineEntry({ ...validInput, description: '   ' })
    expect(errors).toContain('البيان مطلوب.')
  })

  it('requires paymentAccountId', () => {
    const errors = validateSingleLineEntry({ ...validInput, paymentAccountId: '' })
    expect(errors).toContain('الحساب المقابل مطلوب.')
  })

  it('rejects same category and payment account', () => {
    const errors = validateSingleLineEntry({ ...validInput, paymentAccountId: 'acc-1' })
    expect(errors).toContain('يجب اختيار حسابين مختلفين لطرفي القيد.')
  })

  it('rejects zero amount', () => {
    const errors = validateSingleLineEntry({ ...validInput, amount: '0' })
    expect(errors).toContain('أدخل مبلغًا صحيحًا أكبر من صفر.')
  })

  it('rejects negative amount', () => {
    const errors = validateSingleLineEntry({ ...validInput, amount: '-100' })
    expect(errors).toContain('أدخل مبلغًا صحيحًا أكبر من صفر.')
  })

  it('rejects non-numeric amount', () => {
    const errors = validateSingleLineEntry({ ...validInput, amount: 'abc' })
    expect(errors).toContain('أدخل مبلغًا صحيحًا أكبر من صفر.')
  })

  it('can return multiple errors at once', () => {
    const errors = validateSingleLineEntry({ ...validInput, entryDate: '', projectId: '', amount: '0' })
    expect(errors.length).toBeGreaterThanOrEqual(3)
  })
})

// ---------------------------------------------------------------------------
// buildJournalPreview
// ---------------------------------------------------------------------------
describe('buildJournalPreview', () => {
  it('returns null when category is empty', () => {
    expect(buildJournalPreview({ ...validInput, category: '' })).toBeNull()
  })

  it('returns null when paymentAccount is empty', () => {
    expect(buildJournalPreview({ ...validInput, paymentAccount: '' })).toBeNull()
  })

  it('returns null when amount is zero', () => {
    expect(buildJournalPreview({ ...validInput, amount: '0' })).toBeNull()
  })

  it('expense: category is debit, payment is credit', () => {
    const preview = buildJournalPreview({ ...validInput, type: 'expense' })
    expect(preview).toEqual({
      debitAccount: 'خرسانة',
      creditAccount: 'البنك',
      amount: 5000,
    })
  })

  it('income: payment is debit, category is credit', () => {
    const preview = buildJournalPreview({ ...validInput, type: 'income' })
    expect(preview).toEqual({
      debitAccount: 'البنك',
      creditAccount: 'خرسانة',
      amount: 5000,
    })
  })

  it('trims whitespace from account names', () => {
    const preview = buildJournalPreview({
      ...validInput,
      category: '  خرسانة  ',
      paymentAccount: '  البنك  ',
    })
    expect(preview?.debitAccount).toBe('خرسانة')
    expect(preview?.creditAccount).toBe('البنك')
  })
})

// ---------------------------------------------------------------------------
// forceDeleteEntry
// ---------------------------------------------------------------------------
describe('forceDeleteEntry', () => {
  it('throws when entryId is empty', async () => {
    await expect(forceDeleteEntry('', 'سبب الحذف')).rejects.toThrow('معرّف القيد مطلوب.')
  })

  it('throws when reason is less than 5 characters', async () => {
    await expect(forceDeleteEntry('entry-1', 'قصر')).rejects.toThrow(
      'سبب الحذف يجب أن يكون 5 أحرف على الأقل.',
    )
  })

  it('throws when reason is only whitespace', async () => {
    await expect(forceDeleteEntry('entry-1', '     ')).rejects.toThrow(
      'سبب الحذف يجب أن يكون 5 أحرف على الأقل.',
    )
  })

  it('resolves when entryId and reason are valid', async () => {
    await expect(forceDeleteEntry('entry-1', 'خطأ في البيانات')).resolves.toBeUndefined()
  })
})
