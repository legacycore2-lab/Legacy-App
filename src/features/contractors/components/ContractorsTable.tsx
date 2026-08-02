import type { Contractor, ContractorSort } from '../types/contractor.types'

type Props = {
  contractors: Contractor[]
  sort: ContractorSort
  onSort: (s: ContractorSort) => void
  onSelect: (c: Contractor) => void
  selectedKey: string | null
}

const money = new Intl.NumberFormat('ar-EG', {
  style: 'currency',
  currency: 'EGP',
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat('ar-EG', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
})

function formatDate(dateKey: string): string {
  const parts = dateKey.slice(0, 10).split('-').map(Number)
  const y = parts[0] ?? 0
  const m = parts[1] ?? 1
  const d = parts[2] ?? 1
  if (!y) return dateKey
  return dateFormatter.format(new Date(Date.UTC(y, m - 1, d)))
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
                {money.format(c.totalExpense)}
              </td>
              <td data-label="عدد القيود">{c.entryCount}</td>
              <td data-label="آخر حركة">{formatDate(c.latestActivityDate)}</td>
              <td data-label="المشاريع">{c.projectCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
