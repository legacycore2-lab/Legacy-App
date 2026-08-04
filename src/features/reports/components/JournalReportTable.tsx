import { formatMoneyInteger } from '../../../shared/formatters'
import type { ReportJournalRow } from '../types/report.types'

const TYPE_LABEL: Record<string, string> = {
  income: 'إيراد',
  expense: 'مصروف',
  unknown: 'غير محدد',
}

type Props = {
  rows: ReportJournalRow[]
  isLoading: boolean
}

export function JournalReportTable({ rows, isLoading }: Props) {
  if (isLoading) {
    return <div className="reports-state">جارٍ تحميل القيود...</div>
  }

  if (rows.length === 0) {
    return <div className="reports-state">لا توجد قيود مطابقة للفلاتر.</div>
  }

  return (
    <div className="reports-table-wrap">
      <table className="reports-table">
        <thead>
          <tr>
            <th>التاريخ</th>
            <th>النوع</th>
            <th>المشروع</th>
            <th>المقاول</th>
            <th>طريقة الدفع</th>
            <th>الوصف</th>
            <th>المبلغ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.dateFormatted}</td>
              <td>
                <span className={`reports-status is-${row.entryType}`}>
                  {TYPE_LABEL[row.entryType] ?? row.entryType}
                </span>
              </td>
              <td>{row.projectName}</td>
              <td>{row.contractorName}</td>
              <td>{row.paymentMethod}</td>
              <td className="reports-td-truncate">{row.description}</td>
              <td
                className={
                  row.entryType === 'income'
                    ? 'is-positive'
                    : row.entryType === 'expense'
                      ? 'is-negative'
                      : ''
                }
              >
                {formatMoneyInteger(row.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
