export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
export type NormalBalance = 'debit' | 'credit'
export type AccountCashBankKind = 'none' | 'cash' | 'bank'

export type Account = {
  id: string
  code: string
  nameAr: string
  nameEn: string
  accountType: AccountType
  normalBalance: NormalBalance
  parentId: string | null
  level: number
  isPostable: boolean
  isActive: boolean
  deletedAt: string | null
  cashBankKind: AccountCashBankKind
}

export type AccountInput = Omit<Account, 'id' | 'level' | 'deletedAt' | 'cashBankKind'> & {
  id?: string
  cashBankKind?: AccountCashBankKind
}
