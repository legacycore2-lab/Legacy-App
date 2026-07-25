import { Eye, Save, X } from 'lucide-react'
import { useEditJournalForm } from '../hooks/useEditJournalForm'
import type { JournalEntry } from '../types/journal.types'

type Props = {
  entry: JournalEntry
  onClose: () => void
}

export function EditJournalForm({ entry, onClose }: Props) {
  const {
    value,
    submitted,
    errors,
    preview,
    update,
    submit,
    isSaving,
    saveError,
    selectProject,
    selectCategoryAccount,
    selectPaymentAccount,
    selectType,
    projects,
    categoryAccounts,
    paymentAccounts,
    isLoadingOptions,
    optionsError,
  } = useEditJournalForm(entry)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (await submit()) onClose()
  }

  return (
    <section className="journal-entry-card" aria-label="تعديل القيد">
      <header>
        <div>
          <span>تعديل القيد</span>
          <h2>تعديل قيد #{entry.sequence}</h2>
          <p>عدّل البيانات ثم احفظ — سيُعاد ترحيل القيد تلقائيًا.</p>
        </div>
        <button type="button" className="journal-icon-button" onClick={onClose} aria-label="إغلاق">
          <X size={18} />
        </button>
      </header>

      <form onSubmit={handleSubmit}>
        <div className="journal-entry-grid">
          <label>
            التاريخ
            <input
              type="date"
              value={value.entryDate}
              onChange={(e) => update('entryDate', e.target.value)}
            />
          </label>
          <label>
            النوع
            <select
              value={value.type}
              onChange={(e) => selectType(e.target.value as SingleLineJournalInput['type'])}
            >
              <option value="expense">مصروف</option>
              <option value="income">إيراد</option>
            </select>
          </label>
          <label>
            المشروع
            <select value={value.projectId} onChange={(e) => selectProject(e.target.value)}>
              <option value="">اختر المشروع</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            البند
            <select value={value.categoryAccountId} onChange={(e) => selectCategoryAccount(e.target.value)}>
              <option value="">اختر الحساب</option>
              {categoryAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} — {a.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            الحساب المقابل
            <select value={value.paymentAccountId} onChange={(e) => selectPaymentAccount(e.target.value)}>
              <option value="">اختر الحساب المقابل</option>
              {paymentAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} — {a.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            المبلغ
            <input
              inputMode="decimal"
              value={value.amount}
              onChange={(e) => update('amount', e.target.value)}
              placeholder="0.00"
            />
          </label>
          <label className="journal-entry-wide">
            البيان
            <input
              value={value.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="وصف العملية"
            />
          </label>
          <label>
            المقاول / الطرف
            <input
              value={value.contractor}
              onChange={(e) => update('contractor', e.target.value)}
              placeholder="اختياري"
            />
          </label>
        </div>

        {submitted && errors.length > 0 && (
          <div className="journal-entry-errors">
            {errors.map((err) => (
              <p key={err}>{err}</p>
            ))}
          </div>
        )}

        {optionsError && (
          <div className="journal-entry-errors">
            <p>{optionsError}</p>
          </div>
        )}

        {saveError && (
          <div className="journal-entry-errors">
            <p>{saveError}</p>
          </div>
        )}

        {preview && (
          <div className="journal-entry-preview">
            <div>
              <Eye size={17} />
              <strong>المعاينة المحاسبية التلقائية</strong>
            </div>
            <p>
              <span>مدين</span> {preview.debitAccount} — {preview.amount.toLocaleString('ar-EG')} ج.م
            </p>
            <p>
              <span>دائن</span> {preview.creditAccount} — {preview.amount.toLocaleString('ar-EG')} ج.م
            </p>
          </div>
        )}

        <footer>
          <button type="button" className="journal-secondary" onClick={onClose}>
            إلغاء
          </button>
          <button type="submit" className="journal-primary" disabled={isSaving || isLoadingOptions}>
            <Save size={17} /> {isSaving ? 'جارٍ الحفظ...' : 'حفظ التعديل'}
          </button>
        </footer>
      </form>
    </section>
  )
}
