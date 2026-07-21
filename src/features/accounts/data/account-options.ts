import type { AccountType } from '../types/accounts.types'

export const accountTypes: { value: AccountType; label: string }[] = [
  { value: 'asset', label: 'الأصول' },
  { value: 'liability', label: 'الالتزامات' },
  { value: 'equity', label: 'حقوق الملكية' },
  { value: 'revenue', label: 'الإيرادات' },
  { value: 'expense', label: 'المصروفات' },
]

export function getAccountTypeLabel(type: AccountType): string {
  return accountTypes.find((item) => item.value === type)?.label ?? type
}
