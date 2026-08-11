import { MoreVertical } from 'lucide-react'
import type {
  CashBankAccountSummary,
  CashBankMovement,
  CashBankMovementsFilters,
} from '../types/cash-banks.types'
import { CashBanksMovementsFilters } from './CashBanksMovementsFilters'

const movementLabels: Record<string, string> = {
  deposit: 'إيداع',
  withdrawal: 'سحب',
  transfer: 'تحويل',
}

const statusLabels: Record<string, string> = {
  draft: 'مسودة',
  posted: 'مرحّلة',
  void: 'ملغاة',
}

export function CashBanksMovements({
  movements,
  accounts,
  filters,
  onFiltersChange,
  onResetFilters,
  page,
  totalPages,
  totalCount,
  onPreviousPage,
  onNextPage,
  isLoading,
  onReverse,
}: {
  movements: CashBankMovement[]
  accounts: CashBankAccountSummary[]
  filters: CashBankMovementsFilters
  onFiltersChange: (next: CashBankMovementsFilters) => void
  onResetFilters: () => void
  page: number
  totalPages: number
  totalCount: number
  onPreviousPage: () => void
  onNextPage: () => void
  isLoading: boolean
  onReverse: (movement: CashBankMovement) => void
}) {
  return (
    <article className="cash-banks-panel cash-banks-movements">
      <div className="cash-banks-panel__header">
        <div>
          <span>سجل الحركات</span>
          <h2>
            الحركات
            {totalCount > 0 && (
              <span className="cash-banks-movements__count">{totalCount.toLocaleString('ar-EG')} حركة</span>
            )}
          </h2>
        </div>
      </div>

      <CashBanksMovementsFilters
        filters={filters}
        accounts={accounts}
        onFiltersChange={onFiltersChange}
        onResetFilters={onResetFilters}
      />

      <div className="cash-banks-table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">رقم الحركة</th>
              <th scope="col">التاريخ</th>
              <th scope="col">الحساب</th>
              <th scope="col">النوع</th>
              <th scope="col">المبلغ</th>
              <th scope="col">الحالة</th>
              <th scope="col" />
            </tr>
          </thead>
          <tbody>
            {movements.length === 0 && !isLoading ? (
              <tr>
                <td colSpan={7} className="cash-banks-movements__empty">
                  لا توجد حركات تطابق البحث.
                </td>
              </tr>
            ) : (
              movements.map((movement) => (
                <tr key={movement.id}>
                  <td>{movement.number}</td>
                  <td>{movement.date}</td>
                  <td>{movement.account}</td>
                  <td>
                    <span className={`movement-kind movement-kind--${movement.type}`}>
                      {movementLabels[movement.type] ?? movement.type}
                    </span>
                  </td>
                  <td className={movement.amount.startsWith('+') ? 'amount-positive' : 'amount-negative'}>
                    {movement.amount}
                  </td>
                  <td>
                    <span className={`movement-status movement-status--${movement.status}`}>
                      {statusLabels[movement.status] ?? movement.status}
                    </span>
                  </td>
                  <td>
                    {movement.canReverse ? (
                      <button
                        type="button"
                        onClick={() => onReverse(movement)}
                        aria-label={`عكس الحركة ${movement.number}`}
                      >
                        عكس
                      </button>
                    ) : (
                      <MoreVertical size={16} aria-hidden="true" />
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="cash-banks-movements__pagination">
          <button type="button" onClick={onPreviousPage} disabled={page <= 1} aria-label="الصفحة السابقة">
            → السابق
          </button>
          <span className="cash-banks-movements__pagination-info">
            صفحة {page.toLocaleString('ar-EG')} من {totalPages.toLocaleString('ar-EG')}
          </span>
          <button
            type="button"
            onClick={onNextPage}
            disabled={page >= totalPages}
            aria-label="الصفحة التالية"
          >
            التالي ←
          </button>
        </div>
      )}
    </article>
  )
}
