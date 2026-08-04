import { BarChart2, FileText, Lightbulb, Table2 } from 'lucide-react'
import type { ReportsTab } from '../types/report.types'

type TabDef = {
  id: ReportsTab
  label: string
  icon: React.ElementType
  disabled?: boolean
}

const TABS: TabDef[] = [
  { id: 'executive', label: 'الملخص التنفيذي', icon: BarChart2 },
  { id: 'projects', label: 'المشاريع', icon: Table2 },
  { id: 'journal', label: 'القيود اليومية', icon: FileText },
  { id: 'insights', label: 'الرؤى والتنبيهات', icon: Lightbulb },
]

type Props = {
  activeTab: ReportsTab
  onChange: (tab: ReportsTab) => void
}

export function ReportsTabs({ activeTab, onChange }: Props) {
  return (
    <nav className="reports-tabs" aria-label="أقسام التقارير">
      {TABS.map(({ id, label, icon: Icon, disabled }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={activeTab === id}
          disabled={disabled}
          className={`reports-tab${activeTab === id ? ' is-active' : ''}${disabled ? ' is-disabled' : ''}`}
          onClick={() => !disabled && onChange(id)}
        >
          <Icon size={15} aria-hidden="true" />
          {label}
        </button>
      ))}
    </nav>
  )
}
