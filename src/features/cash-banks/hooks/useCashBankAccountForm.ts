import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { toErrorMessage } from '../../../shared/errors/app-error'
import {
  disableCashBankAccount,
  getCashBankAccount,
  getCashBankLedgerAccounts,
  saveCashBankAccount,
  validateCashBankAccountInput,
} from '../services/cash-banks.service'
import type { CashBankAccountFormState, CashBankAccountInput } from '../types/cash-banks.types'

const initialValue = (): CashBankAccountInput => ({
  ledgerMode: 'auto',
  ledgerAccountId: '',
  name: '',
  kind: 'cash',
  bankName: '',
  accountNumber: '',
  iban: '',
  branchName: '',
  openingBalance: '0',
  currencyCode: 'EGP',
  isActive: true,
})

export function useCashBankAccountForm(): CashBankAccountFormState {
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [value, setValue] = useState(initialValue)
  const errors = useMemo(() => validateCashBankAccountInput(value), [value])
  const ledgerQuery = useQuery({
    queryKey: ['cash-banks', 'ledger-accounts'],
    queryFn: getCashBankLedgerAccounts,
    staleTime: 60_000,
    enabled: isOpen,
  })
  const finish = async () => {
    await queryClient.invalidateQueries({ queryKey: ['cash-banks'] })
    setIsOpen(false)
    setEditingId(null)
    setSubmitted(false)
    setValue(initialValue())
  }
  const saveMutation = useMutation({
    mutationFn: () => saveCashBankAccount(value, editingId ?? undefined),
    onSuccess: finish,
  })
  const deactivateMutation = useMutation({
    mutationFn: (id: string) => disableCashBankAccount(id),
    onSuccess: finish,
  })
  const loadMutation = useMutation({
    mutationFn: getCashBankAccount,
    onSuccess: (account) => {
      setValue({
        ledgerMode: 'existing',
        ledgerAccountId: account.ledgerAccountId,
        name: account.name,
        kind: account.kind,
        bankName: account.bankName ?? '',
        accountNumber: account.accountNumber ?? '',
        iban: account.iban ?? '',
        branchName: account.branchName ?? '',
        openingBalance: String(account.openingBalance),
        currencyCode: account.currencyCode,
        isActive: account.isActive,
      })
    },
  })
  const reset = () => {
    saveMutation.reset()
    deactivateMutation.reset()
    loadMutation.reset()
  }

  return {
    isOpen,
    isEditing: editingId !== null,
    value,
    ledgerAccounts: ledgerQuery.data ?? [],
    errors,
    submitted,
    isLoading: loadMutation.isPending,
    isSaving: saveMutation.isPending || deactivateMutation.isPending || loadMutation.isPending,
    saveError:
      saveMutation.error || deactivateMutation.error || loadMutation.error || ledgerQuery.error
        ? toErrorMessage(
            saveMutation.error || deactivateMutation.error || loadMutation.error || ledgerQuery.error,
            'تعذر حفظ حساب الخزنة أو البنك.',
          )
        : '',
    update: (key, next) => {
      reset()
      setValue((current) => ({ ...current, [key]: next }))
    },
    openCreate: () => {
      reset()
      setEditingId(null)
      setSubmitted(false)
      setValue(initialValue())
      setIsOpen(true)
    },
    openEdit: async (id) => {
      reset()
      setEditingId(id)
      setSubmitted(false)
      setValue(initialValue())
      setIsOpen(true)
      await loadMutation.mutateAsync(id).catch(() => undefined)
    },
    close: () => {
      if (saveMutation.isPending || deactivateMutation.isPending) return
      setIsOpen(false)
      reset()
    },
    submit: async () => {
      setSubmitted(true)
      if (errors.length > 0 || saveMutation.isPending) return
      await saveMutation.mutateAsync().catch(() => undefined)
    },
    deactivate: async () => {
      if (!editingId || deactivateMutation.isPending) return
      await deactivateMutation.mutateAsync(editingId).catch(() => undefined)
    },
  }
}
