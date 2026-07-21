import { useState, type FormEvent } from 'react'
import type { Account, AccountInput, AccountType } from '../types/accounts.types'

const emptyForm: AccountInput = {
  code: '',
  nameAr: '',
  nameEn: '',
  accountType: 'asset',
  normalBalance: 'debit',
  parentId: null,
  isPostable: true,
  isActive: true,
}

type Options = {
  editing: Account | null
  onSave: (input: AccountInput) => Promise<void>
  onCancel: () => void
}

function toAccountInput(account: Account): AccountInput {
  return {
    id: account.id,
    code: account.code,
    nameAr: account.nameAr,
    nameEn: account.nameEn,
    accountType: account.accountType,
    normalBalance: account.normalBalance,
    parentId: account.parentId,
    isPostable: account.isPostable,
    isActive: account.isActive,
  }
}

export function useAccountForm({ editing, onSave, onCancel }: Options) {
  const [value, setValue] = useState<AccountInput>(() => (editing ? toAccountInput(editing) : emptyForm))

  const update = <Key extends keyof AccountInput>(key: Key, next: AccountInput[Key]) => {
    setValue((current) => ({ ...current, [key]: next }))
  }

  const updateType = (accountType: AccountType) => {
    setValue((current) => ({
      ...current,
      accountType,
      normalBalance: accountType === 'asset' || accountType === 'expense' ? 'debit' : 'credit',
      parentId: null,
    }))
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()

    try {
      await onSave(value)
      setValue(emptyForm)
    } catch {
      // The mutation error is exposed by useAccounts and rendered by the page.
    }
  }

  const cancel = () => {
    setValue(emptyForm)
    onCancel()
  }

  return { value, update, updateType, submit, cancel }
}
