import {
  findSingleLineCashBankLink,
  findJournalReversalContext,
  findJournalPostingOptions,
  findJournalStatus,
  findReversalJournalId,
  forceDeleteJournalEntry,
  postSingleLineEntry,
  reverseJournalEntry,
  subscribeToJournalPostingOptionChanges,
  ensureSingleLineCashBankMovement,
  ensureJournalCashBankReversal,
} from '../repositories/journal.repository'
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

  const entryId = await postSingleLineEntry(input)
  const link = await findSingleLineCashBankLink(entryId, input.paymentAccountId)

  if (link) {
    const isExpense = input.type === 'expense'
    await ensureSingleLineCashBankMovement({
      clientRequestId: input.requestId,
      transactionDate: input.entryDate,
      transactionType: isExpense ? 'withdrawal' : 'deposit',
      sourceAccountId: isExpense ? link.cashBankAccountId : null,
      destinationAccountId: isExpense ? null : link.cashBankAccountId,
      amount: Number(input.amount),
      description: input.description.trim(),
      referenceNumber: entryId,
      journalId: link.journalId,
    })
  }

  return entryId
}

export async function getJournalPostingOptions(): Promise<JournalPostingOptions> {
  return findJournalPostingOptions()
}

export function watchJournalPostingOptions(onChange: () => void): () => void {
  return subscribeToJournalPostingOptionChanges(onChange)
}

export async function reverseEntry(entryId: string): Promise<string> {
  if (!entryId) throw new Error('معرّف القيد مطلوب.')
  const context = await findJournalReversalContext(entryId)
  let reversalEntryId = context.reversalEntryId

  if (context.originalJournalStatus === 'posted') {
    reversalEntryId = await reverseJournalEntry(entryId)
  } else if (context.originalJournalStatus !== 'reversed' || !reversalEntryId) {
    throw new Error('Only posted entries can be reversed.')
  }

  if (context.originalMovement && !context.movementAlreadyReversed) {
    const reversalJournalId = await findReversalJournalId(reversalEntryId)
    const isDeposit = context.originalMovement.transactionType === 'deposit'
    await ensureJournalCashBankReversal({
      originalMovementId: context.originalMovement.id,
      reversalJournalId,
      transactionDate: getLocalDateInputValue(),
      transactionType: isDeposit ? 'withdrawal' : 'deposit',
      sourceAccountId: isDeposit ? context.originalMovement.destinationAccountId : null,
      destinationAccountId: isDeposit ? null : context.originalMovement.sourceAccountId,
      amount: context.originalMovement.amount,
      referenceNumber: context.originalMovement.referenceNumber,
    })
  }

  return reversalEntryId
}

export async function forceDeleteEntry(entryId: string, reason: string): Promise<void> {
  if (!entryId) throw new Error('معرّف القيد مطلوب.')
  if (reason.trim().length < 5) throw new Error('سبب الحذف يجب أن يكون 5 أحرف على الأقل.')
  const status = await findJournalStatus(entryId)
  if (status !== 'draft') throw new Error('Posted or reversed entries must be reversed, not deleted.')
  return forceDeleteJournalEntry(entryId, reason)
}
