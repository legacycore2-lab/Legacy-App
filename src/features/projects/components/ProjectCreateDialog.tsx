import { Save, X } from 'lucide-react'
import type { ProjectCreateFormState } from '../types/project-create.types'

export function ProjectCreateDialog({
  isOpen,
  close,
  value,
  update,
  submitted,
  errors,
  preview,
  review,
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
            <p>أدخل بيانات المشروع الأساسية قبل ربط الحفظ بقاعدة البيانات.</p>
          </div>
          <button type="button" onClick={close} aria-label="إغلاق">
            <X size={18} />
          </button>
        </header>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            review()
          }}
        >
          <div className="project-create-grid">
            <label>
              اسم المشروع
              <input value={value.name} onChange={(event) => update('name', event.target.value)} />
            </label>
            <label>
              كود المشروع
              <input
                value={value.code}
                onChange={(event) => update('code', event.target.value)}
                placeholder="اختياري"
              />
            </label>
            <label>
              اسم العميل
              <input value={value.client} onChange={(event) => update('client', event.target.value)} />
            </label>
            <label>
              الموقع
              <input value={value.location} onChange={(event) => update('location', event.target.value)} />
            </label>
            <label>
              مدير المشروع
              <input value={value.manager} onChange={(event) => update('manager', event.target.value)} />
            </label>
            <label>
              الحالة
              <select
                value={value.status}
                onChange={(event) => update('status', event.target.value as typeof value.status)}
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
                onChange={(event) => update('contractValue', event.target.value)}
              />
            </label>
            <label>
              تاريخ البداية
              <input
                type="date"
                value={value.startDate}
                onChange={(event) => update('startDate', event.target.value)}
              />
            </label>
            <label>
              النهاية المتوقعة
              <input
                type="date"
                value={value.endDate}
                onChange={(event) => update('endDate', event.target.value)}
              />
            </label>
            <label className="project-create-wide">
              ملاحظات
              <textarea value={value.notes} onChange={(event) => update('notes', event.target.value)} />
            </label>
          </div>

          {submitted && errors.length > 0 && (
            <div className="project-create-errors">
              {errors.map((error) => (
                <p key={error}>{error}</p>
              ))}
            </div>
          )}
          {submitted && preview && (
            <div className="project-create-preview">
              <strong>جاهز للمراجعة</strong>
              <span>
                {preview.name} · {preview.client} · {preview.contractValue.toLocaleString('ar-EG')} ج.م
              </span>
            </div>
          )}

          <footer>
            <button type="button" className="projects-secondary-action" onClick={close}>
              إلغاء
            </button>
            <button type="submit" className="projects-primary-action">
              <Save size={17} /> مراجعة المشروع
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}
