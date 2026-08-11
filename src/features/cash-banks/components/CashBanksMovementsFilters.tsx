import type {
  CashBankAccountSummary,
  CashBankMovementsFilters,
  CashBankTransactionTypeFilter,
} from '../types/cash-banks.types'

const typeOptions: { value: CashBankTransactionTypeFilter; label: string }[] = [
  { value: 'all', label: 'كل الأنواع' },
  { value: 'deposit', label: 'إيداع' },
  { value: 'withdrawal', label: 'سحب' },
  { value: 'transfer', label: 'تحويل' },
]

export function CashBanksMovementsFilters({
  filters,
  accounts,
  onFiltersChange,
  onResetFilters,
}: {
  filters: CashBankMovementsFilters
  accounts: CashBankAccountSummary[]
  onFiltersChange: (next: CashBankMovementsFilters) => void
  onResetFilters: () => void
}) {
  const update = <K extends keyof CashBankMovementsFilters>(key: K, value: CashBankMovementsFilters[K]) =>
    onFiltersChange({ ...filters, [key]: value })

  const hasActiveFilters =
    filters.accountId !== '' ||
    filters.type !== 'all' ||
    filters.dateFrom !== '' ||
    filters.dateTo !== '' ||
    filters.query !== ''

  return (
    <div className="cash-banks-movements-filters">
      <select
        value={filters.accountId}
        onChange={(e) => update('accountId', e.target.value)}
        aria-label="تصفية حسب الحساب"
      >
        <option value="">كل الحسابات</option>
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>

      <select
        value={filters.type}
        onChange={(e) => update('type', e.target.value as CashBankTransactionTypeFilter)}
        aria-label="تصفية حسب نوع الحركة"
      >
        {typeOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <input
        type="date"
        value={filters.dateFrom}
        onChange={(e) => update('dateFrom', e.target.value)}
        aria-label="من تاريخ"
      />

      <input
        type="date"
        value={filters.dateTo}
        onChange={(e) => update('dateTo', e.target.value)}
        aria-label="إلى تاريخ"
      />

      <input
        type="search"
        value={filters.query}
        onChange={(e) => update('query', e.target.value)}
        placeholder="بحث في الوصف أو المرجع…"
        aria-label="بحث في الحركات"
        className="cash-banks-movements-filters__search"
      />

      {hasActiveFilters && (
        <button
          type="button"
          onClick={onResetFilters}
          className="cash-banks-movements-filters__reset"
          aria-label="إعادة ضبط الفلاتر"
        >
          إعادة ضبط
        </button>
      )}
    </div>
  )
}
