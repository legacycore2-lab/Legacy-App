import { formatMoneyInteger } from '../../../shared/formatters'
import type { ProjectHealthItem } from '../types'

const STATUS_LABEL: Record<string, string> = {
  active: 'نشط',
  completed: 'مكتمل',
  paused: 'متوقف',
  archived: 'مؤرشف',
  unknown: 'غير محدد',
}

type Props = {
  items: ProjectHealthItem[]
  title: string
  emptyMessage: string
}

export function ProjectHealthTable({ items, title, emptyMessage }: Props) {
  return (
    <div className="an-panel">
      <h3 className="an-panel__title">{title}</h3>
      {items.length === 0 ? (
        <p className="an-empty">{emptyMessage}</p>
      ) : (
        <div className="an-table-wrap">
          <table className="an-table">
            <thead>
              <tr>
                <th>المشروع</th>
                <th>الحالة</th>
                <th>الإيرادات</th>
                <th>المصروفات</th>
                <th>الصافي</th>
                <th>الهامش</th>
                <th>الإنجاز</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.name}</strong>
                    <small>{p.code}</small>
                  </td>
                  <td>
                    <span className={`an-badge is-${p.status}`}>{STATUS_LABEL[p.status] ?? p.status}</span>
                  </td>
                  <td className="is-positive">{formatMoneyInteger(p.income)}</td>
                  <td className="is-negative">{formatMoneyInteger(p.expense)}</td>
                  <td className={p.net >= 0 ? 'is-positive' : 'is-negative'}>{formatMoneyInteger(p.net)}</td>
                  <td>{p.profitMargin.toFixed(1)}٪</td>
                  <td>
                    <div className="an-progress">
                      <span style={{ width: `${p.progress}%` }} />
                    </div>
                    <small>{p.progress}٪</small>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
