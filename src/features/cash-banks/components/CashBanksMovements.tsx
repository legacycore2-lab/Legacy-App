import { MoreVertical } from 'lucide-react'
import type { CashBankMovement } from '../types/cash-banks.types'

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
  onReverse,
}: {
  movements: CashBankMovement[]
  onReverse: (movement: CashBankMovement) => void
}) {
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
            {movements.map((movement) => (
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
            ))}
          </tbody>
        </table>
      </div>
    </article>
  )
}
