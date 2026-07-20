import { X } from 'lucide-react'
import { useProjectForm } from '../hooks/useProjectForm'

type ProjectFormDialogProps = {
  open: boolean
  onClose: () => void
}

export function ProjectFormDialog({ open, onClose }: ProjectFormDialogProps) {
  const { values, errors, updateValue, submit, isSaving, saveError } = useProjectForm(onClose)

  if (!open) return null

  return (
    <div className="project-form-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="project-form-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-form-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="project-form-dialog__header">
          <div>
            <span>Projects 2.0</span>
            <h2 id="project-form-title">إضافة مشروع جديد</h2>
            <p>سجّل البيانات الأساسية ونسبة التنفيذ ليظهر المشروع مباشرة في لوحة المتابعة.</p>
          </div>
          <button type="button" className="project-form-dialog__close" onClick={onClose} aria-label="إغلاق">
            <X size={20} />
          </button>
        </header>

        <div className="project-form-grid">
          <label className="project-form-field project-form-field--wide">
            <span>اسم المشروع *</span>
            <input
              value={values.name}
              onChange={(event) => updateValue('name', event.target.value)}
              placeholder="مثال: فيلا بالم هيلز"
              autoFocus
            />
            {errors.name && <small>{errors.name}</small>}
          </label>

          <label className="project-form-field project-form-field--wide">
            <span>اسم العميل</span>
            <input
              value={values.clientName}
              onChange={(event) => updateValue('clientName', event.target.value)}
              placeholder="اسم العميل أو الشركة"
            />
          </label>

          <label className="project-form-field">
            <span>تاريخ البداية</span>
            <input
              type="date"
              value={values.startDate}
              onChange={(event) => updateValue('startDate', event.target.value)}
            />
          </label>

          <label className="project-form-field">
            <span>تاريخ الانتهاء</span>
            <input
              type="date"
              value={values.closeDate}
              onChange={(event) => updateValue('closeDate', event.target.value)}
            />
            {errors.closeDate && <small>{errors.closeDate}</small>}
          </label>

          <label className="project-form-field project-form-field--wide">
            <span>نسبة التنفيذ: {values.progress}%</span>
            <input
              type="range"
              min="0"
              max="100"
              value={values.progress}
              disabled={Boolean(values.closeDate)}
              onChange={(event) => updateValue('progress', Number(event.target.value))}
            />
            <div className="project-form-progress" aria-hidden="true">
              <span style={{ width: `${values.closeDate ? 100 : values.progress}%` }} />
            </div>
            {values.closeDate && <em>المشروع المغلق يُسجل بنسبة تنفيذ 100% تلقائيًا.</em>}
            {errors.progress && <small>{errors.progress}</small>}
          </label>
        </div>

        {saveError && <div className="project-form-error">{saveError}</div>}

        <footer className="project-form-dialog__footer">
          <button type="button" className="projects-secondary-action" onClick={onClose} disabled={isSaving}>
            إلغاء
          </button>
          <button type="button" className="projects-primary-action" onClick={submit} disabled={isSaving}>
            {isSaving ? 'جاري الحفظ...' : 'حفظ المشروع'}
          </button>
        </footer>
      </section>
    </div>
  )
}
