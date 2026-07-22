import { findJournalPostingOptions, postSingleLineEntry } from '../repositories/journal.repository'
import type {
  JournalPostingOptions,
  JournalPostingPreview,
  SingleLineJournalInput,
} from '../types/journal-entry.types'

export function getLocalDateInputValue(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function validateSingleLineEntry(input: SingleLineJournalInput): string[] {
  const errors: string[] = []
  const amount = Number(input.amount)

  if (!input.entryDate) errors.push('التاريخ مطلوب.')
  if (!input.projectId) errors.push('المشروع مطلوب.')
  if (!input.categoryAccountId) errors.push('البند مطلوب.')
  if (!input.description.trim()) errors.push('البيان مطلوب.')
  if (!input.paymentAccountId) errors.push('الحساب المقابل مطلوب.')
  if (input.categoryAccountId && input.categoryAccountId === input.paymentAccountId) {
    errors.push('يجب اختيار حسابين مختلفين لطرفي القيد.')
  }
  if (!Number.isFinite(amount) || amount <= 0) errors.push('أدخل مبلغًا صحيحًا أكبر من صفر.')

  return errors
}

export function buildJournalPreview(input: SingleLineJournalInput): JournalPostingPreview | null {
  const amount = Number(input.amount)

  if (!input.category.trim() || !input.paymentAccount.trim() || !Number.isFinite(amount) || amount <= 0) {
    return null
  }

  return input.type === 'expense'
    ? {
        debitAccount: input.category.trim(),
        creditAccount: input.paymentAccount.trim(),
        amount,
      }
    : {
        debitAccount: input.paymentAccount.trim(),
        creditAccount: input.category.trim(),
        amount,
      }
}

export async function submitSingleLineEntry(input: SingleLineJournalInput): Promise<string> {
  const errors = validateSingleLineEntry(input)
  if (errors.length > 0) throw new Error(errors[0])

  return postSingleLineEntry(input)
}

export async function getJournalPostingOptions(): Promise<JournalPostingOptions> {
  return findJournalPostingOptions()
}
