import { FileBarChart, FileSpreadsheet, FileText, Printer } from 'lucide-react'
import { formatAccountingDate } from '../../../shared/date-utils'
import { formatMoneyInteger } from '../../../shared/formatters'
import { useProjectReportExport } from '../hooks/useProjectReportExport'
import type { ProjectDetailsViewModel, ProjectJournalViewModel } from '../types/project.types'
import '../styles/project-report-export.css'

type Props = {
  viewModel: ProjectDetailsViewModel
  journalViewModel: ProjectJournalViewModel | null | undefined
}

export function WorkspaceReportsTab({ viewModel, journalViewModel }: Props) {
  const { project, summary, progress, remaining, profitMargin } = viewModel
  const entries = journalViewModel?.entries ?? []
  const { isExporting, exportError, exportExcel, exportWord } = useProjectReportExport({
    viewModel,
    journalViewModel,
  })

  return (
    <article className="project-command__panel project-report" aria-labelledby="project-report-title">
      <header className="project-report__header">
        <div>
          <span>تقرير تشغيلي</span>
          <h2 id="project-report-title">ملخص مشروع {project.name}</h2>
          <p>تقرير مباشر من بيانات المشروع والقيود المسجلة حتى لحظة التصدير أو الطباعة.</p>
        </div>
        <div className="project-report__actions">
          <button
            type="button"
            className="project-workspace__quick-button"
            onClick={exportExcel}
            disabled={isExporting || entries.length === 0}
          >
            <FileSpreadsheet size={17} /> Excel
          </button>
          <button
            type="button"
            className="project-workspace__quick-button"
            onClick={exportWord}
            disabled={isExporting || entries.length === 0}
          >
            <FileText size={17} /> Word
          </button>
          <button
            type="button"
            className="project-workspace__quick-button is-primary"
            onClick={() => window.print()}
          >
            <Printer size={17} /> طباعة التقرير
          </button>
        </div>
      </header>

      {exportError ? (
        <div className="project-command__empty" role="alert">
          {exportError}
        </div>
      ) : null}

      <section className="project-report__facts" aria-label="بيانات المشروع">
        <div>
          <span>الكود</span>
          <strong>{project.code || '—'}</strong>
        </div>
        <div>
          <span>العميل</span>
          <strong>{project.client || '—'}</strong>
        </div>
        <div>
          <span>المدير</span>
          <strong>{project.manager || '—'}</strong>
        </div>
        <div>
          <span>الفترة</span>
          <strong>
            {formatAccountingDate(project.startDate)} — {formatAccountingDate(project.endDate)}
          </strong>
        </div>
      </section>

      <section className="project-report__metrics" aria-label="المؤشرات المالية">
        <div>
          <span>قيمة العقد</span>
          <strong>{formatMoneyInteger(project.contractValue)}</strong>
        </div>
        <div>
          <span>الإيرادات</span>
          <strong>{formatMoneyInteger(summary.totalIncome)}</strong>
        </div>
        <div>
          <span>المصروفات</span>
          <strong>{formatMoneyInteger(summary.totalExpense)}</strong>
        </div>
        <div>
          <span>صافي الحركة</span>
          <strong>{formatMoneyInteger(summary.balance)}</strong>
        </div>
        <div>
          <span>المتبقي من العقد</span>
          <strong>{formatMoneyInteger(remaining)}</strong>
        </div>
        <div>
          <span>الإنجاز / هامش الربح</span>
          <strong>
            {progress}% / {profitMargin}%
          </strong>
        </div>
      </section>

      <section className="project-report__entries">
        <div className="project-command__panel-heading">
          <div>
            <span>السجل المالي</span>
            <h3>القيود ({entries.length})</h3>
          </div>
          <FileBarChart size={20} />
        </div>
        {entries.length === 0 ? (
          <div className="project-command__empty">لا توجد قيود مسجلة لهذا المشروع.</div>
        ) : (
          <div className="project-journal-tab__table-wrap">
            <table className="project-journal-tab__table">
              <thead>
                <tr>
                  <th>رقم</th>
                  <th>التاريخ</th>
                  <th>النوع</th>
                  <th>البيان</th>
                  <th>المبلغ</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.seq ?? '—'}</td>
                    <td>{formatAccountingDate(entry.entryDate)}</td>
                    <td>
                      {entry.type === 'income' ? 'إيراد' : entry.type === 'expense' ? 'مصروف' : 'غير معروف'}
                    </td>
                    <td>{entry.description || 'بدون بيان'}</td>
                    <td>
                      <bdi dir="ltr">{formatMoneyInteger(entry.amount)}</bdi>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </article>
  )
}
