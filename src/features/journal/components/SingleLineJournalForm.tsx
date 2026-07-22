import { Eye, Save, X } from 'lucide-react'
import { useSingleLineJournalForm } from '../hooks/useSingleLineJournalForm'
import type { SingleLineJournalInput } from '../types/journal-entry.types'

type Props = {
  onClose: () => void
}

export function SingleLineJournalForm({ onClose }: Props) {
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
  } = useSingleLineJournalForm()

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (await submit()) onClose()
  }

  return (
    <section className="journal-entry-card" aria-label="إضافة قيد بسطر واحد">
      <header>
        <div>
          <span>إدخال سريع</span>
          <h2>إضافة قيد بسطر واحد</h2>
          <p>أدخل العملية مرة واحدة، وسيُنشئ المحرك طرفي القيد تلقائيًا.</p>
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
              onChange={(event) => update('entryDate', event.target.value)}
            />
          </label>
          <label>
            النوع
            <select
              value={value.type}
              onChange={(event) => selectType(event.target.value as SingleLineJournalInput['type'])}
            >
              <option value="expense">مصروف</option>
              <option value="income">إيراد</option>
            </select>
          </label>
          <label>
            المشروع
            <select value={value.projectId} onChange={(event) => selectProject(event.target.value)}>
              <option value="">اختر المشروع</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            البند
            <select
              value={value.categoryAccountId}
              onChange={(event) => selectCategoryAccount(event.target.value)}
            >
              <option value="">اختر الحساب</option>
              {categoryAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.code} — {account.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            الحساب المقابل
            <select
              value={value.paymentAccountId}
              onChange={(event) => selectPaymentAccount(event.target.value)}
            >
              <option value="">اختر الحساب المقابل</option>
              {paymentAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.code} — {account.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            المبلغ
            <input
              inputMode="decimal"
              value={value.amount}
              onChange={(event) => update('amount', event.target.value)}
              placeholder="0.00"
            />
          </label>
          <label className="journal-entry-wide">
            البيان
            <input
              value={value.description}
              onChange={(event) => update('description', event.target.value)}
              placeholder="وصف العملية"
            />
          </label>
          <label>
            المقاول / الطرف
            <input
              value={value.contractor}
              onChange={(event) => update('contractor', event.target.value)}
              placeholder="اختياري"
            />
          </label>
        </div>

        {submitted && errors.length > 0 && (
          <div className="journal-entry-errors">
            {errors.map((error) => (
              <p key={error}>{error}</p>
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
            <Save size={17} /> {isSaving ? 'جارٍ الحفظ...' : 'حفظ وترحيل القيد'}
          </button>
        </footer>
      </form>
    </section>
  )
}
