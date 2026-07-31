import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useRef, useState } from 'react'
import { toErrorMessage } from '../../../shared/errors/app-error'
import {
  createCashBankTransfer,
  getCashBankTransferOptions,
  validateCashBankTransferInput,
} from '../services/cash-banks.service'
import type { CashBankTransferFormState, CashBankTransferInput } from '../types/cash-banks.types'

const initialValue = (): CashBankTransferInput => ({
  sourceAccountId: '',
  destinationAccountId: '',
  transactionDate: new Date().toISOString().slice(0, 10),
  amount: '',
  description: '',
  referenceNumber: '',
})

export function useCashBankTransferForm(): CashBankTransferFormState {
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [value, setValue] = useState(initialValue)
  const requestId = useRef(crypto.randomUUID())
  const optionsQuery = useQuery({
    queryKey: ['cash-banks', 'transfer-options'],
    queryFn: getCashBankTransferOptions,
    staleTime: 60_000,
  })
  const selectedSource = optionsQuery.data?.accounts.find((account) => account.id === value.sourceAccountId)
  const errors = useMemo(
    () => validateCashBankTransferInput(value, selectedSource?.currentBalance),
    [selectedSource?.currentBalance, value],
  )
  const mutation = useMutation({
    mutationFn: () => createCashBankTransfer(value, requestId.current, selectedSource?.currentBalance),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cash-banks'] })
      setIsOpen(false)
      setSubmitted(false)
      setValue(initialValue())
      requestId.current = crypto.randomUUID()
    },
  })

  return {
    isOpen,
    value,
    accounts: optionsQuery.data?.accounts ?? [],
    errors,
    submitted,
    isSaving: mutation.isPending,
    saveError:
      mutation.error || optionsQuery.error
        ? toErrorMessage(mutation.error || optionsQuery.error, 'تعذر تسجيل التحويل.')
        : '',
    update: (key, next) => {
      mutation.reset()
      setValue((current) => ({ ...current, [key]: next }))
    },
    open: () => {
      mutation.reset()
      setSubmitted(false)
      setValue(initialValue())
      requestId.current = crypto.randomUUID()
      setIsOpen(true)
    },
    close: () => {
      if (mutation.isPending) return
      setIsOpen(false)
      mutation.reset()
    },
    submit: async () => {
      setSubmitted(true)
      if (errors.length > 0 || mutation.isPending) return
      await mutation.mutateAsync().catch(() => undefined)
    },
  }
}
