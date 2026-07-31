import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo, useRef, useState } from 'react'
import { toErrorMessage } from '../../../shared/errors/app-error'
import { createCashBankReversal, validateCashBankReversalInput } from '../services/cash-banks.service'
import type { CashBankMovement, CashBankReversalFormState } from '../types/cash-banks.types'

const today = () => new Date().toISOString().slice(0, 10)

export function useCashBankReversalForm(): CashBankReversalFormState {
  const queryClient = useQueryClient()
  const [movement, setMovement] = useState<CashBankMovement | null>(null)
  const [reversalDate, setReversalDate] = useState(today)
  const [reason, setReason] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const requestId = useRef(crypto.randomUUID())
  const errors = useMemo(
    () => validateCashBankReversalInput({ transactionId: movement?.id ?? '', reversalDate, reason }),
    [movement?.id, reason, reversalDate],
  )
  const mutation = useMutation({
    mutationFn: () =>
      createCashBankReversal({ transactionId: movement?.id ?? '', reversalDate, reason }, requestId.current),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cash-banks'] })
      setMovement(null)
      setSubmitted(false)
      setReason('')
      requestId.current = crypto.randomUUID()
    },
  })

  return {
    isOpen: movement !== null,
    movement,
    reversalDate,
    reason,
    errors,
    submitted,
    isSaving: mutation.isPending,
    saveError: mutation.error ? toErrorMessage(mutation.error, 'تعذر عكس الحركة.') : '',
    updateDate: setReversalDate,
    updateReason: (value) => {
      mutation.reset()
      setReason(value)
    },
    open: (selected) => {
      mutation.reset()
      setMovement(selected)
      setReversalDate(today())
      setReason('')
      setSubmitted(false)
      requestId.current = crypto.randomUUID()
    },
    close: () => {
      if (mutation.isPending) return
      setMovement(null)
      mutation.reset()
    },
    submit: async () => {
      setSubmitted(true)
      if (errors.length > 0 || mutation.isPending) return
      await mutation.mutateAsync().catch(() => undefined)
    },
  }
}
