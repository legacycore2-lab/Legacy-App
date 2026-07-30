import { MoreVertical } from 'lucide-react'
import type { CashBankMovement } from '../types/cash-banks.types'

const movementLabels = {
  deposit: 'إيداع',
  withdrawal: 'سحب',
  transfer: 'تحويل',
  expense: 'مصروف',
} as const

export function CashBanksMovements({ movements }: { movements: CashBankMovement[] }) {
  return (
    <article className="cash-banks-panel cash-banks-movements">
      <div className="cash-banks-panel__header">
        <div>
          <span>مراقبة فورية</span>
          <h2>آخر الحركات</h2>
        </div>
        <button type="button">عرض الكل</button>
      </div>
      <div className="cash-banks-table-wrap">
        <table>
          <thead>
            <tr>
              <th>رقم الحركة</th>
              <th>التاريخ</th>
              <th>الحساب</th>
              <th>النوع</th>
              <th>المبلغ</th>
              <th>الرصيد بعد الحركة</th>
              <th>الحالة</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {movements.map((movement) => (
              <tr key={movement.id}>
                <td>{movement.number}</td>
                <td>
                  {movement.date}
                  <small>{movement.time}</small>
                </td>
                <td>{movement.account}</td>
                <td>
                  <span className={`movement-kind movement-kind--${movement.kind}`}>
                    {movementLabels[movement.kind]}
                  </span>
                </td>
                <td
                  className={
                    movement.amount.startsWith('+') ? 'amount-positive' : 'amount-negative'
                  }
                >
                  {movement.amount}
                </td>
                <td>{movement.balanceAfter}</td>
                <td>
                  <span className={`movement-status movement-status--${movement.status}`}>
                    {movement.status === 'completed' ? 'مكتملة' : 'قيد المراجعة'}
                  </span>
                </td>
                <td>
                  <button type="button">
                    <MoreVertical size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  )
}
