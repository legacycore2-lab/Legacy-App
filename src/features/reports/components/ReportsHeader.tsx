import { Printer, RefreshCw } from 'lucide-react'

type Props = {
  onRefresh: () => void
}

export function ReportsHeader({ onRefresh }: Props) {
  return (
    <header className="reports-header">
      <div className="reports-header__text">
        <span className="reports-label">مركز التقارير والتحليلات</span>
        <h1>التقارير</h1>
        <p>ملخص مالي مباشر لجميع المشاريع من القيود المسجلة في النظام.</p>
      </div>
      <div className="reports-header__actions">
        <button type="button" onClick={onRefresh} className="reports-btn">
          <RefreshCw size={16} />
          تحديث
        </button>
        <button type="button" onClick={() => window.print()} className="reports-btn is-primary">
          <Printer size={16} />
          طباعة
        </button>
      </div>
    </header>
  )
}
