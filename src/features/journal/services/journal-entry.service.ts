import { AppError } from '../../../shared/errors/app-error'
import { postSingleLineEntry } from '../repositories/journal.repository'
import type { JournalPostingPreview, SingleLineJournalInput } from '../types/journal-entry.types'

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string') return message
  }

  return ''
}

function mapJournalPostingError(error: unknown): AppError {
  const message = getErrorMessage(error)

  if (message.includes('Insufficient permissions')) {
    return new AppError('ليست لديك صلاحية ترحيل القيود.', 'JOURNAL_PERMISSION_DENIED', { cause: error })
  }

  if (message.includes('Project not found or archived')) {
    return new AppError('المشروع غير موجود أو مؤرشف. اختر مشروعًا نشطًا.', 'JOURNAL_PROJECT_NOT_FOUND', {
      cause: error,
    })
  }

  if (message.includes('Category account not found')) {
    return new AppError(
      'البند المحاسبي غير موجود أو غير مناسب لنوع القيد.',
      'JOURNAL_CATEGORY_ACCOUNT_INVALID',
      {
        cause: error,
      },
    )
  }

  if (message.includes('Payment account not found')) {
    return new AppError('الحساب المقابل غير موجود أو غير متاح للترحيل.', 'JOURNAL_PAYMENT_ACCOUNT_INVALID', {
      cause: error,
    })
  }

  if (message.includes('Journal sides must use different accounts')) {
    return new AppError('يجب اختيار حسابين مختلفين لطرفي القيد.', 'JOURNAL_DUPLICATE_ACCOUNT', {
      cause: error,
    })
  }

  return new AppError(
    'تعذر حفظ وترحيل القيد. راجع البيانات وحاول مرة أخرى.',
    'JOURNAL_POSTING_FAILED',
    {
      cause: error,
    },
  )
}

export function validateSingleLineEntry(input: SingleLineJournalInput): string[] {
  const errors: string[] = []
  const amount = Number(input.amount)

  if (!input.entryDate) errors.push('التاريخ مطلوب.')
  if (!input.projectName.trim()) errors.push('المشروع مطلوب.')
  if (!input.category.trim()) errors.push('البند مطلوب.')
  if (!input.description.trim()) errors.push('البيان مطلوب.')
  if (!input.paymentAccount.trim()) errors.push('الحساب المقابل مطلوب.')
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
  if (errors.length > 0) throw new AppError(errors[0], 'JOURNAL_VALIDATION_ERROR')

  try {
    return await postSingleLineEntry(input)
  } catch (error) {
    throw mapJournalPostingError(error)
  }
}
