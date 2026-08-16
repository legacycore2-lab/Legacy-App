import { useMemo, useState, type FormEvent } from 'react'
import type { Account, AccountInput, AccountType } from '../types/accounts.types'

type Options = {
  allAccounts: Account[]
  editing: Account | null
  onSave: (input: AccountInput) => Promise<void>
  onCancel: () => void
}

function defaultParentId(accounts: Account[], accountType: AccountType): string | null {
  return (
    accounts.find(
      (account) =>
        account.accountType === accountType &&
        account.parentId === null &&
        account.isActive &&
        !account.isPostable,
    )?.id ?? null
  )
}

function emptyForm(accounts: Account[], accountType: AccountType = 'asset'): AccountInput {
  return {
    code: '',
    nameAr: '',
    nameEn: '',
    accountType,
    normalBalance: accountType === 'asset' || accountType === 'expense' ? 'debit' : 'credit',
    parentId: defaultParentId(accounts, accountType),
    isPostable: true,
    isActive: true,
  }
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

export function useAccountForm({ allAccounts, editing, onSave, onCancel }: Options) {
  const [value, setValue] = useState<AccountInput>(() =>
    editing ? toAccountInput(editing) : emptyForm(allAccounts),
  )

  const parentAccountOptions = useMemo(
    () =>
      allAccounts.filter(
        (account) =>
          account.accountType === value.accountType &&
          account.id !== value.id &&
          account.isActive &&
          !account.isPostable,
      ),
    [allAccounts, value.accountType, value.id],
  )

  const update = <Key extends keyof AccountInput>(key: Key, next: AccountInput[Key]) => {
    setValue((current) => ({ ...current, [key]: next }))
  }

  const updateType = (accountType: AccountType) => {
    setValue((current) => ({
      ...current,
      accountType,
      normalBalance: accountType === 'asset' || accountType === 'expense' ? 'debit' : 'credit',
      parentId: defaultParentId(allAccounts, accountType),
    }))
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()

    try {
      await onSave(value)
      setValue(emptyForm(allAccounts))
    } catch {
      // The mutation error is exposed by useAccounts and rendered by the page.
    }
  }

  const cancel = () => {
    setValue(emptyForm(allAccounts))
    onCancel()
  }

  return { value, update, updateType, submit, cancel, parentAccountOptions }
}
