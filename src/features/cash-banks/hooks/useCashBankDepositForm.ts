import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useRef, useState } from 'react'
import { toErrorMessage } from '../../../shared/errors/app-error'
import {
  createCashBankDeposit,
  getCashBankDepositOptions,
  validateCashBankDepositInput,
} from '../services/cash-banks.service'
import type { CashBankDepositFormState, CashBankDepositInput } from '../types/cash-banks.types'

const initialValue = (): CashBankDepositInput => ({
  destinationAccountId: '',
  offsetAccountId: '',
  transactionDate: new Date().toISOString().slice(0, 10),
  amount: '',
  description: '',
  referenceNumber: '',
})

export function useCashBankDepositForm(): CashBankDepositFormState {
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [value, setValue] = useState(initialValue)
  const requestId = useRef(crypto.randomUUID())
  const optionsQuery = useQuery({
    queryKey: ['cash-banks', 'deposit-options'],
    queryFn: getCashBankDepositOptions,
    staleTime: 60_000,
    enabled: isOpen,
  })
  const selectedDestination = optionsQuery.data?.destinationAccounts.find(
    (account) => account.id === value.destinationAccountId,
  )
  const errors = useMemo(
    () => validateCashBankDepositInput(value, selectedDestination?.ledgerAccountId),
    [selectedDestination?.ledgerAccountId, value],
  )
  const mutation = useMutation({
    mutationFn: () => createCashBankDeposit(value, requestId.current, selectedDestination?.ledgerAccountId),
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
    destinationAccounts: optionsQuery.data?.destinationAccounts ?? [],
    offsetAccounts: optionsQuery.data?.offsetAccounts ?? [],
    errors,
    submitted,
    isSaving: mutation.isPending,
    saveError:
      mutation.error || optionsQuery.error
        ? toErrorMessage(mutation.error || optionsQuery.error, 'تعذر تسجيل الإيداع.')
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
