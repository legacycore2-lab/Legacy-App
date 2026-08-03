import { formatAccountingDate } from '../../../shared/date-utils'
import { formatMoneyInteger } from '../../../shared/formatters'
import type { Contractor, ContractorSort } from '../types/contractor.types'

type Props = {
  contractors: Contractor[]
  sort: ContractorSort
  onSort: (s: ContractorSort) => void
  onSelect: (c: Contractor) => void
  selectedKey: string | null
}

const SORT_COLS: { key: ContractorSort; label: string }[] = [
  { key: 'name', label: 'المقاول' },
  { key: 'expense', label: 'إجمالي المصروفات' },
  { key: 'entries', label: 'عدد القيود' },
  { key: 'latest', label: 'آخر حركة' },
]

export function ContractorsTable({ contractors, sort, onSort, onSelect, selectedKey }: Props) {
  return (
    <div className="contractors-table-wrap">
      <table className="contractors-table">
        <thead>
          <tr>
            {SORT_COLS.map(({ key, label }) => (
              <th
                key={key}
                scope="col"
                className={sort === key ? 'is-sorted' : ''}
                onClick={() => onSort(key)}
                aria-sort={sort === key ? 'descending' : 'none'}
              >
                {label}
                {sort === key && <span aria-hidden="true"> ↓</span>}
              </th>
            ))}
            <th scope="col">المشاريع</th>
          </tr>
        </thead>
        <tbody>
          {contractors.map((c) => (
            <tr
              key={c.key}
              className={selectedKey === c.key ? 'is-selected' : ''}
              onClick={() => onSelect(c)}
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onSelect(c)}
              aria-label={`عرض تفاصيل ${c.name}`}
            >
              <td data-label="المقاول">
                <strong>{c.name}</strong>
              </td>
              <td data-label="إجمالي المصروفات" className="is-expense">
                {formatMoneyInteger(c.totalExpense)}
              </td>
              <td data-label="عدد القيود">{c.entryCount}</td>
              <td data-label="آخر حركة">{formatAccountingDate(c.latestActivityDate)}</td>
              <td data-label="المشاريع">{c.projectCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
