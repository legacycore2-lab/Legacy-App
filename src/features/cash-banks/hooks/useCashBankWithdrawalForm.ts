import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useRef, useState } from 'react'
import { toErrorMessage } from '../../../shared/errors/app-error'
import {
  createCashBankWithdrawal,
  getCashBankWithdrawalOptions,
  validateCashBankWithdrawalInput,
} from '../services/cash-banks.service'
import type { CashBankWithdrawalFormState, CashBankWithdrawalInput } from '../types/cash-banks.types'

const initialValue = (): CashBankWithdrawalInput => ({
  sourceAccountId: '',
  offsetAccountId: '',
  transactionDate: new Date().toISOString().slice(0, 10),
  amount: '',
  description: '',
  referenceNumber: '',
})

export function useCashBankWithdrawalForm(): CashBankWithdrawalFormState {
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [value, setValue] = useState(initialValue)
  const requestId = useRef(crypto.randomUUID())
  const optionsQuery = useQuery({
    queryKey: ['cash-banks', 'withdrawal-options'],
    queryFn: getCashBankWithdrawalOptions,
    staleTime: 60_000,
    enabled: isOpen,
  })
  const selectedSource = optionsQuery.data?.sourceAccounts.find(
    (account) => account.id === value.sourceAccountId,
  )
  const errors = useMemo(
    () =>
      validateCashBankWithdrawalInput(value, selectedSource?.ledgerAccountId, selectedSource?.currentBalance),
    [selectedSource?.currentBalance, selectedSource?.ledgerAccountId, value],
  )
  const mutation = useMutation({
    mutationFn: () =>
      createCashBankWithdrawal(
        value,
        requestId.current,
        selectedSource?.ledgerAccountId,
        selectedSource?.currentBalance,
      ),
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
    sourceAccounts: optionsQuery.data?.sourceAccounts ?? [],
    offsetAccounts: optionsQuery.data?.offsetAccounts ?? [],
    errors,
    submitted,
    isSaving: mutation.isPending,
    saveError:
      mutation.error || optionsQuery.error
        ? toErrorMessage(mutation.error || optionsQuery.error, 'تعذر تسجيل السحب.')
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
