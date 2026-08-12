import { formatAccountingDate } from '../../../shared/date-utils'
import { formatMoney } from '../../../shared/formatters'
import type { AdvanceTransaction } from '../types/advances.types'

const typeLabels: Record<string, string> = {
  expense: 'مصروف',
  return: 'رد',
}

export function AdvanceTransactionHistory({
  transactions,
  page,
  totalPages,
  totalCount,
  onPreviousPage,
  onNextPage,
  isLoading,
  error,
}: {
  transactions: AdvanceTransaction[]
  page: number
  totalPages: number
  totalCount: number
  onPreviousPage: () => void
  onNextPage: () => void
  isLoading: boolean
  error: string
}) {
  if (isLoading) {
    return (
      <div className="advance-history">
        <p className="advance-history__state">جاري تحميل الحركات...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="advance-history">
        <p className="advance-history__state advance-history__state--error">{error}</p>
      </div>
    )
  }

  return (
    <div className="advance-history">
      <div className="advance-history__header">
        <span>سجل الحركات</span>
        {totalCount > 0 && (
          <span className="advance-history__count">{totalCount.toLocaleString('ar-EG')} حركة</span>
        )}
      </div>

      {transactions.length === 0 ? (
        <p className="advance-history__state">لا توجد حركات مسجلة لهذه العهدة.</p>
      ) : (
        <div className="advance-history-table-wrap">
          <table className="advance-history-table">
            <thead>
              <tr>
                <th scope="col">التاريخ</th>
                <th scope="col">النوع</th>
                <th scope="col">المشروع</th>
                <th scope="col">البيان</th>
                <th scope="col">المبلغ</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td>{formatAccountingDate(tx.date, '—')}</td>
                  <td>
                    <span className={`advance-tx-type advance-tx-type--${tx.type}`}>
                      {typeLabels[tx.type] ?? tx.type}
                    </span>
                  </td>
                  <td>{tx.projectName ?? '—'}</td>
                  <td>{tx.description}</td>
                  <td className={tx.type === 'expense' ? 'amount-negative' : 'amount-positive'}>
                    {tx.type === 'expense' ? '−' : '+'} {formatMoney(tx.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="advance-history__pagination">
          <button type="button" onClick={onPreviousPage} disabled={page <= 1} aria-label="الصفحة السابقة">
            → السابق
          </button>
          <span>
            {page.toLocaleString('ar-EG')} / {totalPages.toLocaleString('ar-EG')}
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
    </div>
  )
}
