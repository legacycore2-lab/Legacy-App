import { BarChart2, FileText, Lightbulb, Table2 } from 'lucide-react'
import type { ReportsTab } from '../types/report.types'

type TabDef = {
  id: ReportsTab
  label: string
  icon: React.ElementType
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
  function handleKeyDown(e: React.KeyboardEvent, id: ReportsTab) {
    const idx = TABS.findIndex((t) => t.id === id)
    if (e.key === 'ArrowRight' && idx > 0) onChange(TABS[idx - 1].id)
    if (e.key === 'ArrowLeft' && idx < TABS.length - 1) onChange(TABS[idx + 1].id)
  }

  return (
    <nav className="seg-control" role="tablist" aria-label="أقسام التقارير">
      <div className="seg-control__track">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              className={`seg-control__btn${active ? ' is-active' : ''}`}
              onClick={() => onChange(id)}
              onKeyDown={(e) => handleKeyDown(e, id)}
            >
              <Icon size={14} aria-hidden="true" />
              <span>{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
