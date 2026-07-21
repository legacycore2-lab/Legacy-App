export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
export type NormalBalance = 'debit' | 'credit'

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
}

export type AccountInput = Omit<Account, 'id' | 'level'> & { id?: string }
