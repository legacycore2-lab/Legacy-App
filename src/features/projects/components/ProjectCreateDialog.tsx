import { LoaderCircle, Save, X } from 'lucide-react'
import type { ProjectCreateFormState } from '../types/project-create.types'

export function ProjectCreateDialog({
  isOpen,
  close,
  value,
  update,
  submitted,
  errors,
  preview,
  isSaving,
  saveError,
  submit,
}: ProjectCreateFormState) {
  if (!isOpen) return null

  return (
    <div className="project-create-backdrop" role="presentation">
      <section
        className="project-create-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="إنشاء مشروع جديد"
      >
        <header>
          <div>
            <span>مشروع جديد</span>
            <h2>إنشاء مشروع</h2>
            <p>أدخل بيانات المشروع، وسيظهر في القائمة فور نجاح الحفظ.</p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="إغلاق"
            disabled={isSaving}
          >
            <X size={18} />
          </button>
        </header>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            void submit()
          }}
        >
          <div className="project-create-grid">
            <label>
              اسم المشروع
              <input
                value={value.name}
                onChange={(event) => update('name', event.target.value)}
                disabled={isSaving}
              />
            </label>
            <label>
              كود المشروع
              <input
                value={value.code}
                onChange={(event) => update('code', event.target.value)}
                placeholder="اختياري"
                disabled={isSaving}
              />
            </label>
            <label>
              اسم العميل
              <input
                value={value.client}
                onChange={(event) => update('client', event.target.value)}
                disabled={isSaving}
              />
            </label>
            <label>
              الموقع
              <input
                value={value.location}
                onChange={(event) => update('location', event.target.value)}
                disabled={isSaving}
              />
            </label>
            <label>
              مدير المشروع
              <input
                value={value.manager}
                onChange={(event) => update('manager', event.target.value)}
                disabled={isSaving}
              />
            </label>
            <label>
              الحالة
              <select
                value={value.status}
                onChange={(event) =>
                  update('status', event.target.value as typeof value.status)
                }
                disabled={isSaving}
              >
                <option value="active">نشط</option>
                <option value="paused">متوقف</option>
                <option value="completed">مكتمل</option>
              </select>
            </label>
            <label>
              قيمة التعاقد
              <input
                inputMode="decimal"
                value={value.contractValue}
                onChange={(event) =>
                  update('contractValue', event.target.value)
                }
                disabled={isSaving}
              />
            </label>
            <label>
              تاريخ البداية
              <input
                type="date"
                value={value.startDate}
                onChange={(event) => update('startDate', event.target.value)}
                disabled={isSaving}
              />
            </label>
            <label>
              النهاية المتوقعة
              <input
                type="date"
                value={value.endDate}
                onChange={(event) => update('endDate', event.target.value)}
                disabled={isSaving}
              />
            </label>
            <label className="project-create-wide">
              ملاحظات
              <textarea
                value={value.notes}
                onChange={(event) => update('notes', event.target.value)}
                disabled={isSaving}
              />
            </label>
          </div>

          {submitted && errors.length > 0 && (
            <div className="project-create-errors" role="alert">
              {errors.map((error) => (
                <p key={error}>{error}</p>
              ))}
            </div>
          )}
          {saveError && (
            <div className="project-create-errors" role="alert">
              <p>{saveError}</p>
            </div>
          )}
          {submitted && preview && !saveError && (
            <div className="project-create-preview">
              <strong>جاهز للحفظ</strong>
              <span>
                {preview.name} · {preview.client} ·{' '}
                {preview.contractValue.toLocaleString('ar-EG')} ج.م
              </span>
            </div>
          )}

          <footer>
            <button
              type="button"
              className="projects-secondary-action"
              onClick={close}
              disabled={isSaving}
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="projects-primary-action"
              disabled={isSaving}
            >
              {isSaving ? (
                <LoaderCircle className="project-create-spinner" size={17} />
              ) : (
                <Save size={17} />
              )}
              {isSaving ? 'جارٍ الحفظ...' : 'حفظ المشروع'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}
